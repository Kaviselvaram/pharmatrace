# PharmaTrace — Final End-to-End Test Matrix
**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Platform  
**Authors:** Kaviselvaram Kathirvel and Aniesh S  
**Course:** CBS3002 — Information Security  
**Audit Date:** October 21, 2026  

---

## 1. Test Suite Summary

- **Total Test Cases Executed:** 22
- **Passing / Verified:** 22
- **Failing / Blocked:** 0
- **Pass Rate:** **100%**

---

## 2. Comprehensive End-to-End Test Matrix

| Test ID | Feature & Screen | Preconditions | Test Data | Action / API Call | Expected Result | Actual Result | Persistence & Cross-View Check | Evidence / Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **E2E-01** | Navigation & Routing | Application loaded | Hash routes (`#overview`, `#batches`, etc.) | Click sidebar items and change URL hash | Correct view rendered; window scroll resets to top | All 11 tabs mount cleanly without error | Direct URL hash reload retains selected view | Browser Subagent Run | `VERIFIED_WORKING` |
| **E2E-02** | Role & Batch Selectors | Batches exist in registry | Persona strings; Batch IDs | Change role dropdown; select target lot | Active role updates; active batch updates in sub-views | Dropdown selections propagate to all child components | Selection survives tab navigation | Browser Subagent Run | `VERIFIED_WORKING` |
| **E2E-03** | Batch Registration Form | User on Batches or Overview | Product: `Covaxin mRNA Booster`, 2.0°C - 8.0°C | Click "+ Mint Batch", fill form, submit | New batch minted on EVM, added to SQLite, modal closes | Genesis transaction mined; lot appears in table | Record persists on reload; verified in Block Explorer | Golden Path Step 1 | `VERIFIED_WORKING` |
| **E2E-04** | Search, Filter, Sort, Page | Batches in table | Alphanumeric queries; category clicks | Filter by "Await handover", sort by Product | Matching rows isolated; sorting order applied | Table updates instantaneously; pagination recalibrated | State updates cleanly without server re-fetch | Browser Subagent Run | `VERIFIED_WORKING` |
| **E2E-05** | Dashboard Metrics & Donut | Batches loaded | Batch status array | Render Overview greeting and status donut | Real counts displayed; proportional SVG arcs rendered | Exact ratio calculated without fallback mock numbers | Matches sum of rows in BatchTable | Browser Subagent Run | `VERIFIED_WORKING` |
| **E2E-06** | Lot Dossier Details | Batch exists | Batch ID | Click "Lot Dossier" row action | Opens `#batches/<id>` with complete 4-tab dossier | Timeline, telemetry points, and EVM state rendered | Matches live on-chain `getBatch()` call | Browser Subagent Run | `VERIFIED_WORKING` |
| **E2E-07** | Telemetry Ingestion | Batch in `IN_TRANSIT` | Telemetry packet (4.50°C, NH44 GPS) | Telemetry simulation daemon step | Packet signed, committed on-chain, streamed to WS | `submitSignedTelemetry` mined; waveform plots point | Packet cached in SQLite `telemetry` table | Golden Path Step 5-8 | `VERIFIED_WORKING` |
| **E2E-08** | Cryptographic Vectors | Python security module | 78-byte canonical test vector | Binary packing and EIP-191 digest check | Exact 78-byte length, exact offsets, valid `ecrecover` | `recover_telemetry_signer` recovers Hardhat Account #0 | Vector matches Solidity `PharmaSupplyChain.sol` | Verify All Step 5 | `VERIFIED_WORKING` |
| **E2E-09** | Replay Attack Protection | Valid signed packet consumed | Stale nonce (e.g. nonce = 1) | Submit packet with duplicate/stale nonce | EVM contract reverts with `REPLAY_ATTACK_DETECTED` | Transaction rejected; alert logged in SQLite | Contract `latestNonce` unchanged | Golden Path Step 10b | `VERIFIED_WORKING` |
| **E2E-10** | Dual Custody Handover | Batch in `CREATED` | Recipient: Carrier `0x3C44...` | Step 1 Initiate -> Step 2 Confirm | Custody transfers atomically on-chain | New custodian reflected on EVM and SQLite | Reflected in Navbar, BatchTable, and Dossier | Golden Path Step 3-4 | `VERIFIED_WORKING` |
| **E2E-11** | Chaos Studio Faults | Simulator running | Fault: `MITM_ALTERATION` | Click "Inject MITM" in Chaos Studio | Payload altered post-signing, contract reverts | Toast displays `INVALID_SIGNATURE`; alert recorded | SQLite `security_alerts` stores forensic incident | Golden Path Step 9-10 | `VERIFIED_WORKING` |
| **E2E-12** | Thermal Excursion & Quarantine | Reefer in transit | Temperature = 11.80°C (> 8.00°C) | Trigger compressor failure in simulator | Contract accepts valid signature, sets `QUARANTINED` | Lot quarantined on EVM; toast alert emitted | Batch status transitions to `QUARANTINED` in DB | Golden Path Step 11-14 | `VERIFIED_WORKING` |
| **E2E-13** | Autonomous Recovery Lineage | Lot in `QUARANTINED` | Expedited replacement lot | Click "Prepare Replacement" & "Link" | Replacement lot minted & linked via `linkReplacementBatch` | Quarantined lot points to replacement; status `REPLENISHED` | Lineage verified via `getBatch()` and QR portal | Golden Path Step 15-16 | `VERIFIED_WORKING` |
| **E2E-14** | Public Consumer QR Portal | Lot exists on-chain | QR scan / hash paste | Query `GET /api/v1/verify/{id}` | Smart resolver decodes ID, returns safety verdict | Green shield if safe; warns if breached or replaced | Displays linked replacement lot if superseded | Golden Path Step 17 | `VERIFIED_WORKING` |
| **E2E-15** | Blockchain Ledger Explorer | EVM node active | Block number queries | Query `GET /api/v1/blockchain/blocks` | Returns recent 10 blocks with gas and tx hashes | Mined transactions visible; hashes copyable | Matches Hardhat RPC `eth_getBlockByNumber` | Browser Subagent Run | `VERIFIED_WORKING` |
| **E2E-16** | Regulatory Compliance Auditor | Batch has custody/telemetry | Batch ID | Request `GET /api/v1/audit/{id}/report` | Deterministically compiles FDA 21 CFR Part 11 MD | Complete markdown report with crypto signatures | Downloadable as `.md` file; zero external APIs | Golden Path Step 18 | `VERIFIED_WORKING` |
| **E2E-17** | System Health & WebSockets | Backend running | WebSocket endpoint `/ws/telemetry` | Connect WebSocket client | Continuous broadcast of frames and alerts | Heartbeat pill shows "LIVE HEARTBEAT"; reconnects | Reconnection tested upon daemon restart | Browser Subagent Run | `VERIFIED_WORKING` |
| **E2E-18** | Persistence & Service Restart | Data created in session | Process restart | Kill backend (`kill -9`) and restart | Backend re-binds, reads SQLite records, syncs EVM | All lots, alerts, and telemetry records persist intact | Database survives process termination | Verify All Step 1-7 | `VERIFIED_WORKING` |
| **E2E-19** | Invalid Input Validation | Create batch modal | `min_temp = 10.0`, `max_temp = 2.0` | Submit inverted temperature range | Form displays inline error; API rejects with HTTP 400 | No invalid record minted on-chain or saved | DB contains zero corrupted lots | API Matrix Step 6 | `VERIFIED_WORKING` |
| **E2E-20** | Duplicate & Unauthorized Rejection | Existing batch ID | Same batch ID | Attempt to create duplicate lot on-chain | Smart contract reverts; API returns HTTP 400 | Duplicate rejected; initial lot unharmed | Blockchain state preserves unique key | API Matrix Step 5 | `VERIFIED_WORKING` |
| **E2E-21** | Export & Copy Utilities | BatchTable / Auditor | Filtered rows; Markdown text | Click "Export" in table; "Copy" in auditor | File download triggered; text copied to clipboard | Correct JSON file and clipboard content verified | Clean DOM cleanup after anchor click | Browser Subagent Run | `VERIFIED_WORKING` |
| **E2E-22** | Responsive & Keyboard Layout | Various screen widths | Enter key in search; collapse sidebar | Press Enter on search; toggle sidebar collapse | Search navigates; sidebar collapses to icon pills | Layout adapts responsively without broken controls | No visual overlap or clipped cards | Browser Subagent Run | `VERIFIED_WORKING` |
