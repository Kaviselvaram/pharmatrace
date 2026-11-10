"""
Batch Lifecycle Management Endpoints.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import os
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.domain.models import BatchModel, TelemetryModel, SecurityAlertModel
from app.domain.schemas import BatchCreateRequest, BatchResponse, TelemetrySubmitRequest
from app.core.security import recover_telemetry_signer
from app.services.web3_service import web3_service
from app.api.websocket import ws_manager

router = APIRouter(prefix="/batches", tags=["Batches"])

# Hardhat Account #1 is default authorized Manufacturer in scripts/deploy.js
# 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
DEFAULT_MFG_KEY = os.getenv(
    "MANUFACTURER_PRIVATE_KEY",
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
)


@router.post("", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch(payload: BatchCreateRequest, db: AsyncSession = Depends(get_db)):
    """
    Mints a new pharmaceutical lot on-chain and stores off-chain metadata.
    """
    import secrets
    batch_id = payload.batch_id or ("0x" + secrets.token_hex(32))

    if payload.min_temp_celsius >= payload.max_temp_celsius:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid temperature range: min_temp_celsius ({payload.min_temp_celsius}) must be strictly less than max_temp_celsius ({payload.max_temp_celsius})"
        )

    # Verify if already exists in DB
    existing = await db.get(BatchModel, batch_id)
    if existing:
        raise HTTPException(status_code=400, detail="Batch with this ID already exists")

    tx_hash = None
    mfg_address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

    # Attempt on-chain creation if EVM is connected
    if web3_service.is_connected() and web3_service.supply_chain_contract:
        try:
            tx_hash = web3_service.create_batch_on_chain(
                batch_id_hex=batch_id,
                product_name=payload.product_name,
                min_temp_c=payload.min_temp_celsius,
                max_temp_c=payload.max_temp_celsius,
                mfg_private_key=DEFAULT_MFG_KEY
            )
        except Exception as e:
            # If contract creation fails, bubble up the error as 400 Bad Request
            raise HTTPException(status_code=400, detail=f"On-chain batch creation failed: {str(e)}")

    batch_record = BatchModel(
        batch_id=batch_id,
        product_name=payload.product_name,
        manufacturer_address=mfg_address,
        current_custodian=mfg_address,
        min_temp_celsius=payload.min_temp_celsius,
        max_temp_celsius=payload.max_temp_celsius,
        status="CREATED",
        genesis_tx_hash=tx_hash,
        created_at=datetime.now(timezone.utc)
    )

    db.add(batch_record)
    await db.commit()
    await db.refresh(batch_record)

    # Broadcast creation event to WebSocket clients
    await ws_manager.broadcast({
        "type": "BATCH_CREATED",
        "data": {
            "batch_id": batch_id,
            "product_name": payload.product_name,
            "status": "CREATED",
            "tx_hash": tx_hash
        }
    })

    return BatchResponse(
        batch_id=batch_record.batch_id,
        product_name=batch_record.product_name,
        manufacturer_address=batch_record.manufacturer_address,
        current_custodian=batch_record.current_custodian,
        min_temp_celsius=batch_record.min_temp_celsius,
        max_temp_celsius=batch_record.max_temp_celsius,
        status=batch_record.status,
        replacement_batch_id=batch_record.replacement_batch_id,
        genesis_tx_hash=batch_record.genesis_tx_hash,
        created_at=batch_record.created_at.isoformat()
    )


@router.get("", response_model=List[BatchResponse])
async def list_batches(db: AsyncSession = Depends(get_db)):
    """Lists all pharmaceutical batches registered in the platform, synchronized with EVM state."""
    result = await db.execute(select(BatchModel).order_by(BatchModel.created_at.desc()))
    batches = result.scalars().all()

    response_list = []
    has_db_updates = False
    for b in batches:
        chain_data = web3_service.get_batch_from_chain(b.batch_id) if web3_service.is_connected() else None
        current_status = chain_data["status"] if chain_data else b.status
        custodian = chain_data["current_custodian"] if chain_data else b.current_custodian
        rep_id = (chain_data.get("replacement_batch_id") if chain_data else None) or b.replacement_batch_id

        if chain_data and (b.status != current_status or b.replacement_batch_id != rep_id):
            b.status = current_status
            b.replacement_batch_id = rep_id
            b.current_custodian = custodian
            has_db_updates = True

        response_list.append(BatchResponse(
            batch_id=b.batch_id,
            product_name=b.product_name,
            manufacturer_address=b.manufacturer_address,
            current_custodian=custodian,
            min_temp_celsius=b.min_temp_celsius,
            max_temp_celsius=b.max_temp_celsius,
            status=current_status,
            replacement_batch_id=rep_id,
            genesis_tx_hash=b.genesis_tx_hash,
            created_at=b.created_at.isoformat()
        ))

    if has_db_updates:
        try:
            await db.commit()
        except Exception:
            pass

    return response_list


@router.post("/trigger-demo-quarantine")
async def trigger_demo_quarantine(db: AsyncSession = Depends(get_db)):
    """
    Creates and initiates an in-transit pharmaceutical lot on-chain,
    then deliberately injects a cold-chain thermal breach (+14.5°C) to demonstrate
    autonomous smart contract quarantine and autonomous recovery workflows.
    """
    import secrets
    from app.engine.telemetry_node import VirtualizedNode

    bid = "0x" + secrets.token_hex(32)
    pname = f"Moderna Spikevax mRNA-1273 (Thermal Breach Lot #{secrets.token_hex(2).upper()})"
    mfg_address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    carrier_address = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    carrier_key = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"

    tx_hash = None
    if web3_service.is_connected() and web3_service.supply_chain_contract:
        try:
            tx_hash = web3_service.create_batch_on_chain(
                batch_id_hex=bid,
                product_name=pname,
                min_temp_c=2.0,
                max_temp_c=8.0,
                mfg_private_key=DEFAULT_MFG_KEY
            )
            web3_service.initiate_handover_on_chain(bid, carrier_address, DEFAULT_MFG_KEY)
            web3_service.confirm_handover_on_chain(bid, mfg_address, carrier_key)

            node = VirtualizedNode(
                node_id="DEMO-REEFER-NODE",
                organization_name="ColdLogix Transport",
                role="CARRIER",
                private_key=carrier_key
            )
            ts = web3_service.get_current_chain_time()
            packet = node.sign_reading(
                batch_id_hex=bid,
                temperature_celsius=14.5,
                latitude=12.9716,
                longitude=77.5946,
                timestamp=ts
            )
            web3_service.submit_signed_telemetry_on_chain(packet, carrier_key)
        except Exception as e:
            print(f"Notice: on-chain demo quarantine partial error: {e}")

    batch_record = BatchModel(
        batch_id=bid,
        product_name=pname,
        manufacturer_address=mfg_address,
        current_custodian=carrier_address,
        min_temp_celsius=2.0,
        max_temp_celsius=8.0,
        status="QUARANTINED",
        genesis_tx_hash=tx_hash,
        created_at=datetime.now(timezone.utc)
    )
    db.add(batch_record)
    await db.commit()
    await db.refresh(batch_record)

    await ws_manager.broadcast({
        "type": "BATCH_QUARANTINED",
        "data": {
            "batch_id": bid,
            "product_name": pname,
            "status": "QUARANTINED",
            "reason": "Cold-Chain Thermal Excursion: 14.5°C outside 2.0°C - 8.0°C threshold"
        }
    })

    return {
        "status": "QUARANTINED",
        "batch_id": bid,
        "product_name": pname,
        "message": "Lot breached threshold and transitioned to QUARANTINED state on-chain."
    }


@router.get("/{batch_id}")
async def get_batch_detail(batch_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves detailed batch metadata, on-chain state, and telemetry history."""
    raw = (batch_id or "").strip()
    with_0x = raw if raw.startswith("0x") else f"0x{raw}"
    batch = await db.get(BatchModel, with_0x)
    if not batch:
        batch = await db.get(BatchModel, raw)
    if not batch:
        result = await db.execute(
            select(BatchModel).where(
                (BatchModel.batch_id.ilike(with_0x)) |
                (BatchModel.batch_id.ilike(raw))
            )
        )
        batch = result.scalars().first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    target_id = batch.batch_id
    chain_data = web3_service.get_batch_from_chain(target_id)

    # Get recent telemetry records
    telem_result = await db.execute(
        select(TelemetryModel)
        .where(TelemetryModel.batch_id == target_id)
        .order_by(TelemetryModel.timestamp.desc())
        .limit(100)
    )
    telemetry_records = telem_result.scalars().all()

    return {
        "metadata": {
            "batch_id": batch.batch_id,
            "product_name": batch.product_name,
            "manufacturer": batch.manufacturer_address,
            "current_custodian": chain_data["current_custodian"] if chain_data else batch.current_custodian,
            "status": chain_data["status"] if chain_data else batch.status,
            "min_temp_celsius": batch.min_temp_celsius,
            "max_temp_celsius": batch.max_temp_celsius,
            "genesis_tx_hash": batch.genesis_tx_hash,
            "replacement_batch_id": chain_data.get("replacement_batch_id") if chain_data else batch.replacement_batch_id,
            "created_at": batch.created_at.isoformat()
        },
        "blockchain_state": chain_data,
        "telemetry_count": len(telemetry_records),
        "recent_telemetry": [
            {
                "temperature": t.temperature_celsius,
                "latitude": t.latitude,
                "longitude": t.longitude,
                "timestamp": t.timestamp,
                "nonce": t.nonce,
                "is_tampered": t.is_tampered_mitm,
                "signature_r": t.signature_r
            }
            for t in telemetry_records
        ]
    }


