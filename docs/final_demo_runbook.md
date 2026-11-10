# PharmaTrace — Final Comprehensive Demonstration Runbook

**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Framework  
**Course / Context:** CBS3002 Information Security Project  
**Authors:** Kaviselvaram Kathirvel & Aniesh S  
**Date:** October 2026 | Verified Execution Baseline  
**Estimated Walkthrough Duration:** 15 – 20 minutes  
**Application URL:** `http://localhost:5174`  
**API Health URL:** `http://localhost:8001/health`  
**Blockchain RPC:** `http://localhost:8546` (Local Hardhat EVM Node)

---

## 1. Prerequisites & Single-Command Startup

Ensure local ports `8546`, `8001`, and `5174` are available.

From repository root (`/Users/kaviselvaramkathirvel/Infosecproj`):

```bash
# 1. Orchestrated Startup
npm run demo:start

# 2. Check Service Health
npm run demo:status
```

Expected startup verification:
- Hardhat EVM: Port 8546 responsive (Chain ID: 31337)
- Deployed Contracts: `SupplyChainRegistry` (`0x5FbDB...`), `PharmaSupplyChain` (`0xe7f17...`)
- FastAPI Gateway: Port 8001 responsive (`/health` returns HTTP 200 `HEALTHY`)
- Vite Frontend: Port 5174 responsive with reverse proxy active
- Seeded Data: 8 distinct lots (Demo A through Demo H) verified on-chain and in SQLite

---

## 2. Demonstration Dataset Quick Reference (Demo A through Demo H)

| Scenario | Batch Lot Identifier (bytes32) | Product Name | Target Status | Primary Verification Target |
|---|---|---|---|---|
| **Demo A** | `0x1111111111111111111111111111111111111111111111111111111111111111` | Comirnaty BNT162b2 | `IN_TRANSIT` | Nominal transit, in-range telemetry (4.2°C), verified QR |
| **Demo B** | `0x2222222222222222222222222222222222222222222222222222222222222222` | Covaxin BBV152 | `CREATED` | Freshly minted, warehouse origin, ready for carrier pickup |
| **Demo C** | `0x3333333333333333333333333333333333333333333333333333333333333333` | Spikevax mRNA-1273 | `QUARANTINED` | Temperature excursion (+14.2°C), on-chain auto-quarantine |
| **Demo D** | `0x4444444444444444444444444444444444444444444444444444444444444444` | Vaxzevria ChAdOx1 | `IN_TRANSIT` | Cryptographic signature tamper rejection (`INVALID_SIGNER`) |
| **Demo E** | `0x5555555555555555555555555555555555555555555555555555555555555555` | Corbevax RBD Protein | `IN_TRANSIT` | Monotonic nonce replay protection (`REPLAY_ATTACK_DETECTED`) |
| **Demo F** | `0x6666666666666666666666666666666666666666666666666666666666666666` | ZyCoV-D DNA Plasmid | `DELIVERED` | Full 2-of-2 dual custody transfer to hospital, 100% GxP |
| **Demo G** | `0x7777777777777777777777777777777777777777777777777777777777777777` | Nuvaxovid NVX-CoV2373 | `QUARANTINED` | Compromised parent lot linked to replacement child `0x8888...` |
| **Demo H** | `0x8888888888888888888888888888888888888888888888888888888888888888` | Nuvaxovid NVX-CoV2373 | `IN_TRANSIT` | Expedited replacement batch with on-chain parent pointer |

---

## 3. Step-by-Step Scenario Demonstration Script

### Scenario 1: Nominal Cold-Chain Transit (Demo A)
1. Navigate to `http://localhost:5174/#batches`.
2. Locate batch `0x1111...1111` (Comirnaty BNT162b2). Status is `IN_TRANSIT`.
3. Click on row to open **Lot Dossier** (`#batches/0x1111...`).
4. **Inspect Tabs:**
   - **Journey Timeline:** Shows origin Genome Valley, active transit along NH44 corridor.
   - **Telemetry:** In-range readings around 4.20°C (compliant with 2.0°C – 8.0°C specification).
   - **Cryptography:** Shows EIP-191 digest, `r, s, v` ECDSA signature, and verified signer.
   - **On-Chain State:** Direct EVM query confirms custodian `0x3C44...` (Carrier).

### Scenario 2: Pre-Transit Batch Genesis (Demo B)
1. Navigate to `http://localhost:5174/#batches`.
2. Inspect batch `0x2222...2222` (Covaxin BBV152).
3. Status is `CREATED`. Current Custodian is Manufacturer (`0x7099...`).
4. Note that zero transit telemetry exists—this represents unreleased warehouse inventory.

