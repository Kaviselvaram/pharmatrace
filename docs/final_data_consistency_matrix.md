# PharmaTrace — Final Data Consistency Matrix
**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Platform  
**Authors:** Kaviselvaram Kathirvel and Aniesh S  
**Course:** CBS3002 — Information Security  
**Audit Date:** October 21, 2026  

---

## 1. Source of Truth Architecture

In the PharmaTrace distributed cyber-physical architecture:
1. **Blockchain-Authoritative State:** The Cancun EVM smart contract `PharmaSupplyChain.sol` is the absolute authority for:
   - Batch existence and ownership (`manufacturer`, `currentCustodian`).
   - Lifecycle state (`CREATED`, `IN_TRANSIT`, `DELIVERED`, `QUARANTINED`, `REPLENISHED`).
   - Autonomous parent-child replacement lineage (`replacementBatchId`).
   - Monotonic sensor nonces (`latestNonce`).
   - Dual-custody multi-signature commitments (`activeHandovers`).
2. **Database-Authoritative State:** SQLite (`data/infosecproj.db` via async SQLAlchemy) is the authoritative store for:
   - High-frequency edge telemetry history (`telemetry` table).
   - Forensic security incident alerts and tamper logs (`security_alerts` table).
   - Off-chain product descriptive metadata and genesis transaction hashes (`batches` table).
3. **Derived Real-Time State:**
   - Real-time vehicle coordinates along the NH44 corridor are interpolated deterministically from route step progress.
   - Dashboard summary cards and donut segments are computed dynamically from active batch records.

---

## 2. Canonical Data Consistency Matrix

