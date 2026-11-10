# PharmaTrace — Final Demonstration Data Catalog

**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Framework  
**Course / Context:** CBS3002 Information Security Project  
**Authors:** Kaviselvaram Kathirvel & Aniesh S  
**Date:** October 2026 | Verified Execution Baseline  
**Seeder Implementation:** `scripts/seed_demo_data.py`  
**Database:** `data/infosecproj.db` (SQLite WAL)  
**Smart Contracts:** `PharmaSupplyChain` (`0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`), `SupplyChainRegistry` (`0x5FbDB2315678afecb367f032d93F642f64180aa3`)  
**Chain ID:** 31337 (Local Hardhat Node on port 8546)

---

## 1. Catalog Architecture & Data Integrity Guarantees

The demonstration dataset establishes 8 distinct, deterministic, and verifiable pharmaceutical supply chain lots matching Phase 5 requirements (Demo A through Demo H):

1. **Deterministic Stable Identifiers:** All demonstration lots use fixed 32-byte hex identifiers (`0x1111...` through `0x8888...`) for reproducible testing, automated grading, and bookmarked URL verification.
2. **Real On-Chain Transactions:** Batches are genuinely minted on the local EVM smart contract (`PharmaSupplyChain.sol`). Custody handovers and replenishment links are genuine contract function calls producing verifiable transaction receipts and blocks.
3. **100% Idempotent Re-Seeding:** Re-running `python scripts/seed_demo_data.py` safely inspects on-chain and database state, updates existing records without creating duplicates, breaks no foreign keys, and exits cleanly.
4. **Explicit Synthetic Markers:** All records carry explicit demonstration metadata and known test keys, ensuring zero confusion with real-world physical supply chains.
5. **Referential & Cryptographic Integrity:** Telemetry packets, route coordinates along the NH44 pharma corridor, security alerts, and lineage linkages maintain 100% relational integrity.

---

## 2. The 8 Demonstration Batches (Demo A through Demo H)

| Scenario ID | Lot Identifier (bytes32) | Product Name | Temp Range | Lifecycle State | Custodian & Role | Real On-Chain Evidence & Verification Target |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Demo A** (Normal Shipment) | `0x1111111111111111111111111111111111111111111111111111111111111111` | Comirnaty BNT162b2 | 2.0°C – 8.0°C | `IN_TRANSIT` | Carrier (`0x3C44...`) | Mined genesis tx. Continuous in-range telemetry (4.20°C, NH44 corridor). QR verification resolves authentic lot. |
| **Demo B** (Created Pre-Transit) | `0x2222222222222222222222222222222222222222222222222222222222222222` | Covaxin BBV152 | 2.0°C – 8.0°C | `CREATED` | Manufacturer (`0x7099...`) | Freshly minted on EVM. Zero fabricated transit telemetry. Ready for initial carrier custody handover. |
| **Demo C** (Thermal Excursion) | `0x3333333333333333333333333333333333333333333333333333333333333333` | Spikevax mRNA-1273 | 2.0°C – 8.0°C | `QUARANTINED` | Carrier (`0x3C44...`) | Sensor logged +14.20°C excursion (> 8.00°C ceiling). Smart contract autonomously transitioned state to `QUARANTINED`. |
| **Demo D** (Tampered Telemetry) | `0x4444444444444444444444444444444444444444444444444444444444444444` | Vaxzevria ChAdOx1 | 2.0°C – 8.0°C | `IN_TRANSIT` | Carrier (`0x3C44...`) | Payload mutated in transit. Solidity `ecrecover` detected signature mismatch (`INVALID_SIGNER`), reverted tx, logged `SEC-ALT-001`. |
| **Demo E** (Replay Attack) | `0x5555555555555555555555555555555555555555555555555555555555555555` | Corbevax RBD Protein | 2.0°C – 8.0°C | `IN_TRANSIT` | Carrier (`0x3C44...`) | Stale packet replayed. EVM enforced `nonce > last_nonce`, reverted with `REPLAY_ATTACK_DETECTED`, logged `SEC-ALT-002`. |
| **Demo F** (Custody Transfer) | `0x6666666666666666666666666666666666666666666666666666666666666666` | ZyCoV-D DNA Plasmid | 2.0°C – 8.0°C | `DELIVERED` | Hospital (`0x90F7...`) | Full 2-of-2 multisignature handover verified on EVM. Handover transactions mined; GxP compliance 100%. |
| **Demo G** (Quarantined Parent) | `0x7777777777777777777777777777777777777777777777777777777777777777` | Nuvaxovid NVX-CoV2373 | 2.0°C – 8.0°C | `QUARANTINED` | Carrier (`0x3C44...`) | Severe excursion breach (+16.8°C). Quarantined on-chain and linked via `linkReplacementBatch` to child lot `0x8888...`. |
| **Demo H** (Delivered Replacement) | `0x8888888888888888888888888888888888888888888888888888888888888888` | Nuvaxovid NVX-CoV2373 | 2.0°C – 8.0°C | `IN_TRANSIT` | Carrier (`0x3C44...`) | Autonomously minted replacement batch. Holds valid on-chain parent pointer to `0x7777...`. Full lineage verified in QR portal. |

