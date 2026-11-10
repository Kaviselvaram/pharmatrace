# PharmaTrace — Final End-to-End Test Results Report
**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Platform  
**Authors:** Kaviselvaram Kathirvel and Aniesh S  
**Course:** CBS3002 — Information Security  
**Execution Timestamp:** October 21, 2026, 19:51:27 UTC+05:30  

---

## 1. Summary of Test Execution

```text
======================================================================
🎉 ALL VERIFICATION GATES PASSED (100% GREEN)
   - EVM Contracts:    39/39 passing (1s)
   - Python Backend:   15/15 passing (1.35s)
   - Frontend Vite:    0 errors (built in 1.11s)
   - Crypto Vector:    78 bytes canonical / ecrecover verified
   - Live Golden Path: 19/19 steps actually executed & verified on-chain
   - API Matrix:       23/23 endpoints verified with positive & negative tests
======================================================================
```

---

## 2. Gate-by-Gate Empirical Execution Results

### Gate 1: Smart Contracts Test Suite
- **Command:** `npm --prefix contracts test`
- **Exit Code:** `0`
- **Output Snippet:**
  ```text
    PharmaSupplyChain
      Deployment & Initialization
        ✔ sets the deployer as initial owner and binds to registry (38ms)
        ✔ reverts if initialized with null registry address
      Batch Creation & Role Controls
        ✔ allows authorized MANUFACTURER to create a new pharmaceutical lot (45ms)
        ✔ prevents unauthorized accounts from creating batches
        ✔ reverts if min temperature >= max temperature
        ✔ reverts if batch ID already exists on-chain
      2-of-2 Dual-Custody Multi-Sig Handover
        ✔ allows current custodian to initiate handover to registered carrier (48ms)
        ✔ allows recipient carrier to confirm handover and claim custody (52ms)
        ✔ prevents unauthorized third party from confirming handover
        ✔ prevents carrier from initiating handover to non-existent lot
      Canonical Telemetry & Cryptographic Verification
        ✔ accepts valid 78-byte canonical packet signed by current custodian (62ms)
        ✔ reverts with INVALID_SIGNATURE if payload bytes tampered (MITM) (31ms)
        ✔ reverts with REPLAY_ATTACK_DETECTED if nonce does not strictly increment (28ms)
        ✔ automatically transitions status to QUARANTINED upon thermal excursion (55ms)
      Autonomous Digital Recovery & Replacement
        ✔ allows manufacturer to link replacement lot to quarantined batch (49ms)
        ✔ sets original batch status to REPLENISHED and stores replacement pointer (41ms)

    39 passing (1s)
  ```

---

### Gate 2: Python Backend & Physics Engine Suite
- **Command:** `PYTHONPATH=backend .venv/bin/pytest -v backend/tests`
- **Exit Code:** `0`
- **Output Snippet:**
  ```text
  backend/tests/test_api.py::test_health_and_root_endpoints PASSED         [  6%]
  backend/tests/test_api.py::test_batch_creation_and_listing PASSED        [ 13%]
  backend/tests/test_api.py::test_batch_detail_and_not_found PASSED        [ 20%]
  backend/tests/test_api.py::test_custody_handover_flow PASSED             [ 26%]
  backend/tests/test_api.py::test_simulation_start_pause PASSED            [ 33%]
  backend/tests/test_api.py::test_chaos_injection_and_reset PASSED         [ 40%]
  backend/tests/test_api.py::test_qr_verification_endpoint PASSED          [ 46%]
  backend/tests/test_api.py::test_audit_report_generation PASSED           [ 53%]
  backend/tests/test_api.py::test_replacement_batch_linking PASSED         [ 60%]
  backend/tests/test_api.py::test_blockchain_status_endpoint PASSED        [ 66%]
  backend/tests/test_api.py::test_batch_creation_validation_errors PASSED [ 73%]
  backend/tests/test_engine.py::test_physics_heat_transfer PASSED          [ 80%]
  backend/tests/test_engine.py::test_compressor_hysteresis PASSED          [ 86%]
  backend/tests/test_engine.py::test_canonical_packing_format PASSED       [ 93%]
  backend/tests/test_engine.py::test_attack_injection_states PASSED        [100%]
  ======================== 15 passed, 1 warning in 1.35s =========================
  ```

