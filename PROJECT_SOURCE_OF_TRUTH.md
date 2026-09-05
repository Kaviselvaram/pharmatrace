# PROJECT SOURCE OF TRUTH: Blockchain-Based Supply Chain Simulation Framework
**Cryptographic Traceability & Self-Healing Cold-Chain Logistics via Virtualized Telemetry**  
*Authoritative Master Reference for Engineering Teams and AI Coding Agents*

---

## 1. PROJECT METADATA & VISION
- **Project Name**: Virtualized Blockchain Supply Chain Simulation Framework (Pharma Cold-Chain)
- **Academic Context**: Information Security (CBS3002) - Review 2 (Kaviselvaram 24BBS00072 & Aniesh S 24BBS00084, Slot L21+L22)
- **Product Archetype**: Enterprise Pharma Cold-Chain Traceability, Chaos Attack Simulator, and Autonomous Self-Healing SaaS Prototype.
- **Core Philosophy**: *"Replacing institutional trust with algorithmic verification."*
- **Target Cost**: **₹0.00 / $0.00** across entire development, execution, and local/cloud deployment lifecycle.

---

## 2. STRICT CONSTRAINTS & FORBIDDEN ARCHITECTURAL DRIFT (AI GUARDRAILS)
Any coding agent or contributor working on this repository **MUST NOT** violate these non-negotiable rules:

1. **NO FAKE OR MOCKED CRYPTOGRAPHY**:
   - Every telemetry packet MUST be signed using real ECDSA secp256k1 keys.
   - Hashes MUST use native `keccak256` (or SHA-256 where specified).
   - Smart contracts MUST execute native EVM `ecrecover` to extract signer addresses. Mocked booleans (e.g. `return true;`) are strictly forbidden.
2. **NO PHYSICAL IOT HARDWARE DEPENDENCY**:
   - Sensor data is generated via software virtualization in the Python simulation engine (`backend/app/engine/`).
   - Do NOT introduce dependencies on physical serial ports, Arduinos, or physical hardware dongles.
3. **NO MANDATORY PAID SAAS / APIS**:
   - Zero hard dependencies on paid cloud services (No paid Infura, Alchemy, Datadog, AWS IoT, or OpenAI paid tiers).
   - The local EVM ledger runs via Hardhat / Anvil at `http://127.0.0.1:8545`.
   - AI features use local Scikit-Learn physics regression and free Google Gemini Flash API tiers with deterministic offline fallbacks.
4. **NO UNCONTROLLED DATABASE BLOAT ON-CHAIN**:
   - High-frequency continuous telemetry streams (e.g. every 2 seconds) MUST be cached off-chain in SQLite/PostgreSQL.
   - ONLY batch creations, custody handover multi-sigs, periodic state checkpoints, threshold breach events, and quarantine transitions are committed on-chain.
5. **NO GENERIC BOOTSTRAP / LOW-EFFORT UI**:
   - The frontend MUST maintain the bespoke **Obsidian Cyber-Clinical** dark design system with custom CSS tokens, glassmorphism, animated waveforms, real-time Leaflet maps, and interactive block inspectors.

---

## 3. MASTER TECHNOLOGY STACK

| Component | Selected Technology | Version / Standard | Classification | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Smart Contracts** | Solidity | `^0.8.28` | `OPEN SOURCE` | ₹0 |
| **EVM Development Suite** | Hardhat / Hardhat Network | `^2.22.x` | `OPEN SOURCE` | ₹0 |
| **Contract Verification** | OpenZeppelin Contracts | `^5.x` | `OPEN SOURCE` | ₹0 |
| **Backend & API** | FastAPI (Python) | `3.13.x` / `0.115+` | `OPEN SOURCE` | ₹0 |
| **Blockchain Bridge** | Web3.py + eth-account | `^7.x` | `OPEN SOURCE` | ₹0 |
| **Simulation Engine** | Python `asyncio` & `threading` | Native Python 3.13 | `OPEN SOURCE` | ₹0 |
| **Off-Chain Database** | SQLite (Dev/Local) / PostgreSQL | Standard SQL | `OPEN SOURCE` | ₹0 |
| **Frontend Framework** | React 19 + Vite | `^19.x` / `^6.x` | `OPEN SOURCE` | ₹0 |
| **Styling & Design System** | Vanilla CSS Custom Tokens | CSS3 / Glassmorphism | `OPEN SOURCE` | ₹0 |
| **Geospatial Map** | Leaflet.js + OpenStreetMap | `^1.9.x` | `OPEN SOURCE` | ₹0 |
| **Local AI Engine** | Scikit-Learn | `^1.6.x` | `OPEN SOURCE` | ₹0 |
| **Auditor AI Assistant** | Google Gemini 1.5 Flash (Free Tier) | Gemini Free API | `FREE TIER` | ₹0 |
| **Orchestration** | Docker & Docker Compose | Compose v2 | `OPEN SOURCE` | ₹0 |

---

