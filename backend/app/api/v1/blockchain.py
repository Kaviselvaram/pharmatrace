"""
Blockchain Ledger Explorer & Status Endpoints.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

from fastapi import APIRouter
from app.services.web3_service import web3_service
from app.domain.schemas import BlockchainStatusResponse
from app.core.config import settings

router = APIRouter(prefix="/blockchain", tags=["Blockchain Explorer"])


@router.get("/status", response_model=BlockchainStatusResponse)
async def get_blockchain_status():
    """Returns local EVM connection status, block height, and contract addresses."""
    is_conn = web3_service.is_connected()
    block_num = web3_service.get_block_number() if is_conn else 0
    chain_id = web3_service.get_chain_id() if is_conn else 31337

    contracts_meta = web3_service.deployment_metadata.get("contracts", {})
    reg_addr = contracts_meta.get("SupplyChainRegistry", {}).get("address", "Not Deployed")
    sc_addr = contracts_meta.get("PharmaSupplyChain", {}).get("address", "Not Deployed")

    return BlockchainStatusResponse(
        connected=is_conn,
        chain_id=chain_id,
        block_number=block_num,
        rpc_url=settings.RPC_URL,
        registry_address=reg_addr,
        supply_chain_address=sc_addr
    )


@router.get("/blocks")
async def get_recent_blocks(limit: int = 10):
    """Retrieves recent blocks and transaction summaries from the EVM node."""
    if not web3_service.is_connected():
        return {"blocks": []}

    w3 = web3_service.w3
    latest = w3.eth.block_number
    blocks = []

    start = max(0, latest - limit + 1)
    for b_num in range(latest, start - 1, -1):
        try:
            b = w3.eth.get_block(b_num, full_transactions=True)
            batch_id = web3_service.find_batch_by_block(b.hash.hex())
            product_name = None
            batch_status = None
            if batch_id and not str(batch_id).startswith("AMBIGUOUS:"):
                chain_info = web3_service.get_batch_from_chain(batch_id)
                if chain_info:
                    product_name = chain_info.get("product_name")
                    batch_status = chain_info.get("status")

            tx_summaries = []
            for tx in b.transactions[:5]:
                tx_h = tx.hash.hex()
                t_bid = web3_service.find_batch_by_tx_hash(tx_h)
                tx_summaries.append({
                    "hash": tx_h,
                    "from": tx["from"],
                    "to": tx["to"],
                    "gas": tx["gas"],
                    "batch_id": t_bid if (t_bid and t_bid != "UNRELATED_TX") else None
                })

            blocks.append({
                "number": b.number,
                "hash": b.hash.hex(),
                "timestamp": b.timestamp,
                "transaction_count": len(b.transactions),
                "gas_used": b.gasUsed,
                "batch_id": batch_id if (batch_id and not str(batch_id).startswith("AMBIGUOUS:")) else None,
                "product_name": product_name,
                "batch_status": batch_status,
                "transactions": tx_summaries
            })
        except Exception:
            continue

    return {"current_block": latest, "blocks": blocks}
