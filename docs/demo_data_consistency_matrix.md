# PharmaTrace — Demonstration Data Consistency Matrix

**Project:** PharmaTrace — Blockchain-Secured Cold-Chain Cryptographic Traceability  
**Generated On:** 2026-10-22  
**Scope:** Canonical state alignment, authoritative sources of truth, type encodings, and cross-view synchronization guarantees.

---

## 1. Authoritative Source of Truth Matrix

| Entity / Property | Authoritative Source | Secondary / Synced Stores | Sync Mechanism | Conflict Resolution Rule |
|---|---|---|---|---|
| **Batch Identity (`batch_id`)** | Smart Contract (`PharmaSupplyChain.sol`) | SQLite `batches.batch_id`, UI hash routes | Indexed on contract minting event; verified by Web3 lookup | Contract `batchId` (bytes32) is immutable truth. DB row cannot exist without contract registration. |
| **Batch Lifecycle Status** | Smart Contract (`BatchStatus` enum) | SQLite `batches.status`, Frontend state | Synced via Web3 contract call on batch fetch & WebSocket events | On discrepancy, contract state overrides SQLite. SQLite is updated immediately upon detection. |
| **Current Custodian** | Smart Contract (`batch.currentCustodian`) | SQLite `batches.current_custodian` | EVM `CustodyTransferred` event / API post-receipt sync | Smart contract address is authoritative. Handover is invalid until mined on-chain. |
| **EIP-191 Telemetry Signature** | Vehicle Edge Node Virtual HSM | Smart Contract `submitSignedTelemetry()`, SQLite `telemetry_records` | Direct RPC call to contract followed by DB row persistence | Signature verification is executed on EVM via `ecrecover`. Rejected packets are never stored in telemetry table. |
| **Telemetry Nonce** | Smart Contract (`batch.lastNonce`) | SQLite `telemetry_records.nonce` | Contract storage slot incremented on valid receipt | Contract `lastNonce` enforces strict monotonicity. If DB nonce != EVM nonce, EVM is ground truth. |
| **Parent-Child Lineage** | Smart Contract (`replacementBatch[parent]`) | SQLite `batches.replacement_batch_id` | Contract `linkReplacementBatch()` call | Contract storage mapping is authoritative. DB stores reference for fast relational querying. |
| **Cold-Chain Limits (Min/Max °C)** | Smart Contract (`batch.minTemp`, `batch.maxTemp`) | SQLite `batches.min_temp_celsius`, `batches.max_temp_celsius` | Seed/Mint payload copied to both stores | Contract stores fixed-point `int16(T * 100)`. SQLite stores `FLOAT`. Contract bounds are enforced on-chain. |
| **Security Alerts & Incidents** | SQLite `security_alerts` table | In-Memory WebSocket broadcast, UI Threat Intel | Written by FastAPI security middleware upon detection of EVM reverts or excursions | DB is authoritative for persistent incident logging. |
| **Live Sensor Stream (Transient)** | Real-time WebSocket (`/ws/telemetry`) | UI local buffer (last 40 points) | Streaming 1Hz packets from `telemetry_node.py` | Transient display only; persistence occurs only after transaction confirmation. |

---

## 2. Canonical Status Mapping & State Machine

The smart contract enforces a strict one-way state machine. Status mapping between Solidity enum, SQLite string, and UI display badge:

| Solidity Enum Value | SQLite String | Frontend UI Badge | Permitted Next States | Triggering Event / Action |
|---|---|---|---|---|
| `BatchStatus.CREATED (0)` | `"CREATED"` | `[CREATED]` (Amber) | `IN_TRANSIT`, `QUARANTINED` | Initial minting by manufacturer (`createBatch`). |
| `BatchStatus.IN_TRANSIT (1)` | `"IN_TRANSIT"` | `[IN TRANSIT]` (Blue) | `DELIVERED`, `QUARANTINED` | First custody handover to carrier or telemetry start. |
| `BatchStatus.DELIVERED (2)` | `"DELIVERED"` | `[DELIVERED]` (Green) | Terminal State | Successful 2-of-2 custody handover to destination hospital. |
| `BatchStatus.QUARANTINED (3)` | `"QUARANTINED"` | `[QUARANTINED]` (Red) | Terminal State (Can spawn replacement child) | Excursion (`temp < min` or `temp > max`) or critical tamper detected. |

*Rule: Once a batch enters `QUARANTINED` or `DELIVERED`, no further custody handovers or standard telemetry submissions are accepted by the smart contract.*

---

## 3. Canonical Field Formats & Encodings

