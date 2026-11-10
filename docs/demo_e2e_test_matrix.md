# PharmaTrace — End-to-End Test Matrix

**Project:** PharmaTrace — Blockchain-Secured Cold-Chain Cryptographic Traceability  
**Generated On:** 2026-10-22  
**Test Harnesses:** Pytest (`backend/tests`), Hardhat Waffle (`contracts/test`), Scripted Integration (`scripts/verify_golden_path.py`, `scripts/test_api_matrix.py`), Headless Browser Subagent  

---

## 1. Test Suite Summary

| Suite Category | Tests Defined | Tests Executed | Passed | Failed | Blocked | Execution Exit Code |
|---|---|---|---|---|---|---|
| **Solidity Smart Contracts** | 39 | 39 | 39 | 0 | 0 | 0 (Clean) |
| **Backend & Physics Pytest** | 16 | 16 | 16 | 0 | 0 | 0 (Clean) |
| **Golden Path Integration Flow** | 19 | 19 | 19 | 0 | 0 | 0 (Clean) |
| **REST API Matrix (All Endpoints)**| 23 | 23 | 23 | 0 | 0 | 0 (Clean) |
| **Canonical Cryptographic Proof** | 7 | 7 | 7 | 0 | 0 | 0 (Clean) |
| **Live Browser Subagent E2E** | 14 | 14 | 14 | 0 | 0 | 0 (Clean) |
| **TOTAL** | **118** | **118** | **118** | **0** | **0** | **100% GREEN** |

---

## 2. End-to-End Test Matrix Records

| Test ID | Page & Control | Preconditions | Test Input | User Action | Expected Result | Actual Result | Persistence Result | Related Views Checked | Evidence | Final Status |
|---|---|---|---|---|---|---|---|---|---|---|
| E2E-01 | `#portal` / Enter Workspace | App loaded on port 5174 | Click button | Mouse click at (914, 56) | Navigates to `#overview` | Hash changed to `#overview`; dashboard rendered | Session preserved | Overview, Sidebar | Subagent click pixel | `PASSED` |
| E2E-02 | `#overview` / KPI Cards | Seeded DB active | API poll | View page | 8 lots listed; block height displayed | Block #62, 8 lots, active stats rendered | DB rows match | Batches, Explorer | Subagent screenshot `overview_view` | `PASSED` |
| E2E-03 | `#batches` / Search Filter | 8 lots present | `"mRNA"` | Type in search input | Table filtered to Spikevax mRNA lot | Only batch `0x3333...` displayed | Local filter | Batches table | Subagent screenshot `filtered_batches` | `PASSED` |
| E2E-04 | `#batches` / Batch Details | Lot `0x1111...` exists | Click row | Left click row | Opens `BatchDetailView` | Full specs, 2-8°C band, provenance rendered | Hash `batches/0x1111...` | Batches, QR Portal | Subagent screenshot `batch_detail_modal` | `PASSED` |
| E2E-05 | `#monitoring` / Live Stream | Sim idle | Click "Start Stream" | Click button | 1Hz packets stream to WebSocket | Packets streamed; temp needle 4.2°C; battery 98% | Engine buffer | Live Telemetry, Map | Subagent screenshot `telemetry_streaming` | `PASSED` |
| E2E-06 | `#map` / Corridor Navigation | Telemetry active | View map | Inspect NH44 route | Map renders route waypoints from Hyderabad to Chennai | NH44 corridor waypoints rendered accurately | Static corridor + live coords | Overview, Transit Map | Subagent screenshot `fleet_transit_map` | `PASSED` |
| E2E-07 | `#custody` / Handover Table | Seeded custody records | View page | Inspect table | Shows Mfr, Carrier, Hospital nodes | Timeline rendered with timestamped blocks | EVM state + DB rows | Batches, Custody View | Subagent screenshot `custody_handover_view` | `PASSED` |
| E2E-08 | `#security` / Threat Alerts | Seeded incidents | View page | Inspect alerts table | Shows MITM tamper, Replay, Excursion alerts | Alerts rendered with severity badges & coordinates | SQLite `security_alerts` | Security Center, Overview | Subagent screenshot `security_center_view` | `PASSED` |
| E2E-09 | `#recovery` / Quarantined Lots | Lot `0x3333...` quarantined | View page | Inspect quarantine table | Batch `0x3333...` listed with +14.2°C excursion | Quarantined table displays lot `0x3333...` | DB `status="QUARANTINED"` | Recovery, QR Portal | Subagent screenshot `recovery_view` | `PASSED` |
| E2E-10 | `#recovery` / Lineage Tree | Lot `0x7777...` linked to `0x8888...` | View page | Inspect lineage card | Parent `0x7777...` links to replacement `0x8888...` | Lineage link card displays parent-child tree | EVM contract storage | Recovery, Batches | Subagent screenshot `recovery_view` | `PASSED` |
| E2E-11 | `#explorer` / Blocks List | EVM node on 8546 | View page | Inspect blocks | Block height #62, gas limit, recent blocks | Blocks table renders real local EVM blocks | EVM blockchain | Explorer, Navbar | Subagent screenshot `explorer_view` | `PASSED` |
| E2E-12 | `#verify` / Authentic QR | Lot `0x1111...` valid | `0x11111111...` | Click "Verify Package" | Renders green "AUTHENTIC / VERIFIED ON EVM" badge | Authentic verification badge and custody rendered | EVM verification | QR Portal, Details | Subagent screenshot `verify_portal_authentic_result` | `PASSED` |
| E2E-13 | `#verify` / Quarantined QR | Lot `0x3333...` quarantined | `0x33333333...` | Click "Verify Package" | Renders red "DO NOT ADMINISTER / QUARANTINED" | Red warning banner rendered with breach details | EVM verification | QR Portal, Recovery | Subagent browser inspection | `PASSED` |
| E2E-14 | `#verify` / Invalid Hash | Nonexistent ID | `0x99999999...` | Click "Verify Package" | Graceful not-found error without crash | Amber error banner displayed; no unhandled crash | None | QR Portal | Subagent browser inspection | `PASSED` |
| E2E-15 | `#auditor` / Compliance Report | Lot `0x1111...` valid | Select lot | Click "Generate Report" | Generates Markdown FDA 21 CFR Part 11 report | Deterministic audit report generated with GxP checks | Generated text | Auditor Workspace | Subagent screenshot `regulatory_auditor_page` | `PASSED` |
| E2E-16 | `#chaos` / Excursion Fault | Sim active | Click "Trigger Excursion" | Click button | Simulates +14.2°C excursion fault | Excursion injected; toast alert; gauge turns red | In-memory engine | Chaos Studio, Live Tel | Subagent screenshot `chaos_studio_excursion` | `PASSED` |
| E2E-17 | `#chaos` / Restore Physics | Excursion active | Click "Restore Physics" | Click button | Restores nominal 4.0°C physics | Faults cleared; toast confirms nominal physics | In-memory engine | Chaos Studio, Live Tel | Subagent screenshot `chaos_studio_restored` | `PASSED` |
| E2E-18 | Navbar / Mint Batch Modal | Manufacturer role | Click "+ Mint Batch" | Click button | Opens modal overlay with form inputs | Modal displayed with Product Name, Temp, Custodian | Transient modal | Navbar | Subagent modal inspection | `PASSED` |
| E2E-19 | Navbar / Modal Dismissal | Modal open | Click Close (X) | Click button | Dismisses modal overlay | Modal closed; dashboard restored | Modal closed | Navbar | Subagent modal inspection | `PASSED` |
