"""
Comprehensive Edge-Case & Adversarial Tests for QR & Hash Verification.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import pytest
import pytest_asyncio
from unittest.mock import MagicMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from app.services.web3_service import web3_service


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Ensure database schema is created before tests run."""
    await init_db()


@pytest.mark.asyncio
async def test_qr_empty_input_rejection():
    """Verify that empty or whitespace-only hash input returns HTTP 400 Bad Request."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/verify/%20")
        assert resp.status_code == 400
        assert "Empty batch identification hash provided" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_qr_malformed_non_hex_rejection():
    """Verify that inputs with invalid non-hex characters return HTTP 400."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/verify/0xNotAValidHexHash123")
        assert resp.status_code == 400
        assert "Malformed identifier" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_qr_unrelated_evm_tx_rejection():
    """Verify that an EVM transaction receipt with no batch log topics returns HTTP 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Mock web3_service.find_batch_by_tx_hash to return UNRELATED_TX
        orig_find = web3_service.find_batch_by_tx_hash
        web3_service.find_batch_by_tx_hash = MagicMock(return_value="UNRELATED_TX")
        try:
            unrelated_tx = "0x" + "f" * 64
            resp = await client.get(f"/api/v1/verify/{unrelated_tx}")
            assert resp.status_code == 404
            assert "unrelated to any pharmaceutical batch" in resp.json()["detail"]
        finally:
            web3_service.find_batch_by_tx_hash = orig_find


@pytest.mark.asyncio
async def test_qr_ambiguous_block_hash_rejection():
    """Verify that a block containing transactions for multiple distinct lots returns HTTP 400 Ambiguous."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Mock web3_service to simulate a block with 2 lots
        orig_find_block = web3_service.find_batch_by_block
        web3_service.find_batch_by_block = MagicMock(return_value="AMBIGUOUS:0xBatchAlpha,0xBatchBeta")
        try:
            block_hash = "0x" + "e" * 64
            resp = await client.get(f"/api/v1/verify/{block_hash}")
            assert resp.status_code == 400
            assert "Ambiguous block hash" in resp.json()["detail"]
            assert "0xBatchAlpha" in resp.json()["detail"]
        finally:
            web3_service.find_batch_by_block = orig_find_block


@pytest.mark.asyncio
async def test_qr_quarantined_batch_warning():
    """Verify that a quarantined batch returns HTTP 200 with is_safe_to_administer=False."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        from app.core.database import AsyncSessionLocal
        from app.domain.models import BatchModel
        from sqlalchemy import select
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(BatchModel).where(BatchModel.status == "QUARANTINED"))
            q_lot = res.scalars().first()
            quarantined_bid = q_lot.batch_id if q_lot else "0x3333333333333333333333333333333333333333333333333333333333333333"

        resp = await client.get(f"/api/v1/verify/{quarantined_bid}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["batch_id"] == quarantined_bid
        assert data["status"] in ["QUARANTINED", "REPLENISHED"]
        assert data["is_safe_to_administer"] is False
        assert data["cold_chain_breached"] is True
