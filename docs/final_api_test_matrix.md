# PharmaTrace — Final REST API Test Matrix

**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Framework  
**Course / Context:** CBS3002 Information Security Project  
**Authors:** Kaviselvaram Kathirvel & Aniesh S  
**Date:** October 2026 | Verified Execution Baseline  
**Test Suite:** `scripts/test_api_matrix.py`  
**Base URL:** `http://127.0.0.1:8001`  
**Total Test Cases:** 23  
**Pass Rate:** **100% (23/23 Passed)**

---

## 1. Test Methodology & Scope

The REST API Matrix exercises all public and authenticated endpoints across the FastAPI gateway. Each test validates:
- Correct HTTP status codes for both nominal and boundary conditions.
- Strict Pydantic input validation and custom validation logic (e.g. inverted temperature bounds).
- Smart contract EVM interaction and error translation (reverts returned as informative 400 errors).
- Cross-system consistency between SQLite and Cancun EVM storage.

---

## 2. Comprehensive 23-Endpoint Test Results

| # | HTTP Method & Endpoint | Test Scenario & Purpose | Caller / UI Component | Expected Status | Actual Status | Result | Notes & Response Summary |
|---|---|---|---|---|---|---|---|
| 1 | `GET /health` | System Health Check | Monitoring / DevOps | 200 | 200 | ✅ PASS | Returns `{"status": "HEALTHY", "service": "pharmatrace-backend"}` |
| 2 | `GET /` | Root Service Descriptor | System / Browser | 200 | 200 | ✅ PASS | Service metadata and version |
| 3 | `GET /api/v1/batches` | List all batches | OverviewView / BatchTable | 200 | 200 | ✅ PASS | Returns list of all registered lots with synchronized EVM status |
| 4 | `POST /api/v1/batches` | Valid Batch Registration (Mint) | CreateBatchModal | 201 | 201 | ✅ PASS | Mints lot on-chain, stores in SQLite, returns genesis tx hash |
| 5 | `POST /api/v1/batches` | Negative: Duplicate Batch ID Rejection | CreateBatchModal | 400 | 400 | ✅ PASS | Correctly rejects existing lot ID with HTTP 400 Bad Request |
| 6 | `POST /api/v1/batches` | Negative: Inverted Temp Bounds (`min >= max`) | CreateBatchModal | 400 | 400 | ✅ PASS | Rejected: minimum temperature must be strictly less than maximum |
| 7 | `GET /api/v1/batches/{id}` | Get Batch Dossier Details | BatchDetailView | 200 | 200 | ✅ PASS | Returns metadata, on-chain state, telemetry, and security alerts |
| 8 | `GET /api/v1/batches/{id}` | Negative: Non-existent Batch Query | BatchDetailView | 404 | 404 | ✅ PASS | Returns HTTP 404 Not Found for unregistered lot identifier |
| 9 | `POST /api/v1/handover/initiate` | Handover Step 1: Initiate Custody Transfer | HandoverModal | 200 | 200 | ✅ PASS | Signs intent with current custodian, submits on-chain tx |
| 10 | `POST /api/v1/handover/initiate` | Negative: Handover Unknown Batch | HandoverModal | 404 | 404 | ✅ PASS | Rejects initiation on non-existent batch with HTTP 404 |
| 11 | `POST /api/v1/handover/confirm` | Handover Step 2: Confirm Custody Acceptance | HandoverModal | 200 | 200 | ✅ PASS | Co-signs acceptance, updates on-chain custodian atomically |
| 12 | `POST /api/v1/handover/confirm` | Negative: Replay Handover Confirmation | HandoverModal | 400 | 400 | ✅ PASS | Rejects confirmation when no pending handover exists |
| 13 | `POST /api/v1/simulation/start` | Start Background Telemetry Worker | Overview / ChaosStudio | 200 | 200 | ✅ PASS | Spawns telemetry simulation task for active lot |
| 14 | `POST /api/v1/simulation/attack` | Inject Chaos Fault: MITM Alteration | ChaosStudio | 200 | 200 | ✅ PASS | Injects payload tampering fault; verifies contract revert |
| 15 | `POST /api/v1/simulation/attack` | Negative: Invalid Attack Enum | ChaosStudio | 400 | 400 | ✅ PASS | Rejects unsupported fault type with HTTP 400 / 422 |
| 16 | `POST /api/v1/simulation/reset-attacks` | Reset Chaos Faults | ChaosStudio | 200 | 200 | ✅ PASS | Clears active faults and restores nominal thermodynamics |
| 17 | `POST /api/v1/simulation/pause` | Pause Telemetry Worker | Waveform / Controls | 200 | 200 | ✅ PASS | Pauses simulated sensor stream |
| 18 | `GET /api/v1/blockchain/status` | Query Blockchain RPC Health | Navbar / Explorer | 200 | 200 | ✅ PASS | Returns `connected: true`, chain ID 31337, latest block height |
| 19 | `GET /api/v1/blockchain/blocks` | Query Recent Mined Blocks | BlockExplorer | 200 | 200 | ✅ PASS | Returns array of recent blocks with gas used and transaction counts |
| 20 | `GET /api/v1/verify/{id}` | Public Consumer QR Verification | QRVerifyPortal | 200 | 200 | ✅ PASS | Resolves batch, calculates safety verdict, checks breach history |
| 21 | `GET /api/v1/verify/{id}` | Negative: Verify Unknown QR Hash | QRVerifyPortal | 404 | 404 | ✅ PASS | Returns HTTP 404 Not Found without silent fallback |
| 22 | `GET /api/v1/audit/{id}/report` | Compile Regulatory Audit Report | AuditorWorkspace | 200 | 200 | ✅ PASS | Generates deterministic FDA 21 CFR Part 11 compliance report |
| 23 | `GET /api/v1/audit/{id}/report` | Negative: Audit Non-existent Batch | AuditorWorkspace | 404 | 404 | ✅ PASS | Returns HTTP 404 Not Found |

---

## 3. Direct REST Telemetry Endpoint (Phase 1 Extension)

In addition to the 23 matrix endpoints above, Phase 1 implemented direct REST telemetry ingestion:
- **Endpoint:** `POST /api/v1/batches/{batch_id}/telemetry`
- **Schema:** `TelemetrySubmitRequest` (temperature_celsius, latitude, longitude, nonce, signature, etc.)
- **Security Assertions:**
  - WGS-84 coordinate validation: `lat in [-90, +90]`, `lon in [-180, +180]`.
  - Canonical 78-byte packing and EIP-191 message prefix verification.
  - ECDSA secp256k1 signer recovery: recovered address must match registered current custodian.
  - Strict monotonic nonce enforcement: `nonce > last_nonce`. Replay attempts revert with `REPLAY_ATTACK_DETECTED`.
  - Thermal threshold enforcement: values outside `[min_temp, max_temp]` trigger immediate smart contract transition to `QUARANTINED`.
