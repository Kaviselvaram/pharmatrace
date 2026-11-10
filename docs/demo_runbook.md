# PharmaTrace — Demonstration Live Runbook

**Project:** PharmaTrace — Blockchain-Secured Cold-Chain Cryptographic Traceability  
**Target Audience:** Technical Auditors, Enterprise Stakeholders, Life Sciences Compliance Evaluators  
**Estimated Walkthrough Duration:** 12 – 15 minutes  
**Application URL:** `http://localhost:5174`  
**API Health URL:** `http://localhost:8001/health`  
**Blockchain RPC:** `http://localhost:8546` (Local Hardhat EVM Node)  

---

## Pre-Demonstration Checklist

Before starting the live demonstration, ensure the stack is active:
- [x] Hardhat EVM Node running on port `8546` (`npx hardhat node --port 8546`)
- [x] Smart contracts deployed at `0x5Fb...` (Registry) and `0xe7f...` (SupplyChain)
- [x] FastAPI running on port `8001` (`uvicorn app.main:app --port 8001`)
- [x] Vite frontend running on port `5174`
- [x] Seed data applied: `python scripts/seed_demo_data.py` (8 demonstration lots active)

---

## 14-Step Live Demonstration Script

### Step 1 — System Health & Infrastructure Validation
- **Action:** Open `http://localhost:5174/#portal`. Observe the header badge showing "WS LIVE" and EVM block height `#62` (or current).
- **Talking Point:** *"PharmaTrace is connected directly to a local EVM smart contract and high-throughput WebSocket telematics server. All cold-chain events are verified on-chain, not through centralized middleware."*
- **Visual Cue:** Green pulse indicator in top-right navbar; "Connected: Hardhat (Chain 31337)".

### Step 2 — Enterprise Dashboard & Key Metrics
- **Action:** Click "Enter Enterprise Workspace" to land on `#overview`.
- **Talking Point:** *"The Overview gives an aggregated operational view: 8 monitored lots across 3 manufacturers, cold-chain compliance percentage, and real-time gas consumption."*
- **Visual Cue:** Stat cards displaying Total Lots (8), In-Transit (5), Quarantined (2), Delivered (1).

### Step 3 — Batch Registry & Cold-Chain Specifications
- **Action:** Navigate to `#batches`. Type `"mRNA"` in the search input to highlight lot `0x3333...`. Clear search and click row `0x1111...` to enter `BatchDetailView`.
- **Talking Point:** *"Every lot has an immutable cryptographic birth certificate minted on-chain. Notice the strict 2.0°C – 8.0°C GxP cold-chain boundary established by the manufacturer."*
- **Visual Cue:** GxP boundary indicators, Genesis transaction hash, carrier custodian address.

### Step 4 — Virtualized Edge Node Live Telemetry
- **Action:** Navigate to `#monitoring`. Select lot `0x1111...` and click **"Start Live Stream"**.
- **Talking Point:** *"Our edge telematics engine simulates a refrigerated container vehicle in transit. At 1Hz, the virtualized hardware security module signs GPS and dual-sensor temperature data using ECDSA secp256k1."*
- **Visual Cue:** Temperature gauge needle hovering nominally at 4.2°C; rolling history chart updating live; battery at 98%.

### Step 5 — Cryptographic Verification & Canonical 78-Byte Encoding
- **Action:** Scroll down on `#monitoring` to inspect the "Canonical EIP-191 Payload Hex" inspector.
- **Talking Point:** *"Notice the 78-byte tightly packed payload: 32 bytes for batch ID, 2 bytes for int16 temperature, 8 bytes for int32 coordinates, 4 bytes for timestamp, and 32 bytes for nonce. It is hashed with EIP-191 prefix `\x19Ethereum Signed Message:\n78` and verified inside Solidity via `ecrecover`."*
- **Visual Cue:** Green "ECDSA VERIFIED ON EVM" badge; hex byte inspector.

### Step 6 — Multi-Party 2-of-2 Custody Handover
- **Action:** Navigate to `#custody`. Inspect lot `0x6666...` (Delivered) and lot `0x1111...` (In Transit). Click "Transfer Custody" to open the `HandoverModal`.
- **Talking Point:** *"Custody transitions require multi-party dual authorization on-chain. Both carrier and receiving hospital must sign off before the smart contract updates the authorized telemetry signer."*
- **Visual Cue:** Handover modal showing dual sign-off checkboxes and recipient address verification.

