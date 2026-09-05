# PROJECT SOURCE OF TRUTH: Blockchain-Based Supply Chain Simulation Framework
**Cryptographic Traceability, Algorithmic Verification & Autonomous Digital Recovery**  
*Authoritative Master Engineering Reference & Specification (Locked Post-Technical Audit)*

---

## 1. PROJECT IDENTITY & GOVERNANCE
- **Project Name**: Virtualized Blockchain Supply Chain Framework (Pharma Cold-Chain)
- **Academic Origin**: CBS3002 Information Security Review 2 (Kaviselvaram 24BBS00072 & Aniesh S 24BBS00084, Slot L21+L22)
- **Product Archetype**: Enterprise Pharmaceutical Cold-Chain Traceability, Attack Laboratory & Autonomous Replenishment SaaS Prototype.
- **Core Axiom**: *"Replacing institutional trust with algorithmic verification."*
- **Operational Cost**: **₹0.00 / $0.00** across entire development, execution, and local/cloud deployment lifecycle.
- **Current Status**: **AUDITED, CORRECTED & LOCKED FOR IMPLEMENTATION**.

---

## 2. STRICT CONSTRAINTS & FORBIDDEN ARCHITECTURAL DRIFT
All coding agents and contributors must strictly enforce these non-negotiable rules:

1. **CRYPTOGRAPHIC AUTHENTICITY (NO MOCKED CRYPTO)**:
   - Every telemetry packet MUST be signed with a real secp256k1 private key.
   - Hashes MUST use native `keccak256`.
   - On-chain verification MUST execute native EVM `ecrecover`. No mock signatures or fake booleans.
2. **DOCKER ENVIRONMENT ISOLATION (ZERO HOST/CONTAINER INTERFERENCE)**:
   - There is an active external project (`finops`) on this machine.
   - Compose project name MUST be `-p infosecproj`.
   - Never run global Docker commands (`docker system prune`, `docker volume prune`, `docker network prune`, `docker compose down` without project flag).
   - Dedicated Host Ports to prevent collision:
     - **Frontend**: Host `5174` (Container: `80` / `5173`)
     - **Backend API**: Host `8001` (Container: `8000`)
     - **Local EVM RPC**: Host `8546` (Container: `8545`)
     - **Database**: Local file SQLite (Zero port footprint), or Host `5434` for Postgres.
3. **HARDWARE-FREE VIRTUALIZATION**:
   - Zero dependency on physical microcontrollers (Raspberry Pi/Arduino).
   - Telemetry generated via deterministic Python physics simulation.
4. **HYBRID STORAGE & NO BLOCKCHAIN BLOAT**:
   - High-frequency time-series telemetry (sampled every 2–5s) is stored off-chain in SQLite.
   - ONLY batch genesis, multi-sig custody handovers, periodic state commitments, threshold violations, and quarantine transitions are committed on-chain.
5. **ZERO-COST & OFFLINE-FIRST**:
   - Zero mandatory paid APIs. Google Gemini LLM is strictly an optional enhancement with a 100% offline deterministic Jinja2 fallback.
6. **NO FAKE CLAIMS (TERMINOLOGY DISCIPLINE)**:
   - Smart contracts cannot physically repair a compressor. Use "Autonomous Digital Recovery & Orchestrated Replenishment", not "self-healing hardware".
   - Do not claim "FDA Approved"; use "Engineered to align with FDA 21 CFR Part 11 electronic records controls".

---

## 3. CANONICAL CRYPTOGRAPHIC SPECIFICATION

To ensure zero hash divergence between Python (`web3.py` / `eth_account`) and Solidity (`abi.encodePacked`), all telemetry packets follow this exact canonical binary layout:

### 3.1 Field Order & Types
1. `bytes32 batchId`: Unique 32-byte identifier of the pharmaceutical batch.
2. `int16 temperatureScaled`: Temperature in Celsius scaled by 100 (e.g., $4.25^\circ\text{C} = 425$; $-18.50^\circ\text{C} = -1850$).
3. `int32 latitudeScaled`: GPS Latitude scaled by $10^6$ (e.g., $12.971600 = 12971600$).
4. `int32 longitudeScaled`: GPS Longitude scaled by $10^6$ (e.g., $77.594600 = 77594600$).
5. `uint32 timestamp`: UNIX epoch timestamp in seconds.
6. `uint256 nonce`: Strictly monotonic integer nonce tracked per batch and custodian.

### 3.2 Canonical Hash Formula
$$\text{PayloadBytes} = \text{batchId} \mathbin{\Vert} \text{int16}(T) \mathbin{\Vert} \text{int32}(\text{lat}) \mathbin{\Vert} \text{int32}(\text{lon}) \mathbin{\Vert} \text{uint32}(t) \mathbin{\Vert} \text{uint256}(\text{nonce})$$
$$\text{MessageHash} = \text{keccak256}(\text{PayloadBytes})$$
$$\text{EthSignedMessageHash} = \text{keccak256}(\text{"\x19Ethereum Signed Message:\n32"} \mathbin{\Vert} \text{MessageHash})$$
$$\text{SignerAddress} = \text{ecrecover}(\text{EthSignedMessageHash}, v, r, s)$$

---

## 4. SMART CONTRACT ARCHITECTURE (CONSOLIDATED & HARDENED)

