# PharmaTrace — Final Comprehensive Test Results Report

**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Framework  
**Course / Context:** CBS3002 Information Security Project  
**Authors:** Kaviselvaram Kathirvel & Aniesh S  
**Date:** October 2026 | Verified Execution Baseline  
**Overall Verdict:** `100% PASSING ACROSS ALL ACCEPTANCE GATES`  
**Total Empirical Verifications:** 122 automated unit/integration tests + 20 acceptance scenarios + 14 browser DOM interactions

---

## 1. Master Acceptance Gates Summary

| Gate # | Test Suite | Executable Target | Scope / Coverage | Test Count | Result | Exit Code | Evidence Artifact |
|:---:|---|---|---|:---:|:---:|:---:|---|
| **1** | **EVM Smart Contracts** | `npm --prefix contracts test` | Role ACL, EIP-191 verification, nonces, dual custody, quarantine, lineage | 39 | **39 Passed, 0 Failed** | 0 | `contracts/test/PharmaSupplyChain.test.js` |
| **2** | **Backend & Physics Pytest** | `PYTHONPATH=backend pytest -v backend/tests` | FastAPI schemas, sessions, WGS-84 validation, thermodynamic physics | 21 | **21 Passed, 0 Failed** | 0 | `backend/tests/` |
| **3** | **Frontend Production Build** | `npm --prefix frontend run build` | Vite 6 / React 19 bundle compilation, JSX linting, CSS asset hashing | 1 | **Built (0 Errors)** | 0 | `frontend/dist/assets/index-CBAWVCOC.js` |
| **4** | **Canonical Cryptography** | `python backend/tests/test_crypto_parity.py` | 78-byte binary layout, EIP-191 digest, low-s malleability, 6 MITM vectors | 7 | **7 Passed, 0 Failed** | 0 | Step 5 in `scripts/verify_all.sh` |
| **5** | **Live On-Chain Golden Path** | `python scripts/verify_golden_path.py` | 19-step lifecycle: mint -> transit -> MITM -> replay -> excursion -> lineage | 19 | **19 Passed, 0 Failed** | 0 | `scripts/verify_golden_path.py` |
| **6** | **REST API Endpoint Matrix** | `python scripts/test_api_matrix.py` | 23 REST endpoints with positive and boundary rejection test cases | 23 | **23 Passed, 0 Failed** | 0 | `docs/final_api_test_matrix.md` |
| **7** | **Phase 7 Acceptance Suite** | `python scripts/test_e2e_20_scenarios.py` | 20 comprehensive end-to-end acceptance scenarios | 20 | **20 Passed, 0 Failed** | 0 | `docs/final_e2e_test_matrix.md` |
| **8** | **Demonstration Data Seeder** | `python scripts/seed_demo_data.py` | 8 distinct demonstration lots, on-chain sync, strict idempotency | 8 | **8 / 8 Verified** | 0 | `docs/final_data_catalog.md` |
| **9** | **Browser DOM Automation** | Live Browser Navigation on Port 5174 | Real UI click-through: tabs, recovery, QR hash verify, blockchain explorer | 14 | **14 Passed, 0 Failed** | 0 | Screen recordings & WebP artifacts |

---

## 2. Detailed Breakdown of Test Suites

### Gate 1: Smart Contracts (`npm --prefix contracts test`)
- `SupplyChainRegistry`: Deployer admin role, regulator role, carrier/manufacturer role, unauthorized assignment rejection (5 tests).
- `PharmaSupplyChain - Batch Creation`: Registered manufacturer mint, temperature bound enforcement, non-manufacturer rejection (3 tests).
- `PharmaSupplyChain - Signed Telemetry Ingestion`: 78-byte packet verification, non-custodian rejection, tampered payload rejection, replay rejection (4 tests).
- `PharmaSupplyChain - Cold-Chain Excursions`: High temperature excursion auto-quarantine, low temperature excursion auto-quarantine, event emission (3 tests).
- `PharmaSupplyChain - Multi-Party Custody Handover`: Step 1 initiate, Step 2 confirm, unconfirmed transfer rejection, non-recipient confirmation rejection (4 tests).
- `PharmaSupplyChain - Autonomous Recovery Lineage`: Replacement linking, circular linkage prevention, unquarantined lot linking rejection (3 tests).
- Additional security boundary, gas, and event verification tests (17 tests).
- **Subtotal:** 39 passed in 1.82s.

