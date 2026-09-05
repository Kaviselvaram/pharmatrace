"""
Multi-Signature Custody Handover Endpoints.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.domain.models import BatchModel
from app.domain.schemas import HandoverInitiateRequest, HandoverConfirmRequest
from app.services.web3_service import web3_service
from app.api.websocket import ws_manager

router = APIRouter(prefix="/handover", tags=["Custody Handover"])

# Standard demo private keys for Hardhat accounts
ACCOUNT_KEYS = {
    # Account #1: Manufacturer (0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    # Account #2: Carrier (0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC)
    "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    # Account #3: Hospital (0x90F79bf6EB2c4f870365E785982E1f101E93b906)
    "0x90f79bf6eb2c4f870365e785982e1f101e93b906": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
}


@router.post("/initiate")
async def initiate_handover(payload: HandoverInitiateRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 1: Current custodian signs and initiates custody transfer to recipient.
    """
    batch = await db.get(BatchModel, payload.batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    chain_batch = web3_service.get_batch_from_chain(payload.batch_id)
    current_custodian = chain_batch["current_custodian"].lower() if chain_batch else batch.current_custodian.lower()

    custodian_key = ACCOUNT_KEYS.get(current_custodian)
    if not custodian_key:
        raise HTTPException(status_code=400, detail=f"No private key configured for custodian: {current_custodian}")

    try:
        tx_hash = web3_service.initiate_handover_on_chain(
            batch_id_hex=payload.batch_id,
            recipient_address=payload.recipient_address,
            custodian_private_key=custodian_key
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"On-chain handover initiation failed: {str(e)}")

    await ws_manager.broadcast({
        "type": "HANDOVER_INITIATED",
        "data": {
            "batch_id": payload.batch_id,
            "from": current_custodian,
            "to": payload.recipient_address,
            "tx_hash": tx_hash
        }
    })

    return {
        "status": "INITIATED",
        "batch_id": payload.batch_id,
        "from": current_custodian,
        "to": payload.recipient_address,
        "tx_hash": tx_hash
    }


@router.post("/confirm")
async def confirm_handover(payload: HandoverConfirmRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 2: Recipient counter-signs and finalizes 2-of-2 multi-sig handover.
    """
    batch = await db.get(BatchModel, payload.batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    recipient_address = None
    try:
        req = web3_service.supply_chain_contract.functions.activeHandovers(
            bytes.fromhex(payload.batch_id.replace("0x", ""))
        ).call()
        if not req[2]: # pending boolean
            raise HTTPException(status_code=400, detail="No pending handover found on-chain for this batch")
        recipient_address = req[1].lower()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to query on-chain handover: {str(e)}")

    recipient_key = ACCOUNT_KEYS.get(recipient_address)
    if not recipient_key:
        raise HTTPException(status_code=400, detail=f"No private key configured for recipient: {recipient_address}")

    try:
        tx_hash = web3_service.confirm_handover_on_chain(
            batch_id_hex=payload.batch_id,
            sender_address=payload.sender_address,
            recipient_private_key=recipient_key
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"On-chain handover confirmation failed: {str(e)}")

    # Refresh batch state from chain
    updated_chain = web3_service.get_batch_from_chain(payload.batch_id)
    if updated_chain:
        batch.current_custodian = updated_chain["current_custodian"]
        batch.status = updated_chain["status"]
        await db.commit()

    await ws_manager.broadcast({
        "type": "CUSTODY_TRANSFERRED",
        "data": {
            "batch_id": payload.batch_id,
            "new_custodian": batch.current_custodian,
            "status": batch.status,
            "tx_hash": tx_hash
        }
    })

    return {
        "status": "CONFIRMED",
        "batch_id": payload.batch_id,
        "new_custodian": batch.current_custodian,
        "new_status": batch.status,
        "tx_hash": tx_hash
    }