| Entity | Canonical ID Format | Authoritative Source | DB Representation | Smart Contract Field | API Endpoints | UI Consumers | Validation Rules | Cross-System Reconciliation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pharmaceutical Batch** | 32-byte hex (`0x...` 64 hex chars) | EVM Contract | `batches.batch_id` (PK, string) | `batches[id]` (`struct Batch`) | `POST /batches`, `GET /batches`, `GET /batches/{id}` | Overview, Batches, Dossier, QR Portal | `min_temp < max_temp`, unique 32-byte ID | API reads live on-chain status via `getBatch()` and overrides local DB cache |
| **Batch Lifecycle Status** | Enum string (`CREATED`, `IN_TRANSIT`, `DELIVERED`, `QUARANTINED`, `REPLENISHED`) | EVM Contract | `batches.status` | `batches[id].status` (`enum BatchStatus`) | `GET /batches`, `GET /batches/{id}`, `GET /verify/{id}` | BatchTable, Dossier, RecoveryView, QR Portal | Strict unidirectional state machine enforced on-chain | Any on-chain status transition emitted by EVM updates local DB record and broadcasts WebSocket event |
| **Custodian & Role** | 20-byte EVM address (`0x...` 40 hex chars) | EVM Contract / Registry | `batches.current_custodian` | `batches[id].currentCustodian` | `GET /batches`, `POST /handover/*` | Navbar, BatchTable, CustodyView, Dossier | Registered in `SupplyChainRegistry.sol` | Releasing custodian must match `batches[id].currentCustodian` |
| **Custody Handover** | Batch ID (`bytes32`) | EVM Contract | Event / Tx Hash in `batches` | `activeHandovers[batchId]` (`struct HandoverRequest`) | `POST /handover/initiate`, `POST /handover/confirm` | CustodyView, HandoverModal | Step 1 requires current custodian signature; Step 2 requires recipient signature | Both signatures verified on EVM before `currentCustodian` transfers atomically |
| **Telemetry Reading** | Auto-increment ID / Nonce | SQLite (Off-chain) | `telemetry` (id, batch_id, temp, lat, lon, timestamp, nonce, hash, sig) | Ingress parameter in `submitSignedTelemetry()` | `POST /simulation/start`, `/ws/telemetry` | Waveform, Map, MonitoringView, Auditor | Canonical 78-byte packing; temp between -30°C and 60°C | Off-chain database records all packets; on-chain commits valid transactions and receipts |
| **Digital Signature** | ECDSA tuple (`v`, `r`, `s`) | Virtualized Node / Reefer Edge | `telemetry.signature_r`, `signature_s`, `signature_v` | Parameter in `submitSignedTelemetry()` | `/ws/telemetry`, `GET /batches/{id}` | Dossier, SecurityCenter, Auditor Workspace | Valid secp256k1 signature over EIP-191 personal digest | `ecrecover` in contract must equal `currentCustodian` or tx reverts |
| **Sequence Nonce** | `uint256` monotonic integer | EVM Contract | `telemetry.nonce` | `batches[id].latestNonce` | `/ws/telemetry`, `GET /batches/{id}` | MonitoringView, SecurityCenter | `incomingNonce > latestNonce` (strictly incrementing) | Contract rejects `incomingNonce <= latestNonce` with `REPLAY_ATTACK_DETECTED` |
| **Thermal Excursion** | Auto ID / Alert record | EVM Contract / SQLite | `security_alerts` (`COLD_CHAIN_EXCURSION`) | Event `ColdChainExcursionDetected` | `GET /batches/{id}`, `GET /audit/{id}/report` | RecoveryView, SecurityCenter, Auditor | `temp < minTemp` OR `temp > maxTemp` (scaled $\times 100$) | Contract automatically flips status to `QUARANTINED`; API updates DB and triggers recovery |
| **Security Alert** | Integer ID (PK) | SQLite | `security_alerts` | Revert reason strings on EVM | `GET /batches/{id}`, `GET /verify/{id}`, `/ws/telemetry` | SecurityCenter, AuditorWorkspace, Toasts | Non-empty alert type and descriptive message | Alert record linked to exact `batch_id`; broadcasts instant notification over WebSocket |
| **Quarantined Batch** | 32-byte hex ID | EVM Contract | `batches.status = 'QUARANTINED'` | `batches[id].status = BatchStatus.QUARANTINED` | `GET /batches`, `GET /verify/{id}` | RecoveryView, QR Portal, BatchTable | Frozen state: no further normal telemetry or handover allowed | Permanent on-chain lock; can only be superseded by linking authorized replacement lot |
| **Replacement Lot** | 32-byte hex ID | EVM Contract | `batches.replacement_batch_id` | `batches[id].replacementBatchId` | `POST /batches/{id}/link-replacement` | RecoveryView, BatchDetailView, QR Portal | Replacement must exist, be in `CREATED`/`IN_TRANSIT`, and cannot equal parent | Contract links `quarantinedBatch -> replacementBatch`, sets parent status to `REPLENISHED` |
| **Consumer QR Query** | Hash / URL parameter | Smart Resolver (API) | Read-only aggregation | Read-only `getBatch()` call | `GET /api/v1/verify/{id}` | QRVerifyPortal, Public Scanner | Accepts `0x` hex, 64-char raw hex, case-insensitive, or prefix | Resolves canonical record across DB and on-chain storage; returns replacement if superseded |
| **Regulatory Report** | Batch ID (`bytes32`) | Algorithmic Generator | Dynamic Markdown / SHA-256 | Verifies on-chain audit trail | `GET /api/v1/audit/{id}/report` | AuditorWorkspace, Downloadable MD | 100% deterministic local compilation; zero external API dependencies | Synthesizes on-chain lineage, custody transitions, and telemetry into FDA 21 CFR Part 11 report |
| **Fleet GPS Waypoints** | Latitude / Longitude tuple | Interpolation Engine | `telemetry.latitude`, `telemetry.longitude` | Parameter in `submitSignedTelemetry()` | `/ws/telemetry`, `GET /batches/{id}` | TransitMap, MonitoringView | Coordinates along NH44 corridor (Hyderabad -> Chennai) | Map markers auto-pan and clamp to defined route bounds |
