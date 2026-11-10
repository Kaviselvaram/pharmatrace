# PharmaTrace — Demonstration Setup Guide

**Project:** PharmaTrace — Blockchain-Secured Cold-Chain Cryptographic Traceability  
**Target Environment:** macOS / Linux  
**Repository Architecture:**
- **Smart Contracts:** Solidity `^0.8.20`, Hardhat, Ethers.js v6
- **Backend Service:** Python 3.11+ / FastAPI, Web3.py, SQLAlchemy, SQLite WAL
- **Frontend SPA:** React 19, Vite, Vanilla Obsidian Design System CSS

---

## 1. System Requirements & Port Allocation

| Component | Default Port | Dedicated Non-Conflicting Port | Protocol | Command / Service |
|---|---|---|---|---|
| **Hardhat EVM Local Node** | 8545 | **8546** | JSON-RPC (HTTP) | `npx hardhat node --port 8546` |
| **FastAPI Backend Server** | 8000 | **8001** | HTTP / WebSockets | `uvicorn app.main:app --port 8001` |
| **Vite Dev Frontend SPA** | 5173 | **5174** | HTTP (HMR) | `npm --prefix frontend run dev -- --port 5174` |

---

## 2. Step-by-Step Installation & Configuration

### Step 2.1 Clone Repository & Install Python Dependencies
```bash
# Navigate to repository root
cd /Users/kaviselvaramkathirvel/Infosecproj

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 2.2 Install Smart Contract & Frontend Dependencies
```bash
# Install Hardhat and contract dependencies
npm --prefix contracts install

# Install Vite and frontend dependencies
npm --prefix frontend install
```

### Step 2.3 Environment Variable Configuration
The repository includes automated environment discovery. Verify or create `.env` in the repository root:
```ini
# Local EVM Blockchain RPC
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8546
CHAIN_ID=31337

# Deployed Contract Addresses (Deterministic on Hardhat Node)
REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
SUPPLY_CHAIN_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# Database Connection (SQLite WAL)
DATABASE_URL=sqlite:///./data/infosecproj.db

# Edge Node Telemetry Virtual HSM Key (Account #2 Carrier)
TELEMETRY_PRIVATE_KEY=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

# Security & CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://127.0.0.1:5173","http://127.0.0.1:5174"]
```

---

## 3. Blockchain Deployment & Initialization

### Step 3.1 Start Local Hardhat EVM Node
In a dedicated terminal:
```bash
cd contracts
npx hardhat node --port 8546
```
*Note: Hardhat provides 20 pre-funded test accounts with 10,000 ETH each.*

### Step 3.2 Deploy Smart Contracts
In a second terminal:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
Expected output:
```
Deploying SupplyChainRegistry...
SupplyChainRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deploying PharmaSupplyChain...
PharmaSupplyChain deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

---

## 4. Database Setup & Demonstration Seeding

### Step 4.1 Initialize Database Schema
```bash
PYTHONPATH=backend python -c "from app.db.session import init_db; init_db()"
```

### Step 4.2 Seed Demonstration Dataset
Executes deterministic creation of all 8 demo lots, telemetry points, security alerts, and lineage:
```bash
python scripts/seed_demo_data.py
```
Expected output:
```
[INFO] Connected to Hardhat EVM at http://127.0.0.1:8546 (Chain ID: 31337)
[SUCCESS] Seeded / Synchronized 8 demonstration lots on EVM and SQLite.
```

---

## 5. Starting Application Services

### Step 5.1 Start FastAPI Backend
```bash
source .venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Step 5.2 Start Vite Frontend SPA
```bash
npm --prefix frontend run dev -- --port 5174 --host
```

---

## 6. Liveness & Health Verification

Verify that all services are operational:
```bash
# 1. Check Backend Health
curl -s http://127.0.0.1:8001/health

# 2. Check Blockchain Connection & Block Number
curl -s http://127.0.0.1:8001/api/v1/blockchain/status

# 3. Check Seeded Batches API
curl -s http://127.0.0.1:8001/api/v1/batches | grep -o "Comirnaty"

# 4. Open Application in Web Browser
open http://localhost:5174
```

---

## 7. Full Automated Verification Script

Execute the master verification suite that checks contracts, pytest, physics, build, golden path, and API matrix in one command:
```bash
bash scripts/verify_all.sh
```
*Expected Result: 7 of 7 suites 100% GREEN.*