### Scenario 3: Real-Time Temperature Excursion & Auto-Quarantine (Demo C)
1. Navigate to `http://localhost:5174/#recovery`.
2. Inspect batch `0x3333...3333` (Spikevax mRNA-1273).
3. **Observation:**
   - Display shows prominent red `QUARANTINED` status badge.
   - Thermal telemetry log shows temperature spike to +14.20°C (breaching the 8.00°C upper limit).
   - Smart contract autonomously executed quarantine transition without central admin intervention.
4. **Action:** Click "Prepare Replenishment" to view expedited replacement workflow.

### Scenario 4: Cryptographic MITM Tamper Defense (Demo D)
1. Navigate to `http://localhost:5174/#security`.
2. Locate Security Alert `SEC-ALT-001` linked to batch `0x4444...4444`.
3. **Forensic Details:**
   - Attack type: `MITM_SIGNATURE_TAMPER`.
   - Exploit mechanism: Payload modified post-signature (temperature altered in transit).
   - Defense mechanism: EVM smart contract executed `ecrecover()`, detected recovered address differed from registered carrier, reverted transaction, and logged incident.
   - Result: Protected state was NOT advanced.

### Scenario 5: Monotonic Nonce Replay Attack Defense (Demo E)
1. On `http://localhost:5174/#security`, locate `SEC-ALT-002` linked to batch `0x5555...5555`.
2. **Forensic Details:**
   - Attack type: `REPLAY_ATTACK_DETECTED`.
   - Exploit mechanism: Replay of exact historical signed packet.
   - Defense mechanism: Smart contract enforced strict monotonicity `require(nonce > lastNonce)`.
   - Result: Replayed packet rejected; zero duplicate state change.

### Scenario 6: 2-of-2 Dual-Custody Handover (Demo F)
1. Navigate to `http://localhost:5174/#custody`.
2. Inspect batch `0x6666...6666` (ZyCoV-D DNA Plasmid).
3. **Observation:**
   - Current Custodian is Hospital (`0x90F7...`).
   - Status is `DELIVERED`.
   - Protocol step diagram displays both Step 1 (Release by Carrier) and Step 2 (Acceptance by Hospital) successfully mined on-chain.

### Scenario 7 & 8: Autonomous Lineage & Replacement Lot (Demo G & Demo H)
1. Navigate to `http://localhost:5174/#recovery`.
2. Scroll to **Autonomous Lineage Tree**.
3. **Inspect Parent-Child Relationship:**
   - Parent lot `0x7777...` is marked `QUARANTINED` (spoiled due to severe +16.8°C excursion).
   - Linked replacement child lot is `0x8888...` (`IN_TRANSIT`).
   - Lineage pointer is stored directly in smart contract storage via `linkReplacementBatch()`.

### Scenario 9: Consumer QR Package Verification Portal
1. Navigate to `http://localhost:5174/#verify`.
2. **Test 1 (Valid Nominal Lot):**
   - Enter `0x1111111111111111111111111111111111111111111111111111111111111111`.
   - Click "Verify Package".
   - **Result:** Green Authentic Shield, "SAFE TO ADMINISTER", full unbroken cold-chain history.
3. **Test 2 (Quarantined Lot):**
   - Enter `0x3333333333333333333333333333333333333333333333333333333333333333`.
   - Click "Verify Package".
   - **Result:** Red Alert Banner, "QUARANTINED - DO NOT ADMINISTER", details on temperature breach.
4. **Test 3 (Quarantined Parent with Replacement):**
   - Enter `0x7777777777777777777777777777777777777777777777777777777777777777`.
   - Click "Verify Package".
   - **Result:** Warning banner with clear lineage notice: "Lot superseded by replacement lot `0x8888...`". Clickable link redirects directly to replacement lot verification.
5. **Test 4 (Unknown Hash):**
   - Enter `0x9999999999999999999999999999999999999999999999999999999999999999`.
   - Click "Verify Package".
   - **Result:** Clean "Batch lot not found in registry" message without silent fallback to any active lot.

### Scenario 10: Regulatory Compliance Audit (FDA 21 CFR Part 11)
1. Navigate to `http://localhost:5174/#auditor`.
2. Select batch `0x1111...` or `0x6666...`.
3. Click "Generate Regulatory Audit Report".
4. **Observation:**
   - 100% deterministic compilation—zero third-party API dependencies.
   - Electronic records verification (§11.10(a)).
   - Tamper-evident audit trail (§11.10(e)).
   - Electronic signature accountability (§11.50).
   - Export report as `.md` file or copy to clipboard.

---

## 4. Safe Shutdown Procedure

To cleanly terminate only background processes started by PharmaTrace:

```bash
npm run demo:stop
```

This terminates only the PIDs recorded in `.run/` without disrupting unrelated user applications.