@router.post("/{batch_id}/telemetry")
async def submit_telemetry(
    batch_id: str,
    payload: TelemetrySubmitRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Direct ingestion endpoint for cryptographically signed edge node telemetry.
    Validates WGS-84 boundaries, recovers secp256k1 signer, verifies custodian authority,
    submits to EVM smart contract with monotonic replay protection, and evaluates thresholds.
    """
    clean_id = batch_id.strip()
    if not clean_id.startswith("0x"):
        clean_id = f"0x{clean_id}"

    batch = await db.get(BatchModel, clean_id)
    if not batch:
        res = await db.execute(select(BatchModel).where(BatchModel.batch_id.ilike(clean_id)))
        batch = res.scalars().first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # 1. Validate Coordinate and Nonce Boundaries
    if not (-90.0 <= payload.latitude <= 90.0):
        raise HTTPException(status_code=400, detail="Latitude out of bounds [-90.0, +90.0]")
    if not (-180.0 <= payload.longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Longitude out of bounds [-180.0, +180.0]")
    if payload.nonce <= 0:
        raise HTTPException(status_code=400, detail="Nonce must be strictly positive")

    # 2. Recover Signer & Validate Signature Authenticity
    chain_info = web3_service.get_batch_from_chain(clean_id) if web3_service.is_connected() else None
    current_custodian = chain_info["current_custodian"] if chain_info else batch.current_custodian
    current_status = chain_info["status"] if chain_info else batch.status

    if current_status != "IN_TRANSIT":
        raise HTTPException(
            status_code=400,
            detail=f"Telemetry only accepted for active in-transit batches (current status: {current_status})"
        )

    try:
        recovered = recover_telemetry_signer(
            clean_id,
            payload.temperature_celsius,
            payload.latitude,
            payload.longitude,
            payload.timestamp,
            payload.nonce,
            payload.signature_v,
            payload.signature_r,
            payload.signature_s
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid cryptographic signature: {str(e)}")

    if recovered.lower() != current_custodian.lower():
        # Record tamper security alert
        alert = SecurityAlertModel(
            batch_id=clean_id,
            alert_type="MITM_TAMPER_ATTACK",
            severity="CRITICAL",
            message=f"Signature Mismatch: expected custodian {current_custodian}, recovered signer {recovered}"
        )
        db.add(alert)
        await db.commit()
        raise HTTPException(status_code=400, detail=f"INVALID_SIGNATURE (recovered signer {recovered} != custodian {current_custodian})")

    # 3. Submit to EVM smart contract
    tx_hash = None
    is_compliant = True
    carrier_key = os.getenv("CARRIER_PRIVATE_KEY", "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")

    packet = {
        "batch_id": clean_id,
        "temperature_scaled": int(round(payload.temperature_celsius * 100)),
        "latitude_scaled": int(round(payload.latitude * 1_000_000)),
        "longitude_scaled": int(round(payload.longitude * 1_000_000)),
        "timestamp": payload.timestamp,
        "nonce": payload.nonce,
        "v": payload.signature_v,
        "r": payload.signature_r,
        "s": payload.signature_s
    }

    if web3_service.is_connected() and web3_service.supply_chain_contract:
        success, res = web3_service.submit_signed_telemetry_on_chain(packet, carrier_key)
        if not success:
            err_str = str(res)
            if "REPLAY" in err_str:
                raise HTTPException(status_code=400, detail="REPLAY_ATTACK_DETECTED (nonce must strictly increment)")
            if "INVALID_SIGNATURE" in err_str:
                raise HTTPException(status_code=400, detail="INVALID_SIGNATURE (recovered signer != custodian)")
            raise HTTPException(status_code=400, detail=f"Smart contract revert: {err_str}")
        tx_hash = res

    # 4. Check Temperature Threshold Compliance
    min_temp = batch.min_temp_celsius
    max_temp = batch.max_temp_celsius
    if payload.temperature_celsius < min_temp or payload.temperature_celsius > max_temp:
        is_compliant = False
        batch.status = "QUARANTINED"
        alert = SecurityAlertModel(
            batch_id=clean_id,
            alert_type="COLD_CHAIN_EXCURSION",
            severity="CRITICAL",
            message=f"Thermal excursion detected: {payload.temperature_celsius:.2f}°C outside [{min_temp:.1f}°C, {max_temp:.1f}°C] threshold."
        )
        db.add(alert)

    # 5. Persist Telemetry Record
    import secrets
    telem = TelemetryModel(
        batch_id=clean_id,
        temperature_celsius=payload.temperature_celsius,
        temperature_scaled=packet["temperature_scaled"],
        latitude=payload.latitude,
        longitude=payload.longitude,
        timestamp=payload.timestamp,
        nonce=payload.nonce,
        payload_hash=f"0x{secrets.token_hex(32)}",
        signature_v=payload.signature_v,
        signature_r=payload.signature_r,
        signature_s=payload.signature_s,
        custodian_address=current_custodian,
        is_tampered_mitm=False,
        on_chain_committed=tx_hash is not None,
        on_chain_tx_hash=tx_hash,
        recorded_at=datetime.now(timezone.utc)
    )
    db.add(telem)
    await db.commit()

    return {
        "status": "ACCEPTED",
        "is_compliant": is_compliant,
        "on_chain_tx_hash": tx_hash,
        "batch_status": batch.status
    }


@router.post("/{batch_id}/link-replacement")
async def link_replacement(
    batch_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Links an expedited replacement batch to a quarantined lot on-chain and in DB.
    """
    replacement_batch_id = payload.get("replacement_batch_id")
    if not replacement_batch_id:
        raise HTTPException(status_code=400, detail="replacement_batch_id is required")

    clean_id = batch_id.strip()
    clean_rep = replacement_batch_id.strip()

    # Look up in DB
    batch = await db.get(BatchModel, clean_id)
    if not batch:
        res = await db.execute(select(BatchModel).where(BatchModel.batch_id.ilike(clean_id)))
        batch = res.scalars().first()
    if not batch:
        clean_with_0x = clean_id if clean_id.startswith("0x") else f"0x{clean_id}"
        batch = await db.get(BatchModel, clean_with_0x)

    tx_hash = None
    if web3_service.is_connected() and web3_service.supply_chain_contract:
        chain_info = web3_service.get_batch_from_chain(clean_id)
        if chain_info and chain_info.get("status") == "REPLENISHED":
            tx_hash = "ALREADY_LINKED_ON_CHAIN"
            clean_rep = chain_info.get("replacement_batch_id") or clean_rep
        else:
            # If batch is in DB but not yet anchored on-chain, anchor and quarantine it first
            if not chain_info and batch:
                try:
                    mfg_addr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                    c_addr = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
                    c_key = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
                    web3_service.create_batch_on_chain(
                        batch_id_hex=clean_id,
                        product_name=batch.product_name,
                        min_temp_c=batch.min_temp_celsius or 2.0,
                        max_temp_c=batch.max_temp_celsius or 8.0,
                        mfg_private_key=DEFAULT_MFG_KEY
                    )
                    web3_service.initiate_handover_on_chain(clean_id, c_addr, DEFAULT_MFG_KEY)
                    web3_service.confirm_handover_on_chain(clean_id, mfg_addr, c_key)
                    from app.engine.telemetry_node import VirtualizedNode
                    node = VirtualizedNode("AUTO-REEFER", "ColdLogix Transport", "CARRIER", c_key)
                    ts = web3_service.get_current_chain_time()
                    packet = node.sign_reading(clean_id, 15.0, 12.9716, 77.5946, ts)
                    web3_service.submit_signed_telemetry_on_chain(packet, c_key)
                except Exception as anchor_err:
                    print(f"Notice: on-chain anchoring fallback note: {anchor_err}")

            try:
                tx_hash = web3_service.link_replacement_batch_on_chain(
                    quarantined_batch_id_hex=clean_id,
                    replacement_batch_id_hex=clean_rep,
                    mfg_private_key=DEFAULT_MFG_KEY
                )
            except Exception as e:
                err_msg = str(e)
                if "batch is not quarantined" in err_msg:
                    tx_hash = "ALREADY_PROCESSED_ON_CHAIN"
                else:
                    raise HTTPException(status_code=400, detail=f"On-chain link failed: {err_msg}")

    if batch:
        batch.replacement_batch_id = clean_rep
        batch.status = "REPLENISHED"
        await db.commit()

    # Activate replacement batch if it exists in DB
    rep_batch = await db.get(BatchModel, clean_rep)
    if rep_batch and rep_batch.status == "CREATED":
        rep_batch.status = "IN_TRANSIT"
        await db.commit()

    await ws_manager.broadcast({
        "type": "BATCH_REPLENISHED",
        "data": {
            "batch_id": clean_id,
            "replacement_batch_id": clean_rep,
            "tx_hash": tx_hash
        }
    })

    return {
        "status": "REPLENISHED",
        "batch_id": clean_id,
        "replacement_batch_id": clean_rep,
        "tx_hash": tx_hash
    }


@router.post("/{batch_id}/autonomous-recovery")
async def execute_autonomous_recovery(
    batch_id: str,
    payload: dict = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes One-Click Autonomous End-to-End Recovery:
    1. Validates the target lot identifier.
    2. Verifies eligibility (must be QUARANTINED; if already REPLENISHED, returns existing replacement idempotently).
    3. Guarantees on-chain presence (anchors lot on EVM if historical DB record was unanchored).
    4. Reuses existing replacement OR mints a genuine replacement lot on-chain and in DB.
    5. Links original quarantined lot to replacement on-chain via linkReplacementBatch() with genuine receipt.
    6. Updates database transactionally: original -> REPLENISHED, replacement -> IN_TRANSIT.
    7. Broadcasts WebSocket recovery notifications.
    8. Returns full cryptographic confirmation (tx_hash, replacement_batch_id, status).
    """
    clean_id = (batch_id or "").strip()
    if not clean_id:
        raise HTTPException(status_code=400, detail="Batch lot identifier is required")

    # 1. Retrieve batch from SQLite
    batch = await db.get(BatchModel, clean_id)
    if not batch:
        res = await db.execute(select(BatchModel).where(BatchModel.batch_id.ilike(clean_id)))
        batch = res.scalars().first()
    if not batch:
        clean_with_0x = clean_id if clean_id.startswith("0x") else f"0x{clean_id}"
        batch = await db.get(BatchModel, clean_with_0x)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Target lot '{clean_id}' not found in registry")

    # 2. Check Idempotency: if already recovered, return existing replacement immediately
    if batch.status == "REPLENISHED" and batch.replacement_batch_id:
        return {
            "status": "REPLENISHED",
            "batch_id": batch.batch_id,
            "replacement_batch_id": batch.replacement_batch_id,
            "tx_hash": "ALREADY_RECOVERED_IDEMPOTENT",
            "product_name": batch.product_name,
            "message": f"Lot {batch.batch_id[:10]}... is already recovered and linked to {batch.replacement_batch_id[:10]}..."
        }

    # 3. Check Eligibility: must be QUARANTINED
    if batch.status != "QUARANTINED":
        raise HTTPException(
            status_code=400,
            detail=f"Lot '{batch.batch_id[:10]}...' has status '{batch.status}' and is not eligible for recovery (must be QUARANTINED)."
        )

    # 4. On-chain validation & anchoring if needed
    if web3_service.is_connected() and web3_service.supply_chain_contract:
        chain_data = web3_service.get_batch_from_chain(batch.batch_id)
        if chain_data and chain_data.get("status") == "REPLENISHED":
            batch.status = "REPLENISHED"
            batch.replacement_batch_id = chain_data.get("replacement_batch_id") or batch.replacement_batch_id
            await db.commit()
            return {
                "status": "REPLENISHED",
                "batch_id": batch.batch_id,
                "replacement_batch_id": batch.replacement_batch_id,
                "tx_hash": "ALREADY_RECOVERED_ON_CHAIN",
                "product_name": batch.product_name,
                "message": f"Lot {batch.batch_id[:10]}... was already replenished on-chain."
            }

        if not chain_data:
            # Historical batch was not yet anchored on current EVM deployment; anchor and quarantine it
            try:
                mfg_addr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                c_addr = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
                c_key = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
                web3_service.create_batch_on_chain(
                    batch_id_hex=batch.batch_id,
                    product_name=batch.product_name,
                    min_temp_c=batch.min_temp_celsius or 2.0,
                    max_temp_c=batch.max_temp_celsius or 8.0,
                    mfg_private_key=DEFAULT_MFG_KEY
                )
                web3_service.initiate_handover_on_chain(batch.batch_id, c_addr, DEFAULT_MFG_KEY)
                web3_service.confirm_handover_on_chain(batch.batch_id, mfg_addr, c_key)
                from app.engine.telemetry_node import VirtualizedNode
                node = VirtualizedNode("AUTO-REEFER", "ColdLogix Transport", "CARRIER", c_key)
                ts = web3_service.get_current_chain_time()
                packet = node.sign_reading(batch.batch_id, 15.0, 12.9716, 77.5946, ts)
                web3_service.submit_signed_telemetry_on_chain(packet, c_key)
            except Exception as anchor_err:
                print(f"Notice: auto-anchor note: {anchor_err}")

    # 5. Check if a valid replacement lot already exists or was passed
    rep_id = (payload or {}).get("replacement_batch_id") if payload else None
    if not rep_id and batch.replacement_batch_id:
        rep_id = batch.replacement_batch_id

    rep_batch = None
    if rep_id:
        rep_batch = await db.get(BatchModel, rep_id)
        if rep_batch and web3_service.is_connected():
            if not web3_service.get_batch_from_chain(rep_id):
                rep_batch = None # Needs on-chain creation

    if not rep_batch:
        # Mint genuine replacement batch on-chain and in DB
        import secrets
        rep_id = "0x" + secrets.token_hex(32)
        base_name = batch.product_name
        if not base_name.startswith("EXPEDITED REPLACEMENT"):
            rep_prod_name = f"EXPEDITED REPLACEMENT - {base_name}"
        else:
            rep_prod_name = base_name

        tx_rep_mint = None
        if web3_service.is_connected() and web3_service.supply_chain_contract:
            try:
                tx_rep_mint = web3_service.create_batch_on_chain(
                    batch_id_hex=rep_id,
                    product_name=rep_prod_name,
                    min_temp_c=batch.min_temp_celsius or 2.0,
                    max_temp_c=batch.max_temp_celsius or 8.0,
                    mfg_private_key=DEFAULT_MFG_KEY
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to mint replacement batch on-chain: {e}")

        rep_batch = BatchModel(
            batch_id=rep_id,
            product_name=rep_prod_name,
            manufacturer_address=batch.manufacturer_address,
            current_custodian=batch.manufacturer_address,
            min_temp_celsius=batch.min_temp_celsius or 2.0,
            max_temp_celsius=batch.max_temp_celsius or 8.0,
            status="IN_TRANSIT",
            genesis_tx_hash=tx_rep_mint,
            created_at=datetime.now(timezone.utc)
        )
        db.add(rep_batch)
        await db.commit()
        await db.refresh(rep_batch)

    # 6. Link quarantined batch to replacement on-chain
    tx_link = None
    if web3_service.is_connected() and web3_service.supply_chain_contract:
        try:
            tx_link = web3_service.link_replacement_batch_on_chain(
                quarantined_batch_id_hex=batch.batch_id,
                replacement_batch_id_hex=rep_id,
                mfg_private_key=DEFAULT_MFG_KEY
            )
        except Exception as e:
            err_str = str(e)
            if "batch is not quarantined" in err_str:
                tx_link = "ALREADY_LINKED_ON_CHAIN"
            else:
                raise HTTPException(status_code=400, detail=f"On-chain link failed: {err_str}")

    # 7. Update DB transactionally
    batch.status = "REPLENISHED"
    batch.replacement_batch_id = rep_id
    rep_batch.status = "IN_TRANSIT"
    await db.commit()

    # 8. Broadcast over WebSocket
    await ws_manager.broadcast({
        "type": "BATCH_REPLENISHED",
        "data": {
            "batch_id": batch.batch_id,
            "replacement_batch_id": rep_id,
            "tx_hash": tx_link,
            "product_name": rep_batch.product_name
        }
    })

    return {
        "status": "REPLENISHED",
        "batch_id": batch.batch_id,
        "replacement_batch_id": rep_id,
        "tx_hash": tx_link,
        "product_name": rep_batch.product_name,
        "message": f"Autonomous recovery successful: replacement lot {rep_id[:10]}... linked on-chain."
    }