### Step 7 — Security Center & Automated Threat Intelligence
- **Action:** Navigate to `#security`.
- **Talking Point:** *"PharmaTrace features proactive cryptographic intrusion detection. All failed contract calls—tampered signatures, replays, and unauthorized transactions—are captured with full forensic coordinates."*
- **Visual Cue:** Red/amber incident table displaying `SEC-ALT-001` (MITM Tamper) and `SEC-ALT-002` (Replay Attack).

### Step 8 — Cold-Chain Breach & Autonomous Quarantine
- **Action:** Navigate to `#recovery`. Inspect quarantined lot `0x3333333333333333333333333333333333333333333333333333333333333333`.
- **Talking Point:** *"When reefer temperature exceeded 8.0°C (+14.2°C logged), the smart contract autonomously transitioned the lot to QUARANTINED without requiring human intervention."*
- **Visual Cue:** Red "QUARANTINED" status badge; excursion trigger temperature chip.

### Step 9 — Autonomous Lineage Replacement
- **Action:** On `#recovery`, scroll down to the "Autonomous Lineage Tree".
- **Talking Point:** *"To protect clinical supply, the platform automatically triggered a replacement batch `0x8888...` linked directly to spoiled parent lot `0x7777...` via `linkReplacementBatch()` on-chain."*
- **Visual Cue:** Parent-child visual tree card showing `0x7777... (Parent)` linked to `0x8888... (Replacement Child)`.

### Step 10 — Consumer QR Package Verification Portal
- **Action:** Navigate to `#verify`.
  1. Input `0x1111111111111111111111111111111111111111111111111111111111111111` -> Click **"Verify Package"**. (Displays Green Authentic Badge).
  2. Input `0x3333333333333333333333333333333333333333333333333333333333333333` -> Click **"Verify Package"**. (Displays Red Quarantined / Do Not Administer Banner).
  3. Input `0x9999999999999999999999999999999999999999999999999999999999999999` -> Click **"Verify Package"**. (Displays graceful Unrecognized Identifier banner).
- **Talking Point:** *"Hospitals and end consumers can scan the package QR code. If the cold-chain was breached at any point in transit, the portal warns the nurse never to administer the drug."*
- **Visual Cue:** Immediate color change from green authentic shield to red hazard warning.

### Step 11 — Blockchain Ledger & Gas Economics
- **Action:** Navigate to `#explorer`.
- **Talking Point:** *"Here is our transparent ledger explorer querying the local EVM node. We inspect actual block headers, transaction hashes, and gas consumption for every telemetry checkpoint."*
- **Visual Cue:** Real block numbers, contract addresses (`0x5Fb...`, `0xe7f...`), gas metering.

### Step 12 — Regulatory Auditor Workspace (FDA 21 CFR Part 11)
- **Action:** Navigate to `#auditor`. Select lot `0x1111...` and click **"Generate Audit Report"**.
- **Talking Point:** *"For GxP and FDA compliance, auditors require immutable audit trails. We evaluate Title 21 CFR Part 11 compliance checklists, electronic signature validity, and generate automated inspection reports."*
- **Visual Cue:** Green compliance checkmarks (§11.10(a), §11.10(e), §11.50) and downloadable Markdown audit report.

### Step 13 — Adversarial Chaos Studio (Live Fault Injection)
- **Action:** Navigate to `#chaos`. Click **"Trigger Excursion"** (+14.2°C). Observe the toast notification and gauge reaction. Then click **"Restore Nominal Physics"**.
- **Talking Point:** *"Chaos Studio allows QA engineers to inject real hardware and cryptographic faults—signature tampering, temperature spikes, and GPS spoofing—to verify system resilience in real time."*
- **Visual Cue:** Toast notifications; real-time response of dashboard gauges.

### Step 14 — Persistence & Integrity Validation
- **Action:** Perform a hard browser refresh (`Cmd+Shift+R`). Revisit `#batches` and `#recovery`.
- **Talking Point:** *"Every state transition, custody transfer, and telemetry record is durably persisted across SQLite and the EVM state. Zero data drift occurs upon reload."*
- **Visual Cue:** Instantaneous rehydration of all 8 lots and active statuses.
