# PharmaTrace — Final Root-Cause Diagnostic Audit & Engineering Remediation Report
**Project**: Blockchain-Secured Pharmaceutical Supply Chain Framework  
**Course / Context**: CBS3002 Information Security Project  
**Authors**: Kaviselvaram Kathirvel & Aniesh S  
**Date**: October 2026 | Release Verification Baseline

---

## 1. Executive Summary

This audit details the root causes identified across the application stack—from the React 19 frontend and Vite dev server through the FastAPI gateway, SQLite persistence layer, Web3.py RPC client, and Solidity smart contracts running on the local Hardhat EVM (Cancun specification). Every identified failure mode has been repaired, regression tested, and verified end-to-end.

---

## 2. Root Cause Diagnoses & Remediations

### Defect 1: Backend Connection Refusal (`ECONNREFUSED 127.0.0.1:8001`)

- **Symptom**:
  Frontend loaded at `http://localhost:5174/`, but UI displayed blank cards, infinite spinners, or red network error banners. Browser console showed:
  ```text
  Error: connect ECONNREFUSED 127.0.0.1:8001
  GET /api/v1/batches
  GET /api/v1/blockchain/status
  WebSocket connection to 'ws://localhost:5174/ws/telemetry' failed
  ```
- **Root Cause**:
  1. The background Python FastAPI process (`uvicorn app.main:app --port 8001`) and Hardhat node (`npx hardhat node --port 8546`) lacked persistent supervision and clean PID tracking. When prior terminal/agent sessions completed, background processes were terminated while Vite remained listening on port 5174.
  2. First-time or headless invocations of Hardhat presented an interactive CLI prompt (`? Help us improve Hardhat with anonymous crash reports...`), which hung automated scripts waiting on stdin.
  3. No root-level package script orchestrated the startup sequence in topological order (EVM RPC -> Contract Deployment -> Database Init -> Backend Gateway -> Frontend Dev Server).
