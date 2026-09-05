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
from app.domain.models import BatchModel, TelemetryModel
from app.domain.schemas import BatchCreateRequest, BatchResponse
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
            # If contract creation fails, bubble up the error
            raise HTTPException(status_code=500, detail=f"On-chain batch creation failed: {str(e)}")

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
    """Lists all pharmaceutical batches registered in the platform."""
    result = await db.execute(select(BatchModel).order_by(BatchModel.created_at.desc()))
    batches = result.scalars().all()

    # Synchronize status with on-chain truth if connected
    response_list = []
    for b in batches:
        chain_data = web3_service.get_batch_from_chain(b.batch_id)
        current_status = chain_data["status"] if chain_data else b.status
        custodian = chain_data["current_custodian"] if chain_data else b.current_custodian

        response_list.append(BatchResponse(
            batch_id=b.batch_id,
            product_name=b.product_name,
            manufacturer_address=b.manufacturer_address,
            current_custodian=custodian,
            min_temp_celsius=b.min_temp_celsius,
            max_temp_celsius=b.max_temp_celsius,
            status=current_status,
            replacement_batch_id=b.replacement_batch_id,
            genesis_tx_hash=b.genesis_tx_hash,
            created_at=b.created_at.isoformat()
        ))
    return response_list


@router.get("/{batch_id}")
async def get_batch_detail(batch_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves detailed batch metadata, on-chain state, and telemetry history."""
    batch = await db.get(BatchModel, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    chain_data = web3_service.get_batch_from_chain(batch_id)

    # Get recent telemetry records
    telem_result = await db.execute(
        select(TelemetryModel)
        .where(TelemetryModel.batch_id == batch_id)
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
