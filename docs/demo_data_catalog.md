# PharmaTrace — Demonstration Data Catalog

**Project:** PharmaTrace — Blockchain-Secured Cold-Chain Cryptographic Traceability  
**Seeder Implementation:** `scripts/seed_demo_data.py`  
**Database:** `data/infosecproj.db` (SQLite WAL)  
**Smart Contracts:** `PharmaSupplyChain` (`0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`), `SupplyChainRegistry` (`0x5FbDB2315678afecb367f032d93F642f64180aa3`)  
**Chain ID:** 31337 (Local Hardhat Node on port 8546)  

---

## 1. Seed Architecture & Principles

The demonstration dataset is designed around 10 realistic supply-chain operational and adversarial scenarios. It satisfies the following architectural guarantees:

1. **Deterministic Stable Identifiers:** All demonstration lots use fixed 32-byte hex identifiers (`0x1111...` through `0x8888...`) for reproducible documentation, testing, and bookmarked URL verification.
2. **Real On-Chain Transactions:** Batches are genuinely minted on the local EVM smart contract (`PharmaSupplyChain.sol`). Custody handovers and replenishment links are genuine contract function calls producing verifiable transaction receipts and blocks.
3. **Idempotent Re-Seeding:** Re-running `python scripts/seed_demo_data.py` safely updates existing records without creating duplicates, breaking foreign key relationships, or polluting the database.
4. **Isolated Synthetic Marker:** All records carry explicit demonstration metadata and known test keys, ensuring zero confusion with real-world physical supply chains.
5. **Referential Integrity:** Telemetry packets, route coordinates along the NH44 pharma corridor, security alerts, and lineage linkages maintain 100% relational integrity.

---

## 2. Seeded Demonstration Lots & Scenarios Catalog