- **Engineering Fix**:
  - Implemented `scripts/demo_start.sh`, `scripts/demo_stop.sh`, and `scripts/demo_status.sh` with bounded health-check polling, non-interactive execution, and strict PID tracking in `.run/`.
  - Added root npm scripts in [package.json](file:///Users/kaviselvaramkathirvel/Infosecproj/package.json):
    `npm run demo:start`, `npm run demo:stop`, `npm run demo:status`, and `npm run demo:seed`.
  - Verified that startup halts immediately with actionable diagnostics if any required port or health endpoint is unavailable.

---

### Defect 2: Fatal React Unmount & Blank White Screen on `/#recovery`

- **Symptom**:
  Navigating to `http://localhost:5174/#recovery` rendered a completely white, unresponsive page with an uncaught runtime exception in the browser console.
- **Root Cause**:
  In `RecoveryView.jsx`, line 416 attempted to render `<Icons.Plus size={12} />`. However, `Icons.jsx` exported `PlusCircle` rather than `Plus`. In React 19, passing an `undefined` value as a JSX component tag causes an unhandled runtime error:
  ```text
  Uncaught TypeError: Element type is invalid: expected a string or class/function but got: undefined.
  ```
  Because the component tree lacked a React `ErrorBoundary`, the entire virtual DOM tree unmounted, producing a pure white viewport.
- **Engineering Fix**:
  - Corrected component reference to `<Icons.PlusCircle />` in [RecoveryView.jsx](file:///Users/kaviselvaramkathirvel/Infosecproj/frontend/src/components/dashboard/RecoveryView.jsx#L416).
  - Exported `Plus` from `lucide-react` in [Icons.jsx](file:///Users/kaviselvaramkathirvel/Infosecproj/frontend/src/components/ui/Icons.jsx).
  - Wrapped `Icons` with a JavaScript `Proxy` fallback: any future missing or misspelled icon returns a safe placeholder rather than crashing the React DOM.
  - Built [ErrorBoundary.jsx](file:///Users/kaviselvaramkathirvel/Infosecproj/frontend/src/components/ui/ErrorBoundary.jsx) and wrapped all central views in [App.jsx](file:///Users/kaviselvaramkathirvel/Infosecproj/frontend/src/App.jsx).

---

### Defect 3: Consumer QR Hash Verification 404 Failures (`/#verify`)

- **Symptom**:
  Copying valid transaction hashes or block hashes from Blockchain Ledger (`/#explorer`) into Consumer QR Verification (`/#verify`) failed with:
  ```json
  {"detail": "Batch lot '0x8e5086...591b6' not found in registry or on-chain EVM storage"}
  ```
- **Root Cause**:
  1. Telemetry transactions for batches that had already experienced an excursion reverted on-chain with gas 31,893 (`status: 0`). Reverted transactions emit no event logs (`receipt.logs = []`).
  2. Legacy `web3_service.find_batch_by_tx_hash` only inspected `receipt.logs`. When logs were empty, it returned `UNRELATED_TX`.
  3. `resolve_batch_by_hash` did not decode transaction input calldata.
- **Engineering Fix**:
  - Enhanced `find_batch_by_tx_hash` in [web3_service.py](file:///Users/kaviselvaramkathirvel/Infosecproj/backend/app/services/web3_service.py): added two-stage inspection:
    Stage 1: Event log topic scanning.
    Stage 2: ABI function decoding (`decode_function_input(tx.input)`) and 32-byte chunk scanning across calldata.
  - Updated [audit.py](file:///Users/kaviselvaramkathirvel/Infosecproj/backend/app/api/v1/audit.py) to resolve block hashes, transaction hashes, block numbers, and batch IDs with explicit resolution evidence tags (`[BLOCK_HASH]`, `[TRANSACTION_HASH]`).

---

### Defect 4: Smart Contract Revert on Replenishment (`"batch is not quarantined"`)

- **Symptom**:
  Clicking "Prepare Replenishment" or "Authorize Replacement Lot" in the Recovery view failed with:
  ```text
  On-chain link failed: PharmaSupplyChain: batch is not quarantined
  ```
- **Root Cause**:
  `PharmaSupplyChain.sol` enforces `require(orig.status == BatchStatus.QUARANTINED)`. If a demo batch was previously linked on-chain and transitioned to `REPLENISHED` (status 3), but the off-chain SQLite database still had `status = "QUARANTINED"`, calling `linkReplacementBatch()` caused a smart contract revert.
- **Engineering Fix**:
  - Implemented automatic EVM on-chain state synchronization during `GET /api/v1/batches` in [batches.py](file:///Users/kaviselvaramkathirvel/Infosecproj/backend/app/api/v1/batches.py).
  - Updated `link_replacement` endpoint to be idempotent: if the batch is already `REPLENISHED` on-chain, it synchronizes local DB state without re-invoking the reverting contract call.
  - Added `POST /api/v1/batches/trigger-demo-quarantine` to mint fresh breach lots on demand for demonstration.

---

### Defect 5: Missing Direct REST Telemetry Ingestion Endpoint

- **Symptom**:
  External sensors, automated test scripts, and non-simulation edge nodes could not submit signed telemetry packets directly via HTTP REST API.
- **Root Cause**:
  Telemetry submission had previously only been exposed through the background simulation worker (`simulation_loop`).
- **Engineering Fix**:
  - Implemented `POST /api/v1/batches/{batch_id}/telemetry` in [batches.py](file:///Users/kaviselvaramkathirvel/Infosecproj/backend/app/api/v1/batches.py) with [TelemetrySubmitRequest](file:///Users/kaviselvaramkathirvel/Infosecproj/backend/app/domain/schemas.py).
  - Enforces WGS-84 coordinate validation, ECDSA secp256k1 signer recovery via EIP-191, custodian authority checks, smart contract on-chain commitment, monotonic nonce replay detection, and thermal threshold compliance.

---

## 3. Verification Summary

| Gate | Target Suite | Result | Evidence |
| :--- | :--- | :--- | :--- |
| **Contracts** | Hardhat Unit & Security Tests | 39 / 39 Passed | `contracts/test/PharmaSupplyChain.test.js` |
| **Backend** | Pytest Async Unit & Resilience | 21 / 21 Passed | `backend/tests/` |
| **Frontend** | Vite React 19 Production Build | 0 Errors, 1.09s | `dist/assets/index-CBAWVCOC.js` |
| **Cryptography** | Canonical 78-byte EIP-191 Proof | 100% Passed | `scripts/verify_all.sh` Step 5 |
| **Golden Path** | Live 19-Step On-Chain Integration | 19 / 19 Passed | `scripts/verify_golden_path.py` |
| **REST API Matrix** | 23 Endpoint Positive/Negative Tests | 23 / 23 Passed | `scripts/test_api_matrix.py` |
| **Acceptance Gate** | 20 Phase-7 Acceptance Scenarios | 20 / 20 Passed | `scripts/test_e2e_20_scenarios.py` |
| **Seeder Data** | 8 Coherent Lots Seeding & Idempotency | 8 / 8 Verified | `scripts/seed_demo_data.py` |
