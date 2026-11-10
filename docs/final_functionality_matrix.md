# PharmaTrace — Final Functionality Matrix
**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Platform  
**Authors:** Kaviselvaram Kathirvel and Aniesh S  
**Course:** CBS3002 — Information Security  
**Audit Date:** October 21, 2026  

---

## 1. Summary of Interactive Elements

- **Total Interactive Elements Inventoried:** 42
- **Verified Working (`VERIFIED_WORKING`):** 34
- **Fixed & Retested (`FIXED_AND_RETESTED`):** 8
- **Broken / Partial / Blocked:** 0

---

## 2. Interactive Control Execution & Verification Matrix

| Element ID | Screen / View | Control Type | Label / Action | Expected Result | Actual Result | Verification Evidence | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CTL-01** | Landing Page | Button | "Enter Enterprise Platform" | Navigates to `#overview` dashboard | Successfully mounts Overview workspace | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-02** | Landing Page | Button | "Verify Batch QR" | Navigates to `#verify` portal | Successfully mounts Consumer QR portal | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-03** | Sidebar | Nav Button | "Overview" | Switches center stage to `#overview` | Overview tab active, URL hash updated | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-04** | Sidebar | Nav Button | "Batches" | Switches center stage to `#batches` | Batches registry table displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-05** | Sidebar | Nav Button | "Live Telemetry" | Switches center stage to `#monitoring` | Live telemetry ops & controls displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-06** | Sidebar | Nav Button | "Fleet Transit Map" | Switches center stage to `#map` | Interactive NH44 map displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-07** | Sidebar | Nav Button | "Custody Handover" | Switches center stage to `#custody` | 2-of-2 custody manager displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-08** | Sidebar | Nav Button | "Security Center" | Switches center stage to `#security` | Cryptographic defense center displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-09** | Sidebar | Nav Button | "Quarantine & Recovery" | Switches center stage to `#recovery` | Recovery protocol and actions displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-10** | Sidebar | Nav Button | "Blockchain Ledger" | Switches center stage to `#explorer` | Mined block stream displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-11** | Sidebar | Nav Button | "Consumer QR" | Switches center stage to `#verify` | Public QR inspection tool displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-12** | Sidebar | Nav Button | "Regulatory Auditor" | Switches center stage to `#auditor` | Compliance inspector displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-13** | Sidebar | Nav Button | "Chaos Studio" | Switches center stage to `#chaos` | Adversarial laboratory displayed | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-14** | Sidebar | Button | Collapse / Expand Toggle | Toggles sidebar between 74px and 210px | Width smoothly transitions; icons remain accessible | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-15** | Navbar | Select | Active Persona Dropdown | Updates active role state across session | Updates active persona context | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-16** | Navbar | Button | "+ Mint Batch" (Header) | Opens `CreateBatchModal` | Modal mounts with focus on product input | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-17** | Navbar | Pill | EVM Block Number | Navigates to `#explorer` | Mounts Blockchain Ledger view | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-18** | Navbar | Pill | WebSocket Heartbeat | Navigates to `#monitoring` | Mounts Live Telemetry view | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-19** | Overview | Pill | Period Selector ("This month") | Cycles time period window | Label cycles (Month -> Week -> Today -> Quarter) | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-20** | Overview | Card Button | "Active shipments" Arrow | Navigates to `#batches` | Opens batch registry | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-21** | Overview | Card Button | "Delivered lots" Arrow | Navigates to `#batches` | Opens batch registry | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-22** | Overview | Donut | Status Breakdown Donut Arc | Proportional SVG circles reflecting batches | Renders exact segment ratios from real counts | Code inspection & screenshot | `FIXED_AND_RETESTED` |
| **CTL-23** | Batch Table | Card | "New lots" (Blue) | Filters table rows to status `CREATED` | Table displays only newly minted lots | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-24** | Batch Table | Card | "Await handover" (Peach) | Filters table rows to `CREATED` & `IN_TRANSIT` | Table isolates pending custody lots | Filter click test | `FIXED_AND_RETESTED` |
| **CTL-25** | Batch Table | Card | "On way lots" (Yellow) | Filters table rows to status `IN_TRANSIT` | Table displays active reefer shipments | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-26** | Batch Table | Card | "Delivered lots" (Green) | Filters table rows to status `DELIVERED` | Table displays completed hospital receipts | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-27** | Batch Table | Input | Search Input Box | Real-time text filter across name and ID | Table updates instantaneously as typed | Text typing test | `VERIFIED_WORKING` |
| **CTL-28** | Batch Table | Button | "Export" | Exports manifest of visible lots to JSON file | Downloads `pharmatrace_lots_manifest_*.json` | File generation check | `VERIFIED_WORKING` |
| **CTL-29** | Batch Table | Button | "Sort: Mode" | Cycles sort modes (Default, A-Z, Date, Status) | Re-orders rows according to active sort key | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-30** | Batch Table | Buttons | Pagination Chevron Left/Right | Navigates between table pages (6 rows/page) | Updates page index and rendered rows | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-31** | Batch Table | Checkbox | Select All / Select Row | Selects lot(s) for bulk export | Selection state updates, export counter increments | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-32** | Batch Table | Row Button | "Simulate" / "Pause" | Starts/pauses telemetry generation for lot | Worker toggles, button flips to Pause/Simulate | API Matrix Step 13, 17 | `VERIFIED_WORKING` |
| **CTL-33** | Batch Table | Row Button | "Handover" | Opens `HandoverModal` for selected lot | Mounts handover modal with batch context | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-34** | Batch Table | Row Button | "Verify QR" (Icon) | Navigates to `#verify/<batchId>` | Opens consumer verification for exact batch | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-35** | Batch Table | Row Button | "Lot Dossier" (...) | Navigates to `#batches/<batchId>` | Opens complete detailed lot dossier | Browser Subagent Run | `VERIFIED_WORKING` |
| **CTL-36** | Create Modal | Form Submit | "Mint Batch Lot" | Validates range (`min < max`) and calls API | Invalid range rejected; valid minted on EVM | Golden Path Step 1 | `FIXED_AND_RETESTED` |
| **CTL-37** | Handover Modal | Form Submit | "Sign & Initiate Transfer" | Submits Step 1 multi-sig transaction on-chain | Signs intent on EVM, advances to Step 2 | Golden Path Step 3 | `FIXED_AND_RETESTED` |
| **CTL-38** | Handover Modal | Button | "Confirm & Settle Custody" | Submits Step 2 counter-signature on-chain | Atomically settles new custodian on EVM | Golden Path Step 4 | `VERIFIED_WORKING` |
| **CTL-39** | Chaos Studio | Button | "Inject MITM" | Corrupts telemetry payload post-signature | EVM contract reverts with INVALID_SIGNATURE | Golden Path Step 9-10 | `FIXED_AND_RETESTED` |
| **CTL-40** | Chaos Studio | Button | "Trigger Excursion" | Simulates compressor failure (temp > 8°C) | Temp breaches boundary, batch quarantined | Golden Path Step 11-14 | `FIXED_AND_RETESTED` |
| **CTL-41** | Chaos Studio | Button | "Restore Nominal Physics" | Resets attack enum and nominal temp setpoint | Attack cleared, temp restored to 4.5°C | API Matrix Step 16 | `VERIFIED_WORKING` |
| **CTL-42** | Auditor View | Button | "Copy Markdown Report" | Copies FDA 21 CFR Part 11 report to clipboard | Clipboard updated, "Copied to clipboard!" toast | Browser click verification | `VERIFIED_WORKING` |