## 4. FIVE-LAYER ARCHITECTURAL BLUEPRINT

```text
[Layer 1: Virtualized Telemetry] ──> Emulated Manufacturer, Carrier, Hospital nodes generating physics-based temp/GPS/humidity
               │
[Layer 2: Cryptographic Security] ──> Keccak-256 payload hashing + secp256k1 ECDSA digital signature + nonces
               │
[Layer 3: Core App & Services]   ──> FastAPI REST & WebSocket server, Chaos Attack Injector, Scikit-learn Anomaly Predictor
               │
[Layer 4: Decentralized Ledger]  ──> Local EVM node running Registry, BatchManager, TelemetryVerifier, Custody, SelfHealing
               │
[Layer 5: Presentation & UX]     ──> React Cyber-Clinical Dashboard, Live Transit Map, Chaos Studio, Public QR Scanner
```

---

## 5. SMART CONTRACT SPECIFICATION & ON-CHAIN STATE

1. **`SupplyChainRegistry.sol`**:
   - Manages role authorization (`MANUFACTURER`, `DISTRIBUTOR`, `CARRIER`, `HOSPITAL`, `AUDITOR`).
   - Maps Ethereum public addresses to corporate identities and verification public keys.
2. **`BatchManager.sol`**:
   - Digital twin of pharmaceutical lots (`batchId`, `productName`, `minTemp`, `maxTemp`, `currentCustodian`, `status`).
   - Status Enum: `CREATED (0)`, `IN_TRANSIT (1)`, `DELIVERED (2)`, `QUARANTINED (3)`, `REPLENISHED (4)`.
3. **`TelemetryVerifier.sol`**:
   - Performs `ecrecover(keccak256(data), v, r, s)`.
   - Validates that signer matches `currentCustodian`.
   - Checks compliance: `minTemp <= temp <= maxTemp`. If violated, emits `ColdChainBreach` and triggers `SelfHealingController`.
4. **`CustodyHandover.sol`**:
   - Executes atomic $2\text{-of-}2$ multi-signature transfers between relinquishing custodian and receiving custodian.
5. **`SelfHealingController.sol`**:
   - On breach event, immediately sets batch status to `QUARANTINED`.
   - Emits `ReplenishmentDispatched` event, creating an expedited digital twin replacement batch linked to the original failed lot.

---

## 6. OFF-CHAIN TIME-SERIES & TELEMETRY CONTRACTS

### 6.1 Telemetry Payload Schema (JSON-LD Compliant)
```json
{
  "batchId": "0x7b61...c9",
  "temperature": 4.25,
  "humidity": 48.2,
  "latitude": 12.9716,
  "longitude": 77.5946,
  "timestamp": 1772798400,
  "nonce": 1042,
  "custodianAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "signature": {
    "v": 27,
    "r": "0x8f2d...3a",
    "s": "0x1c4b...9e"
  }
}
```

---

## 7. EXECUTION ROADMAP & PHASE SEQUENCING

| Phase Code | Phase Name | Status |
| :--- | :--- | :--- |
| **P00** | Project Intelligence, Environment & Foundation | **COMPLETED / IN PROGRESS** |
| **P01** | Smart Contract Suite & Local EVM Ledger | PENDING |
| **P02** | Cryptographic Signing & Simulation Engine | PENDING |
| **P03** | FastAPI Backend Gateway & Web3.py Bridge | PENDING |
| **P04** | Design System, UI Tokens & Atomic Components | PENDING |
| **P05** | Real-Time Command Center & Live Transit Map | PENDING |
| **P06** | Interactive Chaos Studio & Attack Simulator | PENDING |
| **P07** | Self-Healing Pipeline & Autonomous Replenishment | PENDING |
| **P08** | Public Consumer QR Portal & Regulatory Inspector | PENDING |
| **P09** | AI Anomaly Predictor & Narrative Audit Generator | PENDING |
| **P10** | End-to-End Testing & Security Static Analysis | PENDING |
| **P11** | Docker Compose Orchestration & Demo Runbook | PENDING |

---

## 8. DEFINITION OF PROJECT SUCCESS
The project will be validated against three critical scenarios during viva and market review:
1. **Scenario 1 (Nominal Transit)**: A batch travels across 3 nodes with temperatures between 2°C–8°C. Custody is transferred cleanly via multi-sig. Patient scans QR code $\rightarrow$ "VERIFIED AUTHENTIC & UNBROKEN COLD CHAIN".
2. **Scenario 2 (Compressor Failure & Self-Healing)**: Chaos studio spikes temperature to 11.8°C. The smart contract rejects the reading, automatically transitions state to `QUARANTINED`, emits a replenishment event, and dispatches a backup batch without human downtime.
3. **Scenario 3 (Insider Tamper Attack)**: An insider modifies a 12°C reading to 4°C in transit without the private key. EVM `ecrecover` detects signature mismatch, rejects transaction, logs cryptographic tamper evidence, and flags the compromised carrier.
