# PharmaTrace — Final Demonstration Setup & Orchestration Guide

**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Framework  
**Course / Context:** CBS3002 Information Security Project  
**Authors:** Kaviselvaram Kathirvel & Aniesh S  
**Date:** October 2026 | Verified Execution Baseline  
**Target Environment:** macOS (Darwin arm64/x86_64) / Linux (x86_64)

---

## 1. Quick Start: Single-Command Orchestrated Startup

The complete stack (Hardhat EVM node, contract deployment, database initialization, FastAPI gateway, and Vite React 19 frontend) can be launched with a single supervised root command:

```bash
# From repository root (/Users/kaviselvaramkathirvel/Infosecproj)
npm run demo:start
```

### What `demo:start` executes automatically:
1. **Port conflict & prerequisite check:** Ensures ports `8546`, `8001`, and `5174` are available.
2. **Hardhat Local EVM Node (Port 8546):** Boots local Hardhat node in non-interactive mode.
3. **Smart Contract Verification & Deployment:** Checks or executes `scripts/deploy.js`, deploying `SupplyChainRegistry.sol` and `PharmaSupplyChain.sol`.
4. **Database Migration & Seeding:** Initializes SQLite WAL schema and runs `scripts/seed_demo_data.py` (idempotent).
5. **FastAPI Backend (Port 8001):** Starts Uvicorn with `PYTHONPATH=backend` and performs bounded health check on `http://127.0.0.1:8001/health`.
6. **Vite Frontend Dev Server (Port 5174):** Starts Vite dev server and tests reverse proxy on `http://localhost:5174/api/v1/batches`.
7. **Process Tracking:** Writes verified PIDs to `.run/hardhat.pid`, `.run/backend.pid`, and `.run/frontend.pid`.

---

## 2. Service Management Commands

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Start Stack** | `npm run demo:start` | Orchestrates and boots all services with bounded readiness polling. |
| **Stop Stack** | `npm run demo:stop` | Safely stops tracked PIDs (`.run/*.pid`) without killing unrelated processes. |
| **Status Check** | `npm run demo:status` | Inspects live PID status, port responsiveness, EVM block height, and DB count. |
| **Re-Seed Data** | `npm run demo:seed` | Idempotently refreshes or verifies the 8 demonstration lots. |
| **Verify All** | `npm test` or `bash scripts/verify_all.sh` | Executes full 8-gate end-to-end verification pipeline. |

---

## 3. Dedicated Port Architecture & URLs

| Component | Port | Protocol | Direct URL | Health / Readiness Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **Hardhat EVM Node** | `8546` | JSON-RPC | `http://127.0.0.1:8546` | `POST /` with `{"method": "eth_blockNumber"}` |
| **FastAPI Gateway** | `8001` | HTTP / WS | `http://127.0.0.1:8001` | `GET http://127.0.0.1:8001/health` |
| **Vite React 19 Frontend** | `5174` | HTTP | `http://localhost:5174` | `GET http://localhost:5174/` |
| **Vite WebSocket Proxy** | `5174` | WS | `ws://localhost:5174/ws/telemetry` | Handshake proxies to `8001` |

---

## 4. Environment Configuration (`.env`)

Configuration is auto-loaded by FastAPI and deployment scripts. Key settings:

```ini
# Local EVM Blockchain RPC
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8546
CHAIN_ID=31337

# Deployed Contract Addresses
REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
SUPPLY_CHAIN_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# Database Connection (SQLite WAL)
DATABASE_URL=sqlite:///./data/infosecproj.db

# Edge Node Telemetry Virtual HSM Key (Hardhat Account #2 - Carrier)
TELEMETRY_PRIVATE_KEY=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

# Allowed CORS Origins
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://127.0.0.1:5173","http://127.0.0.1:5174"]
```

---

## 5. Manual Step-by-Step Diagnostic Startup

If individual services need to be inspected in separate terminals:

```bash
# Terminal 1: EVM Blockchain Node
cd contracts
npx hardhat node --port 8546

# Terminal 2: Contract Deployment & Seeding
cd contracts && npx hardhat run scripts/deploy.js --network localhost
cd .. && python3 scripts/seed_demo_data.py

# Terminal 3: FastAPI Backend
source .venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 4: Frontend Dev Server
npm --prefix frontend run dev -- --port 5174
```

---

## 6. Liveness Diagnostics

Verify that all endpoints respond before presenting:
```bash
curl -i http://127.0.0.1:8001/health
curl -i http://127.0.0.1:8001/api/v1/blockchain/status
curl -i http://localhost:5174/api/v1/batches
```
All should return HTTP 200 with valid JSON.
