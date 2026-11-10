# PharmaTrace — Final Repair Baseline Assessment
**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Cold-Chain Telemetry Platform  
**Authors:** Kaviselvaram Kathirvel and Aniesh S  
**Course:** CBS3002 — Information Security  
**Date of Assessment:** October 21, 2026  

---

## 1. Executive Summary & Purpose

This document establishes the empirical engineering baseline of the PharmaTrace repository prior to final system stabilization, architectural reconciliation, and release gating. PharmaTrace is an enterprise-grade cyber-physical pharmaceutical supply chain tracking platform combining:
1. **Solidity Smart Contracts on Cancun EVM** (`PharmaSupplyChain.sol`, `SupplyChainRegistry.sol`) enforcing non-repudiation, automated quarantine, and multi-sig 2-of-2 custody handover.
2. **FastAPI Asynchronous Backend** (`backend/app/main.py`) providing RESTful CRUD APIs, Web3.py blockchain RPC integration, automated regulatory report compilation (FDA 21 CFR Part 11 / CDSCO), and WebSocket sensor streaming.
3. **Deterministic Thermodynamic Vehicle Simulator** (`TransitSimulator`) modeling physical heat transfer, compressor hysteresis, GPS coordinate interpolation along the Hyderabad Genome Valley to Chennai NH44 corridor, and adversarial fault injection.
4. **React 19 / Vite SPA Command Center** featuring Obsidian/Glassmorphic design, interactive Leaflet transit maps, SVG telemetry waveforms, public QR consumer verification, and an auditor suite.

---

## 2. Environment & Service Topology

| Component | Technology | Target Port | Status at Baseline | Configuration File |
| :--- | :--- | :--- | :--- | :--- |
| **Local EVM Node** | Hardhat v2.22.x | `8546` | Active (PID 5379) | `contracts/hardhat.config.js` |
| **Backend REST API** | FastAPI / Uvicorn | `8001` | Active (PID 93538) | `.env.example`, `backend/app/core/config.py` |
| **Frontend Web App** | React 19 / Vite | `5174` | Active (PID 4180) | `frontend/vite.config.js` |
| **Relational Database** | SQLite (Async SQLAlchemy) | Local File | Intact (`data/infosecproj.db`) | `backend/app/core/database.py` |
| **WebSocket Stream** | FastAPI Native WebSockets | `8001` (`/ws/telemetry`) | Active & Broadcasting | `backend/app/api/websocket.py` |

---

## 3. Version Control Baseline

- **Active Git Branch:** `main`
- **Head Commit Hash:** `2c86a0e` (`fix(chaos): include raw_sensor_temperature in telemetry stream and safeguard MITM alert display`)
- **Recent Git Log:**
  - `2c86a0e` - fix(chaos): include raw_sensor_temperature in telemetry stream and safeguard MITM alert display
  - `10eab4a` - feat(e2e-polish): complete end-to-end golden path verification and UI polish
  - `7337510` - fix(config): align local host and docker target ports (8546, 8001, 5174)
  - `06d6ddf` - feat(ui-audit): enhance interactive UX, auto-pan map, batch selector in chaos studio, and resilient waveform
  - `9c46ed8` - docs(audit): finalize comprehensive adversarial security audit report
- **Preserved User Modifications:** Preserved existing working tree changes across backend APIs, frontend layouts, and test scripts. Unrelated slide deck deletion confirmed by user workspace.

---

## 4. Initial System Verification Results (Baseline Gate)

Execution of `./scripts/verify_all.sh` across all 7 layers yielded:

```text
======================================================================
🛡️  PHARMATRACE: END-TO-END CRYPTOGRAPHIC & ARCHITECTURE GATE
======================================================================
Step 1/7: Checking Port Isolation & Docker Safety...
✅ Dedicated host ports (5174, 8001, 8546) active and verified.

Step 2/7: Running Solidity Hardhat Unit & Cryptography Tests...
  39 passing (1s)
✅ All Smart Contract tests passed (39/39).

Step 3/7: Running Python Simulation Engine & REST API Pytest Suite...
======================== 15 passed, 1 warning in 1.35s =========================
✅ All Backend & Simulation tests passed (15/15).

Step 4/7: Compiling Frontend React / Vite Production Bundle...
dist/index.html                           1.54 kB │ gzip:  0.70 kB
dist/assets/index-DyS8b7uu.css           27.04 kB │ gzip:  9.32 kB
dist/assets/index-CEfIqXyW.js           361.29 kB │ gzip: 94.46 kB
✓ built in 1.11s
✅ Frontend production build succeeded with zero errors.

Step 5/7: Executing Standalone Native Cryptographic Proof...
   ✔ Canonical 78-byte packing and exact offsets verified.
   ✔ Raw Keccak-256 digest: 0xf1ab697f1f9b154772c485059ab5e2ea802460192a1f6489703029d714c09dca
   ✔ EIP-191 digest: 0xc9c705c42dffe727421ebddbd53e4e1ec3dacf06a7c7e60ccd827e8c0e4a5382
   ✔ Secp256k1 recovery matches Hardhat Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ✔ All 6 MITM field tamper vectors produce address divergence.
✅ All cryptographic guarantees validated.

Step 6/7: Executing Full 19-Step E2E Golden Path & Adversarial Verification...
🎉 ALL 19 GOLDEN PATH STEPS VERIFIED WITH 100% EMPIRICAL PROOF
✅ Live 19-step Golden Path & Adversarial verification passed (19/19).

Step 7/7: Executing Comprehensive REST API Matrix (23 Endpoints)...
🎉 ALL 23 REST API MATRIX SCENARIOS VERIFIED SUCCESSFULLY (100% GREEN)
✅ Comprehensive REST API Matrix passed (23/23).
```

---

## 5. Identified Baseline Gaps & Defect Vector Analysis

Prior to this execution phase, the system exhibited several edge defects and state disconnects requiring remediation:
1. **Fallback Mock Inconsistencies:** The Overview donut chart utilized static default fallbacks (`|| 3`, `|| 5`) rather than computing proportional arcs purely from real database records.
2. **Category Card Click Filter Disconnect:** Clicking the "Await handover" card dispatched a filter for `CREATED` instead of capturing both `CREATED` and `IN_TRANSIT` states pending custody transfer.
3. **Static Table Temperature Representation:** Batch table rows displayed hardcoded nominal temperatures (`4.25°C`) rather than displaying live packet readings when telemetry streams were active.
4. **Self-Handover Revert Trap:** The custody handover modal displayed all registered actors indiscriminately, allowing users to designate the current custodian as the recipient, which leads to smart contract reverts.
5. **Client-Side Form Validation Gap:** The batch creation modal lacked instant pre-flight validation for inverted temperature ranges (`minTemp >= maxTemp`), relying solely on backend HTTP 400 rejection.
6. **Asynchronous WebSocket Event Broadcasting:** Excursion and MITM detection alerts were recorded in SQLite but lacked WebSocket event broadcasts (`COLD_CHAIN_EXCURSION`, `MITM_TAMPER_ATTACK`), preventing instant frontend reactive toasts.

All identified vectors are cataloged, addressed, and verified in the subsequent deliverables.