---

## 3. Persistent Forensic Security Alerts

| Alert ID | Target Lot ID | Incident Type | Severity | On-Chain & Forensic Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `SEC-ALT-001` | `0x4444...4444` | `MITM_SIGNATURE_TAMPER` | `CRITICAL` | Telemetry temperature byte tampered in flight from 4.20°C to 14.20°C. EIP-191 signature recovered signer != authorized vehicle. EVM reverted with `INVALID_SIGNER`. |
| `SEC-ALT-002` | `0x5555...5555` | `REPLAY_ATTACK_DETECTED` | `HIGH` | Packet received with consumed nonce. Contract rejected submission via `require(nonce > lastNonce)`. |
| `SEC-ALT-003` | `0x3333...3333` | `COLD_CHAIN_EXCURSION` | `CRITICAL` | Telemetry logged +14.20°C exceeding maximum ceiling (8.00°C). Smart contract autonomously transitioned lot to `QUARANTINED`. |
| `SEC-ALT-004` | `0x7777...7777` | `AUTONOMOUS_RECOVERY_TRIGGERED` | `MEDIUM` | Severe excursion logged. Recovery workflow minted replacement batch `0x8888...` and executed `linkReplacementBatch()` on EVM. |

---

## 4. Corridor Route Coordinates & Waypoints (NH44 Corridor)

All telemetry points simulate refrigerated pharmaceutical transport along the National Highway 44 (NH44) Dedicated Pharma Corridor:

| Waypoint # | Waypoint Name | Latitude | Longitude | Nominal Temp |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Hyderabad Genome Valley (Genesis Hub) | 17.5372° N | 78.5834° E | 4.10°C |
| 2 | Mahabubnagar Toll Checkpoint | 16.7488° N | 77.9866° E | 4.35°C |
| 3 | Kurnool Cold Storage Transit Node | 15.8281° N | 78.0373° E | 4.20°C |
| 4 | Anantapur Highway Waypoint | 14.6819° N | 77.6006° E | 4.45°C |
| 5 | Bangalore Distribution Hub | 12.9716° N | 77.5946° E | 4.15°C |
| 6 | Krishnagiri Logistics Node | 12.5186° N | 78.2137° E | 4.50°C |
| 7 | Vellore Cold Storage Relay | 12.9165° N | 79.1325° E | 4.30°C |
| 8 | Chennai Apollo Specialty Hospital (Destination) | 13.0827° N | 80.2707° E | 4.25°C |

---

## 5. Seeding Execution & Verification Output

The seeder can be run using npm or directly with Python:

```bash
npm run demo:seed
# or
python3 scripts/seed_demo_data.py
```

### Verification Results:
- Total batches checked: 8
- Batches on-chain verified: 8 / 8
- Batches SQLite verified: 8 / 8
- Telemetry records verified: 40
- Security alerts verified: 4
- Replacement lineage verified: `0x7777...` -> `0x8888...`
- Idempotency test: 100% safe to re-run (0 duplicate entries created).