| Lot Number | Product Name | Temp Spec | Initial Status | Custodian Role & Address | Demonstrated Scenario & Verification Target |
|---|---|---|---|---|---|
| `0x1111111111111111111111111111111111111111111111111111111111111111` | Comirnaty BNT162b2 (Nominal Transit Lot) | 2.0°C – 8.0°C | `IN_TRANSIT` | Carrier (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`) | **Scenario 1: Nominal Cold-Chain Transit.** Valid EIP-191 telemetry at 4.2°C, active GPS route progress along NH44 corridor, authentic QR status. |
| `0x2222222222222222222222222222222222222222222222222222222222222222` | Covaxin BBV152 (Genesis Manufacturing Lot) | 2.0°C – 8.0°C | `CREATED` | Manufacturer (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`) | **Scenario 2: Pre-Transit / Warehouse Genesis.** Freshly minted on EVM, stored at manufacturer facility in Hyderabad Genome Valley awaiting carrier pickup. |
| `0x3333333333333333333333333333333333333333333333333333333333333333` | Spikevax mRNA-1273 (Thermal Breach Lot) | 2.0°C – 8.0°C | `QUARANTINED` | Carrier (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`) | **Scenario 3: Cold-Chain Excursion Quarantine.** Reefer compressor failure triggered +14.2°C telemetry reading. Smart contract autonomously transitioned status to `QUARANTINED`. QR scanner flags "DO NOT ADMINISTER". |
| `0x4444444444444444444444444444444444444444444444444444444444444444` | Vaxzevria ChAdOx1 (MITM Adversarial Lot) | 2.0°C – 8.0°C | `IN_TRANSIT` | Carrier (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`) | **Scenario 4: MITM Cryptographic Signature Tampering.** Telemetry payload bytes altered in flight. Solidity `ecrecover` detected signature mismatch (`INVALID_SIGNER`), reverted transaction, and logged security alert. |
| `0x5555555555555555555555555555555555555555555555555555555555555555` | Corbevax RBD Protein (Replay Attack Lot) | 2.0°C – 8.0°C | `IN_TRANSIT` | Carrier (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`) | **Scenario 5: Nonce Replay Attack Prevention.** Attacker captured valid historical telemetry packet and replayed it. EVM smart contract enforced `nonce > last_nonce`, rejecting transaction and triggering incident alert. |
| `0x6666666666666666666666666666666666666666666666666666666666666666` | ZyCoV-D DNA Plasmid (Delivered Clinical Lot) | 2.0°C – 8.0°C | `DELIVERED` | Hospital (`0x90F79bf6EB2c4f870365E785982E1f101E93b906`) | **Scenario 6: Complete 2-of-2 Custody Handover.** Completed transit from Hyderabad to Apollo Hospital Chennai. Custody dual sign-off confirmed on EVM with zero excursions. GxP compliance at 100%. |
| `0x7777777777777777777777777777777777777777777777777777777777777777` | Nuvaxovid NVX-CoV2373 (Spoiled Parent Lot) | 2.0°C – 8.0°C | `QUARANTINED` | Carrier (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`) | **Scenario 7: Autonomous Recovery Parent Lot.** Severely compromised by thermal breach (+16.8°C). Quarantined and linked to expedited replacement child lot `0x8888...`. |
| `0x8888888888888888888888888888888888888888888888888888888888888888` | Nuvaxovid NVX-CoV2373 (Expedited Child Lot) | 2.0°C – 8.0°C | `IN_TRANSIT` | Carrier (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`) | **Scenario 8: Autonomous Lineage Replacement Child.** Autonomously minted and dispatched to fulfill clinical destination of spoiled lot `0x7777...`. Cryptographic lineage verified on-chain. |

---

## 3. Persistent Security Incident & Alert Catalog

The seeder populates realistic security alerts in the `security_alerts` table, demonstrating automated threat intelligence:

| Alert ID | Associated Batch | Incident Type | Severity | Forensic Payload Summary |
|---|---|---|---|---|
| `SEC-ALT-001` | `0x4444...4444` | `MITM_SIGNATURE_TAMPER` | `CRITICAL` | Telemetry temperature byte tampered in flight from `0x01a4` (4.20°C) to `0x058c` (14.20°C). EIP-191 signature recovered signer `0x9812...` != authorized vehicle `0x3C44...`. EVM reverted with `INVALID_SIGNER`. |
| `SEC-ALT-002` | `0x5555...5555` | `REPLAY_ATTACK_DETECTED` | `HIGH` | Packet received with nonce `42` where contract high-water mark is `42`. Rejected by EVM rule `require(nonce > lastNonce)`. |
| `SEC-ALT-003` | `0x3333...3333` | `COLD_CHAIN_EXCURSION` | `CRITICAL` | Sensor reading logged +14.20°C exceeding maximum permitted ceiling of 8.00°C for 3 consecutive intervals. Smart contract transitioned lot to `QUARANTINED`. |
| `SEC-ALT-004` | `0x7777...7777` | `AUTONOMOUS_RECOVERY_TRIGGERED` | `MEDIUM` | Severe excursion logged. Automated recovery engine dispatched replacement batch `0x8888...` and executed `linkReplacementBatch()` on EVM. |

---

## 4. Corridor Route Coordinates & Waypoints (NH44 Corridor)

All telemetry points simulate a refrigerated pharmaceutical transport along the National Highway 44 (NH44) Dedicated Pharma Corridor:

| Waypoint # | Location Name | Latitude | Longitude | Typical Temperature |
|---|---|---|---|---|
| 1 | Hyderabad Genome Valley (Genesis Hub) | 17.5372° N | 78.5834° E | 4.10°C |
| 2 | Mahabubnagar Toll Checkpoint | 16.7488° N | 77.9866° E | 4.35°C |
| 3 | Kurnool Cold Storage Transit Node | 15.8281° N | 78.0373° E | 4.20°C |
| 4 | Anantapur Highway Waypoint | 14.6819° N | 77.6006° E | 4.45°C |
| 5 | Bangalore Distribution Hub | 12.9716° N | 77.5946° E | 4.15°C |
| 6 | Krishnagiri Logistics Node | 12.5186° N | 78.2137° E | 4.50°C |
| 7 | Vellore Cold Storage Relay | 12.9165° N | 79.1325° E | 4.30°C |
| 8 | Chennai Apollo Specialty Hospital (Destination) | 13.0827° N | 80.2707° E | 4.25°C |

---

## 5. Seed Execution & Reset Procedure

### 5.1 Executing the Demonstration Seeder
```bash
# Ensure local blockchain node (port 8546) and backend (port 8001) are active
python scripts/seed_demo_data.py
```
Expected output:
```
[INFO] Connected to Hardhat EVM at http://127.0.0.1:8546 (Chain ID: 31337)
[INFO] SupplyChainRegistry: 0x5FbDB2315678afecb367f032d93F642f64180aa3
[INFO] PharmaSupplyChain:   0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
[INFO] Seeding / Synchronizing 8 demonstration lots...
[SUCCESS] Seeded 8 demonstration lots, 40 telemetry points, 4 security alerts.
```

### 5.2 Safe Reset Without Data Corruption
To reset the demo dataset to a clean initial state without corrupting user data or unowned records:
```bash
# Safe reset target: only records marked with demo identifiers 0x1111... through 0x8888...
python scripts/seed_demo_data.py --reset-demo-only
```
If a full clean-slate database reset is required:
```bash
# 1. Back up existing database
cp data/infosecproj.db data/infosecproj.db.bak

# 2. Reset database schema
rm data/infosecproj.db
PYTHONPATH=backend python -c "from app.db.session import init_db; init_db()"

# 3. Re-seed demo dataset
python scripts/seed_demo_data.py
```
