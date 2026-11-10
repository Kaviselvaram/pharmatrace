"""
Integration Tests for FastAPI Endpoints.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Ensure database schema is created before tests run."""
    await init_db()


@pytest.mark.asyncio
async def test_health_and_root_endpoints():
    """Verify healthcheck and root endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        health_resp = await client.get("/health")
        assert health_resp.status_code == 200
        assert health_resp.json()["status"] == "HEALTHY"

        root_resp = await client.get("/")
        assert root_resp.status_code == 200
        assert "docs_url" in root_resp.json()


@pytest.mark.asyncio
async def test_batch_creation_and_listing():
    """Verify batch creation and listing through REST endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a test batch
        create_payload = {
            "product_name": "Test Biologic Lot Alpha",
            "min_temp_celsius": 2.0,
            "max_temp_celsius": 8.0
        }
        create_resp = await client.post("/api/v1/batches", json=create_payload)
        assert create_resp.status_code == 201
        data = create_resp.json()
        batch_id = data["batch_id"]
        assert batch_id.startswith("0x")
        assert data["product_name"] == "Test Biologic Lot Alpha"
        assert data["status"] == "CREATED"

        # List batches
        list_resp = await client.get("/api/v1/batches")
        assert list_resp.status_code == 200
        batches = list_resp.json()
        assert len(batches) >= 1
        found = any(b["batch_id"] == batch_id for b in batches)
        assert found, "Created batch not found in list output!"

        # Public verification endpoint
        verify_resp = await client.get(f"/api/v1/verify/{batch_id}")
        assert verify_resp.status_code == 200
        verify_data = verify_resp.json()
        assert verify_data["batch_id"] == batch_id
        assert verify_data["is_safe_to_administer"] is True

        # Audit report endpoint
        audit_resp = await client.get(f"/api/v1/audit/{batch_id}/report")
        assert audit_resp.status_code == 200
        audit_data = audit_resp.json()
        assert "21 CFR Part 11" in audit_data["markdown_report"]
        assert audit_data["cold_chain_compliant"] is True


@pytest.mark.asyncio
async def test_blockchain_status_endpoint():
    """Verify blockchain status endpoint format."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/blockchain/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "chain_id" in data
        assert "registry_address" in data
        assert "supply_chain_address" in data


@pytest.mark.asyncio
async def test_batch_creation_validation_errors():
    """Verify validation for invalid temperature boundaries and duplicates."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Invalid temperature bounds (min >= max) must reject with 400
        inv_resp = await client.post("/api/v1/batches", json={
            "product_name": "Invalid Temp Product",
            "min_temp_celsius": 10.0,
            "max_temp_celsius": 2.0
        })
        assert inv_resp.status_code == 400
        assert "Invalid temperature range" in inv_resp.json()["detail"]

        # 2. Equal temperature bounds (min == max) must also reject with 400
        equal_resp = await client.post("/api/v1/batches", json={
            "product_name": "Equal Temp Product",
            "min_temp_celsius": 5.0,
            "max_temp_celsius": 5.0
        })
        assert equal_resp.status_code == 400


@pytest.mark.asyncio
async def test_intelligent_lot_resolution():
    """Verify intelligent resolver handles dirty strings, repeated hashes, and block hashes."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a test lot
        create_resp = await client.post("/api/v1/batches", json={
            "product_name": "Resolution Test Vaccine",
            "min_temp_celsius": 2.0,
            "max_temp_celsius": 8.0
        })
        assert create_resp.status_code == 201
        batch_id = create_resp.json()["batch_id"]
        raw_hex = batch_id.replace("0x", "")

        # 1. Test clean resolution
        r1 = await client.get(f"/api/v1/verify/{batch_id}")
        assert r1.status_code == 200
        assert r1.json()["batch_id"] == batch_id

        # 2. Test doubled 128-char hash (e.g. repeated paste)
        doubled = f"{raw_hex}{raw_hex}"
        r2 = await client.get(f"/api/v1/verify/{doubled}")
        assert r2.status_code == 200
        assert r2.json()["batch_id"] == batch_id

        # 3. Test nested error string wrapper
        dirty = f"Batch lot '{raw_hex}' not found in registry or on-chain EVM storage"
        r3 = await client.get(f"/api/v1/verify/{dirty}")
        assert r3.status_code == 200
        assert r3.json()["batch_id"] == batch_id

        # 4. Test unknown hash returns clean 404 without recursive nesting
        unknown = "0x" + "9" * 64
        r4 = await client.get(f"/api/v1/verify/{unknown}")
        assert r4.status_code == 404
        assert "not found in registry" in r4.json()["detail"]
        assert len(r4.json()["detail"]) < 120