| Field | Canonical Representation | Python Type | Solidity Storage Type | Wire Encoding Format |
|---|---|---|---|---|
| `batch_id` | 32-byte hexadecimal string (`0x` + 64 hex chars) | `str` (66 chars) | `bytes32` | `bytes32` hex |
| `temperature` | Fixed-point Celsius with 2 decimal places | `float` | `int16` (multiplied by 100) | `int16` big-endian (e.g., 4.20°C -> `420`) |
| `latitude` | Micro-degrees (6 decimal places) | `float` | `int32` (multiplied by 1,000,000) | `int32` big-endian (e.g., 17.5372° -> `17537200`) |
| `longitude` | Micro-degrees (6 decimal places) | `float` | `int32` (multiplied by 1,000,000) | `int32` big-endian (e.g., 78.5834° -> `78583400`) |
| `timestamp` | Unix epoch timestamp (seconds) | `int` | `uint32` | `uint32` big-endian |
| `nonce` | Strictly increasing transaction counter | `int` | `uint256` | `uint256` big-endian (32 bytes) |
| `signature` | 65-byte EIP-191 Secp256k1 signature | `str` (`0x` + 130 hex) | `bytes` (`r`, `s`, `v`) | Big-endian `r || s || v` (where `v` in `{27, 28}`) |
| `custodian_address` | 20-byte checksummed Ethereum address | `str` (42 chars) | `address` | `address` (20 bytes) |
| `replacement_id` | 32-byte hex ID or `null` | `Optional[str]` | `bytes32` (zeros if unlinked) | `bytes32` |

---

## 4. Cross-View Consistency Verification Matrix

For every seeded demonstration lot, state consistency was verified across all 10 application views:

| Lot ID | Overview KPI | Batches Table | Batch Detail | Monitoring / Live | Transit Map | Custody View | Security Alerts | Quarantine / Recovery | QR Portal | Auditor Report | Status Reconciliation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `0x1111...` | Listed | `IN_TRANSIT` | 4.2°C, 2-8°C | Active (Nominal) | NH44 Route | Carrier (`0x3C44...`) | Clean | Not Quarantined | `AUTHENTIC` | 100% GxP Pass | **100% CONSISTENT** |
| `0x2222...` | Listed | `CREATED` | Pre-transit | Idle | Genome Valley | Mfr (`0x7099...`) | Clean | Not Quarantined | `AUTHENTIC` | Genesis Record | **100% CONSISTENT** |
| `0x3333...` | Listed | `QUARANTINED` | 14.2°C Excursion | Breached | Mahabubnagar | Carrier (`0x3C44...`) | `EXCURSION` | Listed Quarantined | `QUARANTINED` | Excursion Flagged | **100% CONSISTENT** |
| `0x4444...` | Listed | `IN_TRANSIT` | Adversarial test | Idle | Kurnool | Carrier (`0x3C44...`) | `MITM_TAMPER` | Not Quarantined | `AUTHENTIC` | Signature Warning | **100% CONSISTENT** |
| `0x5555...` | Listed | `IN_TRANSIT` | Replay test | Idle | Anantapur | Carrier (`0x3C44...`) | `REPLAY_ATTACK`| Not Quarantined | `AUTHENTIC` | Nonce Replay Alert| **100% CONSISTENT** |
| `0x6666...` | Listed | `DELIVERED` | Final Destination | Completed | Apollo Chennai | Hospital (`0x90F7...`)| Clean | Not Quarantined | `DELIVERED` | Complete Handover | **100% CONSISTENT** |
| `0x7777...` | Listed | `QUARANTINED` | Spoiled Parent | Breached | Krishnagiri | Carrier (`0x3C44...`) | `AUTONOMOUS` | Parent `0x7777...` | `QUARANTINED` | Lineage Linked | **100% CONSISTENT** |
| `0x8888...` | Listed | `IN_TRANSIT` | Expedited Child| Active (Nominal) | NH44 Active | Carrier (`0x3C44...`) | Clean | Child `0x8888...` | `AUTHENTIC` | Replacement Verified| **100% CONSISTENT** |

---

## 5. Refresh & Restart Preservation Audit

1. **Browser Hard Refresh (`Cmd+Shift+R`):**
   - Active route (`#batches`, `#monitoring`, `#recovery`, etc.) restores accurately from URL hash.
   - Batch selections restore cleanly.
   - Zero state drift observed between frontend view and backend database.
2. **Backend Daemon Restart:**
   - FastAPI loads SQLite database without data loss.
   - Web3 service reconnects to Hardhat node on port 8546 and re-synchronizes contract addresses.
3. **Hardhat Node Liveness:**
   - Contract addresses remain pinned at `0x5FbDB2315678afecb367f032d93F642f64180aa3` and `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`.
   - Block number continues monotonically from block height #62.