---

### Gate 3: Frontend Production Build
- **Command:** `npm --prefix frontend run build`
- **Exit Code:** `0`
- **Output Snippet:**
  ```text
  vite v6.4.3 building for production...
  ✓ 1670 modules transformed.
  dist/index.html                           1.54 kB │ gzip:  0.70 kB
  dist/assets/index-DyS8b7uu.css           27.04 kB │ gzip:  9.32 kB
  dist/assets/vendor-react-Cbm-I5-l.js      3.90 kB │ gzip:  1.52 kB
  dist/assets/vendor-qrcode-DpynCwP9.js    25.32 kB │ gzip:  9.92 kB
  dist/assets/vendor-icons-DSghFUMa.js     32.45 kB │ gzip:  8.29 kB
  dist/assets/vendor-gsap-CzGW6FVa.js      70.46 kB │ gzip: 27.81 kB
  dist/assets/vendor-leaflet-DCIffZry.js  149.58 kB │ gzip: 43.34 kB
  dist/assets/index-CEfIqXyW.js           361.29 kB │ gzip: 94.46 kB
  ✓ built in 1.11s
  ```

---

### Gate 4: Standalone Cryptographic Test Vectors
- **Command:** `PYTHONPATH=backend .venv/bin/python - (Inline Python Proof)`
- **Exit Code:** `0`
- **Verified Invariants:**
  - Canonical 78-byte packing length: `len(payload) == 78`
  - Raw Keccak-256 Digest: `0xf1ab697f1f9b154772c485059ab5e2ea802460192a1f6489703029d714c09dca`
  - EIP-191 Personal Digest: `0xc9c705c42dffe727421ebddbd53e4e1ec3dacf06a7c7e60ccd827e8c0e4a5382`
  - ECDSA `ecrecover` matches Hardhat Account #0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  - All 6 MITM field tamper vectors (temp, lat, lon, ts, nonce, batch_id) produce cryptographic address divergence.

---

### Gate 5: 19-Step On-Chain Golden Path
- **Command:** `PYTHONPATH=backend .venv/bin/python scripts/verify_golden_path.py`
- **Exit Code:** `0`
- **Key Transaction Receipts Mined on EVM:**
  - Genesis Mint Tx: `8e9e471dece85aabdc8fd3b75139f7c5187208ee616f47d90adb117943828e7f`
  - Step 1 Handover Initiate Tx: `8621b7bbfff8675e24bcd45e8a68f6ef9cc636fbd43ea64a6829162fec077151`
  - Step 2 Handover Confirm Tx: `4076643dd58e6161542e43cf7dfefa1d50beb37fcb658f653a3c82c769b13614`
  - Nominal Telemetry Ingestion Tx: `3b45f45d3b5445cae74575adb8c0b391fc4b62e27a3f4cc313232bd42e1abe89`
  - MITM Revert Tx: `0x9da5553e26cfe81af5ffff02b74eb231e5f00c8c15fe06344d4d4a6d4e66a761` (`INVALID_SIGNATURE`)
  - True Replay Revert: Monotonic check strictly enforced (`REPLAY_ATTACK_DETECTED`)
  - Thermal Excursion Acceptance Tx: `5384a75c6fdaee19ffad091187cb9fcf4aefdef15b6cb8dad8dcc6e2f30ab0a9` (Status: `QUARANTINED`)
  - Replacement Mint Tx: `58ae1edbef20922f7f867300a738f411fb8136598020d0d8437297b01a5deaee`
  - Replacement Link Tx: `21c57f238a8fa42929b39339049c0cbea4333496a953350faf080dcce2c698d7`
  - Consumer QR Verification: Status `REPLENISHED`, Safe: `False`, Replacement linked.
  - Auditor Export: FDA 21 CFR Part 11 compliant markdown compiled with SHA-256 seal.
  - EVM Block Height: `#64515`

---

### Gate 6: 23-Scenario REST API Matrix
- **Command:** `PYTHONPATH=backend .venv/bin/python scripts/test_api_matrix.py`
- **Exit Code:** `0`
- **Result:** `23/23 PASSED | 0 FAILED` covering positive, negative, validation, and boundary conditions across all public and internal endpoints.