### Gate 2: Python Backend Pytest (`pytest backend/tests`)
- `test_crypto_parity.py`: 7 tests verifying exact byte alignment, Keccak-256 digests, EIP-191 signatures, and signer recovery.
- `test_physics_engine.py`: 6 tests verifying thermodynamic models (Newton cooling, compressor hysteresis, thermal breaches, GPS route interpolation).
- `test_routes.py` & resilience tests: 8 tests verifying database sessions, CORS headers, error translation, and input validation.
- **Subtotal:** 21 passed in 2.45s.

### Gate 3: Frontend Production Bundle (`npm --prefix frontend run build`)
- Vite v6.4.3 building for production with `@vitejs/plugin-react`.
- Output: `dist/index.html` (1.42 kB), `dist/assets/index-D7K_8g0P.css` (28.4 kB), `dist/assets/index-CBAWVCOC.js` (342.1 kB).
- Transformation: 1,842 modules transformed in 1.09s. Zero compilation warnings or lint errors.

### Gate 4: Standalone 78-Byte Canonical EIP-191 Proof
- Canonical 78-byte payload: 32 bytes batch ID, 2 bytes int16 temperature, 4 bytes int32 latitude, 4 bytes int32 longitude, 4 bytes uint32 timestamp, 32 bytes uint256 nonce.
- Raw Keccak-256 hash: `0xf1ab697f1f9b154772c485059ab5e2ea802460192a1f6489703029d714c09dca`.
- EIP-191 digest: `0xc9c705c42dffe727421ebddbd53e4e1ec3dacf06a7c7e60ccd827e8c0e4a5382`.
- Recovered signer: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Hardhat Account #0).
- All 6 MITM field tamper vectors produce address divergence.

### Gate 5: Live 19-Step On-Chain Golden Path (`scripts/verify_golden_path.py`)
- Step 1: Mint lot on-chain -> Genesis tx mined (`status: 1`).
- Step 2: Query lot metadata -> Confirmed in SQLite and EVM.
- Step 3-4: 2-of-2 dual custody handover to Carrier -> Transferred atomically.
- Step 5-8: In-range signed telemetry ingestion -> Mined on EVM, stored in DB.
- Step 9-10: MITM tamper injection -> Rejected on-chain (`INVALID_SIGNER`).
- Step 10b: Nonce replay injection -> Rejected on-chain (`REPLAY_ATTACK_DETECTED`).
- Step 11-14: Thermal excursion (+14.2°C) -> Status flipped to `QUARANTINED`.
- Step 15-16: Replacement lot minting & linking -> Status updated to `REPLENISHED`, child linked.
- Step 17: Consumer QR resolution -> Resolved, flags superseded lot, links child.
- Step 18: FDA 21 CFR Part 11 report compilation -> 100% compliant.
- Step 19: Full persistence verification.

### Gate 6: REST API Endpoint Matrix (`scripts/test_api_matrix.py`)
- 23 endpoints tested covering health, batches, handovers, simulation, attack faults, blockchain explorer, QR verification, and auditor workspace.
- 100% passed (23/23).

### Gate 7: Phase 7 Acceptance Suite (`scripts/test_e2e_20_scenarios.py`)
- Scenario 1: Startup readiness.
- Scenario 2: Batch creation through API.
- Scenario 3: Batch visibility in DB and API.
- Scenario 4: On-chain batch registration.
- Scenario 5: Authorized dual-custody handover.
- Scenario 6: Telemetry ingestion through direct REST API.
- Scenario 7: Telemetry persistence in SQLite.
- Scenario 8: Invalid temperature input rejection.
- Scenario 9: Tampered signature rejection.
- Scenario 10: Monotonic replay attack rejection.
- Scenario 11: Temperature breach and auto-quarantine.
- Scenario 12: Unauthorized handover rejection.
- Scenario 13: Replacement lineage creation and linking.
- Scenario 14: QR verification for valid lot.
- Scenario 15: QR verification for unknown lot (no fallback).
- Scenario 16: Blockchain explorer transaction & block queries.
- Scenario 17: FDA 21 CFR Part 11 audit report generation.
- Scenario 18: WebSocket live telemetry streaming.
- Scenario 19: Seeder rerun idempotency (0 duplicate lots).
- Scenario 20: Unavailable service graceful failure handling.
- **Result:** 20 / 20 PASS.
