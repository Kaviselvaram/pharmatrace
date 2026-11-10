# PharmaTrace — Final Repair Changes & Architecture Report
**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Platform  
**Authors:** Kaviselvaram Kathirvel and Aniesh S  
**Course:** CBS3002 — Information Security  
**Audit Date:** October 21, 2026  

---

## 1. Overview of Codebase Modifications

During this comprehensive repair and release-readiness review, targeted improvements were made across backend asynchronous services, frontend UI components, simulation pipelines, and automated test gates without destabilizing the working system architecture.

---

## 2. Detailed File Modification Log

### A. Backend Services & Simulation Engine

1. **`backend/app/api/v1/simulation.py`**
   - **Rationale & Root Cause:** While the EVM contract transitioned lot status to `QUARANTINED` upon thermal excursion, the backend background loop previously logged an alert in SQLite but did not update the local database `status` field nor broadcast real-time WebSocket events.
   - **Changes Applied:**
     - Added asynchronous SQLite update: `batch_record.status = "QUARANTINED"`.
     - Broadcasted `"COLD_CHAIN_EXCURSION"` WebSocket message containing lot ID, temperature, and transaction hash.
     - Broadcasted `"MITM_TAMPER_ATTACK"` WebSocket message on `INVALID_SIGNATURE`.
     - Logged `REPLAY_ATTACK` alert in `SecurityAlertModel` upon detecting non-monotonic nonces.
   - **Impact:** Frontend command center immediately receives excursion alerts, triggers toast notifications, and reloads batches without manual page refresh.

2. **`backend/app/api/v1/audit.py`**
   - **Rationale & Root Cause:** Consumer verification required high tolerance for user-entered strings (e.g. pasted URLs with hashes, un-prefixed 64-char hex, lowercase/uppercase mismatch, or genesis transaction hashes).
   - **Changes Applied:**
     - Enhanced `resolve_batch_by_hash()` with multi-tiered resolution: exact ID, case-insensitive match, genesis tx hash lookup, replacement lot lookup, prefix search (>= 6 chars), and direct EVM on-chain fallback.
     - Added autonomous replacement lot lineage to the FDA 21 CFR Part 11 markdown report.
   - **Impact:** Zero 404s when consumers or hospital pharmacists paste various representations of a batch lot identifier.

3. **`backend/app/services/web3_service.py`**
   - **Rationale & Root Cause:** Deployment metadata path needed resilient loading across both standalone backend runs and root script invocations.
   - **Changes Applied:**
     - Added dynamic fallback path resolution for `contracts/deployments/local.json`.
     - Implemented `get_current_chain_time()` to synchronize simulated timestamps with Hardhat EVM block timestamps.
     - Added batch existence verification in `get_batch_from_chain()`, returning `None` if `createdAt == 0`.

4. **`backend/app/domain/schemas.py`**
   - **Rationale:** Expose `replacement_batch_id` in `AuditReportResponse` schema.
   - **Changes Applied:** Added `replacement_batch_id: Optional[str] = None` to Pydantic model.

---

### B. Frontend Architecture & Design Foundations

1. **`frontend/src/components/dashboard/OverviewView.jsx`**
   - **Rationale & Root Cause:** The status breakdown donut chart used static fallback counts (`|| 3`, `|| 5`) and hardcoded SVG circle stroke dash arrays.
   - **Changes Applied:**
     - Computed dynamic circumference ($C = 2 \times \pi \times 38 \approx 238.76$).
     - Calculated proportional dash lengths and cumulative negative offsets for each status segment (`IN_TRANSIT`, `DELIVERED`, `CREATED`, `QUARANTINED`, `REPLENISHED`) directly from `batches` array.
     - Passed `lastPacket` to `BatchTable`.

2. **`frontend/src/components/dashboard/BatchTable.jsx`**
   - **Rationale & Root Cause:** The table displayed static "4.25°C" text for all lots and clicking the "Await handover" card filtered for `CREATED` only.
   - **Changes Applied:**
     - Accepted `lastPacket` prop and dynamically rendered live packet temperature for the active lot with red/green threshold styling.
     - Bound Card 2 click handler to `AWAIT_HANDOVER` category, matching lots in either `CREATED` or `IN_TRANSIT` states.
     - Enhanced status labels for non-active lots (`Awaiting dispatch`, `Nominal`, `Superseded`, `Delivered`).

3. **`frontend/src/components/dashboard/BatchesView.jsx` & `frontend/src/App.jsx`**
   - **Rationale:** Thread `lastPacket` from root WebSocket receiver through `BatchesView` to `BatchTable`.
   - **Changes Applied:** Passed `lastPacket={lastPacket}` down component hierarchy.

4. **`frontend/src/components/modals/HandoverModal.jsx`**
   - **Rationale & Root Cause:** Releasing custodians could inadvertently select their own address as recipient, causing an on-chain transaction revert.
   - **Changes Applied:**
     - Computed `eligibleActors` by filtering out `batch.current_custodian`.
     - Dynamically initialized `recipient` to the first available non-custodian actor upon modal open.

5. **`frontend/src/components/modals/CreateBatchModal.jsx`**
   - **Rationale:** Provide immediate client-side feedback if a user specifies `min_temp >= max_temp`.
   - **Changes Applied:** Added pre-flight check in `handleSubmit`, rendering an inline error alert banner before API submission.

---

### C. Testing & Verification Infrastructure

1. **`scripts/verify_all.sh`**
   - **Rationale:** Provide a rigorous 7-step single-command verification gate that runs contract unit tests, pytest backend suite, Vite production build, cryptographic vectors, 19-step Golden Path, and 23-endpoint REST API matrix.
   - **Changes Applied:** Ensured non-zero exit codes upon failure and verified that no skipped tests report false passes.

2. **`scripts/verify_golden_path.py`**
   - **Rationale:** Exercise real on-chain Cancun EVM transactions for every step of the lifecycle: minting, 2-of-2 multi-sig handover, canonical telemetry ingestion, MITM rejection, true replay rejection, thermal excursion quarantine, replacement lot linking, QR resolution, and audit report generation.
   - **Changes Applied:** Fully verified against local Hardhat node on port 8546.