To eliminate cross-contract call complexity and gas waste, the on-chain architecture is streamlined into two core contracts:

1. **`SupplyChainRegistry.sol`**:
   - Role-Based Access Control (`MANUFACTURER`, `CARRIER`, `HOSPITAL`, `AUDITOR`).
   - Maps public Ethereum addresses to authorized corporate nodes.
2. **`PharmaSupplyChain.sol`**:
   - Consolidated state machine combining Batch Lifecycle, Multi-Sig Handover, Telemetry Verification, and Quarantine/Replenishment Triggers.
   - States: `CREATED (0)`, `IN_TRANSIT (1)`, `DELIVERED (2)`, `QUARANTINED (3)`, `REPLENISHED (4)`.
   - Modifiers: `onlyRole`, `onlyCustodian`, `validNonce`.

---

## 5. SIMULATION & CHAOS SPECIFICATION

### 5.1 Deterministic Simulation Profiles (`seed=42`)
- **Profile A (Nominal Transit)**: $T \in [3.8^\circ\text{C}, 5.2^\circ\text{C}]$, vehicle travels on Bangalore-Chennai corridor, handover confirmed.
- **Profile B (Compressor Excursion)**: Refrigeration failure at step 15, temperature climbs at $+0.4^\circ\text{C}/\text{s}$, reaches $8.1^\circ\text{C}$ at step 25 $\rightarrow$ Auto-Quarantine and Replenishment event emitted.
- **Profile C (MITM Data Tamper Attack)**: Attacker intercepts packet and edits temperature reading from $12.5^\circ\text{C}$ to $4.2^\circ\text{C}$. Recovered address $\ne$ Custodian address $\rightarrow$ Transaction reverts with `INVALID_SIGNATURE`.
- **Profile D (Replay Attack)**: Stale nonce resubmitted $\rightarrow$ Reverts with `REPLAY_ATTACK_DETECTED`.

---

## 6. FINAL MONOREPO DIRECTORY STRUCTURE

```text
Infosecproj/
├── .github/
│   └── workflows/
│       └── ci.yml
├── contracts/                        # Hardhat Solidity Suite
│   ├── contracts/
│   │   ├── SupplyChainRegistry.sol
│   │   └── PharmaSupplyChain.sol
│   ├── scripts/
│   │   ├── deploy.js
│   │   └── seed.js
│   ├── test/
│   │   ├── Registry.test.js
│   │   └── PharmaSupplyChain.test.js
│   ├── hardhat.config.js
│   └── package.json
├── backend/                          # FastAPI Modular Application
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py             # Isolated port configs & env vars
│   │   │   ├── security.py           # Canonical Keccak + secp256k1 utils
│   │   │   └── database.py           # SQLite connection pool
│   │   ├── domain/
│   │   │   ├── models.py             # SQLAlchemy models
│   │   │   └── schemas.py            # Pydantic v2 schemas
│   │   ├── engine/
│   │   │   ├── simulator.py          # Deterministic physics engine
│   │   │   ├── telemetry_node.py     # Virtual node signer
│   │   │   ├── attack_injector.py    # Chaos attack triggers
│   │   │   └── predictor.py          # Thermal decay math & anomaly detector
│   │   ├── services/
│   │   │   ├── web3_service.py       # Web3.py RPC client
│   │   │   ├── supply_chain_service.py
│   │   │   └── audit_reporter.py     # Offline markdown + optional Gemini
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── batches.py
│   │   │   │   ├── telemetry.py
│   │   │   │   ├── simulation.py
│   │   │   │   └── blockchain.py
│   │   │   └── websocket.py          # Telemetry broadcaster
│   │   └── main.py                   # FastAPI app entrypoint
│   ├── requirements.txt
│   └── tests/
├── frontend/                         # React 19 + Vite (Cyber-Clinical)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/               # Header, Sidebar, AlertTicker
│   │   │   ├── dashboard/            # Waveform, LeafletMap, BatchList
│   │   │   ├── chaos/                # Attack panel & tamper diff viewer
│   │   │   ├── explorer/             # Block feed & signature dissector
│   │   │   └── portal/               # Consumer QR scanner & certificate
│   │   ├── styles/
│   │   │   ├── tokens.css            # Custom CSS properties
│   │   │   └── main.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docs/                             # Authoritative Documentation
├── phases/                           # Executable Phase MDs
├── docker-compose.yml                # Isolated Compose (-p infosecproj)
├── PROJECT_SOURCE_OF_TRUTH.md        # Locked Source of Truth
└── README.md                         # Master Presentation Guide
```

---

## 7. DEFINITION OF DONE FOR GOLDEN PATH ACCEPTANCE
The project is complete when an automated script runs the entire golden path end-to-end:
1. `Manufacturer` mints lot `LOT-VAX-01` ($2.0^\circ\text{C}$ to $8.0^\circ\text{C}$).
2. `Carrier` receives custody via dual multi-sig handover.
3. Telemetry streams with valid ECDSA signatures; verified on-chain.
4. Excursion injected $\rightarrow$ EVM quarantines lot $\rightarrow$ auto-replenishment dispatched.
5. Tampered packet injected $\rightarrow$ EVM reverts with `INVALID_SIGNATURE`.
6. Consumer scans QR code $\rightarrow$ view verified cryptographic audit log.
