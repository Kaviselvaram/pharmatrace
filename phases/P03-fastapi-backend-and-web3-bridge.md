# Phase 3: FastAPI Backend & Web3.py Bridge

---

## 1. OBJECTIVE
Build the FastAPI REST API, WebSocket broadcaster, Web3.py on-chain RPC integration, and off-chain SQLite caching layer to seamlessly connect the simulation engine to the local EVM ledger and web frontend.

## 2. INPUTS & DEPENDENCIES
- Contract ABIs and addresses generated in Phase 1 (`contracts/deployments/local.json`).
- Simulation engine built in Phase 2.
- `docs/03-api/rest-endpoints.md` and `docs/03-api/websocket-protocol.md`.

## 3. FILES TO CREATE
- `backend/app/core/config.py`
- `backend/app/core/database.py`
- `backend/app/domain/models.py`
- `backend/app/domain/schemas.py`
- `backend/app/services/web3_service.py`
- `backend/app/api/v1/batches.py`
- `backend/app/api/v1/simulation.py`
- `backend/app/api/v1/blockchain.py`
- `backend/app/api/websocket.py`
- `backend/app/main.py`
- `backend/tests/test_api.py`

## 4. IMPLEMENTATION REQUIREMENTS

### 1. `web3_service.py`
- Connects to `http://127.0.0.1:8545` via `Web3(HTTPProvider)`.
- Loads deployed contract instances for `SupplyChainRegistry`, `BatchManager`, `TelemetryVerifier`, `CustodyHandover`, `SelfHealingController`.
- Submits `submitSignedTelemetry` transactions to the EVM.
- Subscribes to contract events (`ColdChainBreach`, `ReplenishmentOrderDispatched`).

### 2. `websocket.py`
- Manages active client connections.
- Broadcaster function distributing telemetry points, mined blocks, and alert events to all connected clients.

### 3. REST Endpoints
- `POST /api/v1/batches`: Create batch on EVM and persist in SQLite.
- `GET /api/v1/batches`: List all batches with on-chain status.
- `POST /api/v1/simulation/start`: Spin up simulation thread.
- `GET /api/v1/blockchain/blocks`: Stream recent blocks.

## 5. TESTING REQUIREMENTS
- Integration test checking batch creation $\rightarrow$ EVM tx mining $\rightarrow$ SQLite record created.
- WebSocket integration test verifying client receives telemetry frames.

## 6. DEFINITION OF DONE
- [ ] `uvicorn app.main:app` starts without errors.
- [ ] Interactive Swagger UI accessible at `http://127.0.0.1:8000/docs`.
- [ ] `pytest backend/tests/test_api.py` passes all endpoint tests.
