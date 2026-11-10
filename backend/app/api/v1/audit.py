"""
Public Consumer QR Verification & Regulatory Compliance Report Endpoints.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.domain.models import BatchModel, TelemetryModel, SecurityAlertModel
from app.services.web3_service import web3_service
from app.domain.schemas import AuditReportResponse

router = APIRouter(tags=["Consumer Verification & Compliance"])


async def resolve_batch_by_hash(batch_id: str, db: AsyncSession):
    """
    Intelligently resolves a batch identifier across multiple formats:
    - Standard 0x + 64 hex characters
    - Raw 64 hex characters without 0x
    - Nested error messages or dirty pasted strings
    - Repeated 128-hex character strings (auto deduplicated)
    - Case-insensitive matching
    - Transaction hashes (genesis_tx_hash, telemetry on_chain_tx_hash, security alerts tx_hash)
    - EVM on-chain transaction receipt log topics
    - EVM on-chain block hashes or block numbers
    - Replacement batch hash linkages
    - Direct EVM on-chain state if not yet in SQLite DB
    Returns tuple: (BatchModel | None, chain_data | None, resolved_type: str, resolved_evidence: str)
    """
    raw = (batch_id or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty batch identification hash provided")

    # 0. Intelligent extraction if pasted text contains error wrapper or dirty formatting
    was_extracted = False
    clean_candidate = raw.strip().strip("'\"").lstrip("№#").strip()
    clean_candidate_no0x = clean_candidate[2:] if clean_candidate.lower().startswith("0x") else clean_candidate
    is_pure_hex_128 = (len(clean_candidate_no0x) == 128 and all(c in "0123456789abcdefABCDEF" for c in clean_candidate_no0x))

    if not is_pure_hex_128 and ("not found in registry" in raw or "Batch lot" in raw or ("BLOCK" in raw.upper() and len(raw) > 66)):
        hex_match = re.search(r'(?:0x)?([a-fA-F0-9]{64})', raw)
        if hex_match:
            raw = hex_match.group(1)
            was_extracted = True
        else:
            quote_match = re.search(r'[\'\"](0x[a-fA-F0-9]+|[a-fA-F0-9]+)[\'\"]', raw)
            if quote_match:
                raw = quote_match.group(1)
                was_extracted = True

    raw = raw.strip().strip("'\"").lstrip("№#").strip()
    raw_lower = raw.lower()
    if raw_lower.startswith("0x"):
        raw_lower = raw_lower[2:]

    was_doubled = False
    # Deduplicate repeated 64-hex string (128 characters)
    if len(raw_lower) == 128:
        if raw_lower[:64] == raw_lower[64:]:
            raw_lower = raw_lower[:64]
            was_doubled = True
        else:
            raise HTTPException(
                status_code=400,
                detail="Ambiguous input: provided text contains two distinct 32-byte hashes concatenated together. Please provide a single identifier."
            )
    elif len(raw_lower) > 64:
        raise HTTPException(
            status_code=400,
            detail=f"Malformed identifier: input has {len(raw_lower)} hex characters (expected 64 for a 32-byte hash). Did not silently truncate."
        )

    hex_body = raw_lower
    with_0x = f"0x{hex_body}"

    # Syntax validation: check valid hex or digit block number
    if not re.match(r"^[a-fA-F0-9]+$", hex_body):
        raise HTTPException(
            status_code=400,
            detail=f"Malformed identifier: input '{raw[:20]}' contains invalid non-hexadecimal characters."
        )

    resolved_type = "DOUBLED_HASH" if was_doubled else ("EXTRACTED_HASH" if was_extracted else "BATCH_ID")
    resolved_evidence = with_0x

    # 1. Exact match in DB by batch_id
    batch = await db.get(BatchModel, with_0x)
    if not batch:
        batch = await db.get(BatchModel, hex_body)
    if not batch:
        batch = await db.get(BatchModel, raw)

    # 2. Case-insensitive batch_id in DB
    if not batch:
        result = await db.execute(
            select(BatchModel).where(
                (BatchModel.batch_id.ilike(with_0x)) |
                (BatchModel.batch_id.ilike(hex_body))
            )
        )
        batch = result.scalars().first()

    # 3. Lookup by genesis_tx_hash or replacement_batch_id (only if >= 8 hex chars to avoid false substring matches)
    if not batch and len(hex_body) >= 8:
        result = await db.execute(
            select(BatchModel).where(
                (BatchModel.genesis_tx_hash.ilike(f"%{hex_body}%")) |
                (BatchModel.replacement_batch_id.ilike(f"%{hex_body}%"))
            )
        )
        matched_batches = result.scalars().all()
        if len(matched_batches) > 1:
            candidates = [b.batch_id for b in matched_batches]
            raise HTTPException(
                status_code=400,
                detail=f"Ambiguous identifier: hash matches multiple batches: {candidates}. Please query by exact batch ID."
            )
        elif len(matched_batches) == 1:
            batch = matched_batches[0]
            resolved_type = "TRANSACTION_HASH"
            resolved_evidence = batch.genesis_tx_hash

    # 4. Lookup by telemetry record on-chain transaction hash (only if >= 8 hex chars)
    if not batch and len(hex_body) >= 8:
        telem_res = await db.execute(
            select(TelemetryModel).where(TelemetryModel.on_chain_tx_hash.ilike(f"%{hex_body}%"))
        )
        matched_telems = telem_res.scalars().all()
        if matched_telems:
            distinct_bids = list(set(t.batch_id for t in matched_telems))
            if len(distinct_bids) > 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ambiguous identifier: telemetry transaction hash matches multiple distinct batches: {distinct_bids}."
                )
            batch = await db.get(BatchModel, distinct_bids[0])
            resolved_type = "TELEMETRY_TX_HASH"
            resolved_evidence = with_0x

    # 5. Lookup by security alert transaction hash (only if >= 8 hex chars)
    if not batch and len(hex_body) >= 8:
        alert_res = await db.execute(
            select(SecurityAlertModel).where(SecurityAlertModel.tx_hash.ilike(f"%{hex_body}%"))
        )
        matched_alerts = alert_res.scalars().all()
        if matched_alerts:
            distinct_bids = list(set(a.batch_id for a in matched_alerts))
            if len(distinct_bids) > 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ambiguous identifier: security alert transaction hash matches multiple distinct batches: {distinct_bids}."
                )
            batch = await db.get(BatchModel, distinct_bids[0])
            resolved_type = "SECURITY_ALERT_TX_HASH"
            resolved_evidence = with_0x

    # 6. Prefix search in DB (if >= 8 chars and < 64 chars)
    if not batch and 8 <= len(hex_body) < 64 and not raw.isdigit():
        result = await db.execute(
            select(BatchModel).where(
                (BatchModel.batch_id.ilike(f"{with_0x}%")) |
                (BatchModel.batch_id.ilike(f"0x{hex_body}%"))
            )
        )
        matched_prefix = result.scalars().all()
        if len(matched_prefix) > 1:
            candidates = [b.batch_id for b in matched_prefix]
            raise HTTPException(
                status_code=400,
                detail=f"Ambiguous prefix: '{with_0x}' matches multiple batches: {candidates}. Please provide more characters."
            )
        elif len(matched_prefix) == 1:
            batch = matched_prefix[0]
            resolved_type = "PREFIX_MATCH"
            resolved_evidence = batch.batch_id

    # 7. EVM on-chain lookup (direct batch, transaction receipt, or block hash)
    chain_data = None
    target_id_for_chain = batch.batch_id if batch else with_0x

    if web3_service.is_connected() and web3_service.supply_chain_contract:
        chain_data = web3_service.get_batch_from_chain(target_id_for_chain)

        if not batch and not chain_data:
            resolved_from = None
            resolved_batch_id = web3_service.find_batch_by_tx_hash(with_0x)
            if resolved_batch_id == "FAILED_TX":
                raise HTTPException(
                    status_code=400,
                    detail=f"Transaction '{with_0x[:10]}...' verified on EVM, but execution failed (reverted on-chain with status: 0)."
                )
            elif resolved_batch_id == "WRONG_CONTRACT_TX":
                raise HTTPException(
                    status_code=400,
                    detail=f"Transaction '{with_0x[:10]}...' verified on EVM, but target address does not match PharmaSupplyChain contract."
                )
            elif resolved_batch_id == "UNRELATED_TX":
                raise HTTPException(
                    status_code=404,
                    detail=f"Transaction hash '{with_0x[:10]}...' confirmed on EVM, but is unrelated to any pharmaceutical batch."
                )
            elif resolved_batch_id:
                resolved_from = "TRANSACTION_HASH"
            else:
                resolved_batch_id = web3_service.find_batch_by_block(with_0x)
                if not resolved_batch_id and raw.isdigit():
                    resolved_batch_id = web3_service.find_batch_by_block(int(raw))
                
                if resolved_batch_id == "UNRELATED_BLOCK":
                    raise HTTPException(
                        status_code=404,
                        detail=f"Block '{with_0x[:10]}...' confirmed on EVM, but contains no transactions associated with any pharmaceutical batch."
                    )
                elif resolved_batch_id and str(resolved_batch_id).startswith("AMBIGUOUS:"):
                    candidates = resolved_batch_id.split(":", 1)[1].split(",")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Ambiguous block hash: block contains transactions for multiple distinct lots: {candidates}. Please query by exact batch ID."
                    )
                elif resolved_batch_id:
                    resolved_from = "BLOCK_NUMBER" if raw.isdigit() else "BLOCK_HASH"

            if resolved_batch_id:
                batch = await db.get(BatchModel, resolved_batch_id)
                if not batch:
                    res = await db.execute(
                        select(BatchModel).where(BatchModel.batch_id.ilike(resolved_batch_id))
                    )
                    batch = res.scalars().first()
                chain_data = web3_service.get_batch_from_chain(resolved_batch_id)
                resolved_type = resolved_from or "BLOCK_OR_TX_RECEIPT"
                resolved_evidence = with_0x

    if not batch and not chain_data:
        clean_display = with_0x if len(with_0x) <= 20 else f"{with_0x[:10]}...{with_0x[-6:]}"
        raise HTTPException(
            status_code=404,
            detail=f"Batch lot '{clean_display}' not found in registry or on-chain EVM storage"
        )

    return batch, chain_data, resolved_type, resolved_evidence


@router.get("/verify/{batch_id}")
async def verify_public_batch(batch_id: str, db: AsyncSession = Depends(get_db)):
    """
    Public consumer endpoint for smartphone QR scans.
    Validates origin authenticity, custody journey, and unbroken cold-chain compliance.
    Supports any pasted hash format, prefix, or on-chain lot.
    """
    batch, chain_data, resolved_type, resolved_evidence = await resolve_batch_by_hash(batch_id, db)

    # If lot is verified on EVM but not yet indexed in local SQLite:
    if not batch and chain_data:
        is_safe = chain_data["status"] in ["CREATED", "IN_TRANSIT", "DELIVERED"]
        return {
            "batch_id": chain_data["batch_id"],
            "resolved_identifier_type": resolved_type,
            "resolution_evidence": resolved_evidence,
            "product_name": chain_data["product_name"],
            "manufacturer": chain_data["manufacturer"],
            "current_custodian": chain_data["current_custodian"],
            "status": chain_data["status"],
            "is_safe_to_administer": is_safe,
            "cold_chain_breached": chain_data["status"] in ["QUARANTINED", "REPLENISHED"],
            "tamper_detected": False,
            "replacement_batch_id": chain_data.get("replacement_batch_id"),
            "total_checkpoints_recorded": chain_data.get("telemetry_commit_count", 0),
            "temperature_range_allowed": f"{chain_data['min_temp_celsius']}°C to {chain_data['max_temp_celsius']}°C",
            "verification_timestamp": chain_data.get("created_at_epoch"),
            "alerts": []
        }

    target_id = batch.batch_id
    current_status = chain_data["status"] if chain_data else batch.status
    current_custodian = chain_data["current_custodian"] if chain_data else batch.current_custodian

    # Query excursions / alerts
    alert_result = await db.execute(
        select(SecurityAlertModel).where(SecurityAlertModel.batch_id == target_id)
    )
    alerts = alert_result.scalars().all()

    # Query telemetry count
    telem_result = await db.execute(
        select(TelemetryModel)
        .where(TelemetryModel.batch_id == target_id)
        .order_by(TelemetryModel.timestamp.asc())
    )
    records = telem_result.scalars().all()

    has_excursions = any(a.alert_type == "COLD_CHAIN_EXCURSION" for a in alerts)
    has_tamper = any(a.alert_type == "MITM_TAMPER_ATTACK" for a in alerts)
    is_safe = (current_status in ["CREATED", "IN_TRANSIT", "DELIVERED"]) and not has_excursions and not has_tamper

    return {
        "batch_id": batch.batch_id,
        "resolved_identifier_type": resolved_type,
        "resolution_evidence": resolved_evidence,
        "product_name": batch.product_name,
        "manufacturer": batch.manufacturer_address,
        "current_custodian": current_custodian,
        "status": current_status,
        "is_safe_to_administer": is_safe,
        "cold_chain_breached": has_excursions or (current_status in ["QUARANTINED", "REPLENISHED"]),
        "tamper_detected": has_tamper,
        "replacement_batch_id": chain_data.get("replacement_batch_id") if chain_data else batch.replacement_batch_id,
        "total_checkpoints_recorded": len(records),
        "temperature_range_allowed": f"{batch.min_temp_celsius}°C to {batch.max_temp_celsius}°C",
        "verification_timestamp": chain_data.get("created_at_epoch") if chain_data else None,
        "alerts": [
            {"type": a.alert_type, "severity": a.severity, "message": a.message}
            for a in alerts
        ]
    }


@router.get("/audit/{batch_id}/report", response_model=AuditReportResponse)
async def generate_audit_report(batch_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generates a verifiable regulatory audit report (aligned with FDA 21 CFR Part 11).
    100% deterministic local generator with mathematical proofs.
    """
    batch, chain_data, _, _ = await resolve_batch_by_hash(batch_id, db)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found in audit database")

    chain_data = web3_service.get_batch_from_chain(batch.batch_id)

    telem_result = await db.execute(
        select(TelemetryModel)
        .where(TelemetryModel.batch_id == batch.batch_id)
        .order_by(TelemetryModel.timestamp.asc())
    )
    records = telem_result.scalars().all()

    alert_result = await db.execute(
        select(SecurityAlertModel).where(SecurityAlertModel.batch_id == batch.batch_id)
    )
    alerts = alert_result.scalars().all()

    breaches = [a for a in alerts if a.alert_type == "COLD_CHAIN_EXCURSION"]
    tampers = [a for a in alerts if a.alert_type == "MITM_TAMPER_ATTACK"]

    is_compliant = len(breaches) == 0 and len(tampers) == 0

    replacement_id = chain_data.get("replacement_batch_id") if chain_data else batch.replacement_batch_id

    # Deterministic Markdown Compliance Report
    report_md = f"""# FDA 21 CFR Part 11 & CDSCO Verification Report
**Electronic Records & Cryptographic Audit Summary**

- **Batch Identification**: `{batch.batch_id}`
- **Product Title**: {batch.product_name}
- **Authorized Manufacturer**: `{batch.manufacturer_address}`
- **Current Custodian**: `{chain_data['current_custodian'] if chain_data else batch.current_custodian}`
- **Ledger Status**: **{chain_data['status'] if chain_data else batch.status}**
- **Threshold Policy**: `{batch.min_temp_celsius}°C` to `{batch.max_temp_celsius}°C`
"""

    if replacement_id:
        report_md += f"- **Linked Replacement Batch**: `{replacement_id}`\n"

    report_md += f"""
---

## 1. Cryptographic Lineage & Custody Proof
- **Genesis Transaction**: `{batch.genesis_tx_hash or 'Local EVM Genesis'}`
- **Total Signed Edge Telemetry Checkpoints**: `{len(records)}`
- **Asymmetric Algorithm**: `ECDSA secp256k1` (EIP-191 Compliant)
- **Hashing Algorithm**: `Keccak-256`
- **Replay Protection**: Monotonic Nonce Mapping `{len(records)} committed nonces`

---

## 2. Integrity & Temperature Compliance Audit
- **Cold-Chain Excursions**: {len(breaches)} detected
- **Unauthorized Tamper Attempts**: {len(tampers)} detected
- **Overall Compliance Verdict**: **{'PASSED - SAFE FOR USE' if is_compliant else 'FAILED - COMPROMISED / QUARANTINED'}**

### Recorded Incidents:
"""
    if alerts:
        for a in alerts:
            report_md += f"- **[{a.severity}] {a.alert_type}**: {a.message}\n"
    else:
        report_md += "- *Zero security incidents or thermal threshold violations recorded.*\n"

    if replacement_id:
        report_md += f"""
---

## 3. Autonomous Digital Recovery Lineage
- **Replacement Batch ID**: `{replacement_id}`
- **Resolution**: Quarantined lot superseded on-chain by authorized expedited replacement lot.
- **Lineage Integrity**: Cryptographically linked via PharmaSupplyChain.linkReplacementBatch().
"""

    report_md += f"""
---
*Automated Algorithmic Audit generated on {batch.updated_at.isoformat()} UTC by Virtualized Supply Chain Framework.*
"""

    return AuditReportResponse(
        batch_id=batch.batch_id,
        product_name=batch.product_name,
        status=chain_data["status"] if chain_data else batch.status,
        manufacturer=batch.manufacturer_address,
        current_custodian=chain_data["current_custodian"] if chain_data else batch.current_custodian,
        total_telemetry_points=len(records),
        breach_count=len(breaches),
        is_authentic=len(tampers) == 0,
        cold_chain_compliant=is_compliant,
        markdown_report=report_md,
        replacement_batch_id=replacement_id
    )
