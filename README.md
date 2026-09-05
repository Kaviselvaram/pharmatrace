# Blockchain-Based Supply Chain Simulation Framework
**Cryptographic Traceability & Self-Healing Cold-Chain Logistics using Virtualized Telemetry**  
*“Replacing institutional trust with algorithmic verification.”*

---

## 📌 Project Overview & Academic Metadata
- **Course**: Information Security (CBS3002) - Review 2
- **Slot**: L21 + L22
- **Authors**: Kaviselvaram (24BBS00072) & Aniesh S (24BBS00084)
- **Domain**: Pharmaceutical Cold-Chain Logistics (Vaccines, Biologics, Insulin)
- **Status**: Production-Grade Market-Facing Prototype Blueprint
- **Operating Cost**: **₹0.00 / $0.00** (100% Open Source & Zero-Cost Cloud Staging)

---

## 🚀 Key Innovations & Architectural Highlights
1. **Hardware-Free Telemetry Virtualization**:
   Replaces expensive physical IoT sensor hardware with a multi-threaded Python simulation engine modeling thermodynamic heat exchange ($\frac{dT}{dt} = -k(T - T_{\text{ambient}})$) and interstate GPS routes. Saves thousands in CapEx while maintaining mathematical and cryptographic parity with physical sensors.
2. **Edge Cryptographic Signing (ECDSA secp256k1 + Keccak-256)**:
   Every environmental reading (temperature, humidity, coordinates, timestamp, nonce) is cryptographically signed at the virtual edge node before transmission.
3. **Decentralized On-Chain Verification**:
   Solidity smart contracts on a local EVM ledger ingest telemetry, execute native `ecrecover` to authenticate the current custodian, and enforce strict cold-chain bounds ($2.0^\circ\text{C}$ to $8.0^\circ\text{C}$).
4. **Autonomous Self-Healing Logistics**:
   If a thermal breach or unauthorized modification is detected, the smart contract automatically sets batch status to `QUARANTINED` and triggers `SelfHealingController` to dispatch an expedited replacement lot.
5. **Interactive Chaos & Attack Studio**:
   Built-in security laboratory to demonstrate real-world attack vectors: Man-In-The-Middle (MITM) data falsification, refrigeration compressor failures, geofence departures, and cryptographic replay attacks.
6. **Consumer Trust & Regulatory Audit Portal**:
   Mobile-friendly QR verification view for patients and one-click FDA 21 CFR Part 11 compliance export for auditors.

---

## 📂 Master Documentation Repository Index

### 1. System Source of Truth
- **[PROJECT_SOURCE_OF_TRUTH.md](PROJECT_SOURCE_OF_TRUTH.md)**: Non-negotiable architectural constraints, stack specifications, and AI guardrails.

### 2. Product Architecture (`/docs/00-product/`)
- **[Product Overview](docs/00-product/product-overview.md)**: Problem domain, pharmaceutical stakes, and value proposition.
- **[Requirements Specification](docs/00-product/requirements.md)**: Detailed functional and non-functional requirements.
- **[Personas](docs/00-product/personas.md)**: QA Director, Fleet Operator, Chief Pharmacist, Auditor, Patient.
- **[User Journeys](docs/00-product/user-journeys.md)**: Sequence diagrams for Nominal Transit, Breach/Self-Healing, and MITM Attack.
- **[Scope (MoSCoW)](docs/00-product/scope-moscow.md)**: P0 (Must), P1 (Should), P2 (Could), and Won't Have boundaries.

### 3. Technical Architecture (`/docs/01-architecture/`)
- **[System Architecture](docs/01-architecture/system-architecture.md)**: 5-layer modular system architecture.
- **[Smart Contracts](docs/01-architecture/smart-contracts.md)**: Detailed Solidity contract interfaces, state machines, and events.
- **[Cryptography Specification](docs/01-architecture/cryptography-spec.md)**: ECDSA secp256k1, Keccak-256, packing, and nonces.
- **[Simulation Engine](docs/01-architecture/simulation-engine.md)**: Thermodynamic sensor formulas and GPS waypoints.
- **[STRIDE Threat Model](docs/01-architecture/threat-model-stride.md)**: Security matrix and CIA triad mapping.
- **[Database Architecture](docs/01-architecture/database-architecture.md)**: Hybrid on-chain commitments vs off-chain SQLite caching.
- **[AI Architecture](docs/01-architecture/ai-architecture.md)**: Scikit-learn predictive decay engine and Gemini Flash auditor.

### 4. UI/UX & Design System (`/docs/02-design/`)
- **[UX Strategy & Navigation](docs/02-design/ux-strategy.md)**: Information architecture and command center UX.
- **[Design System](docs/02-design/design-system.md)**: Obsidian Cyber-Clinical palette, tokens, and components.
- **[Motion System](docs/02-design/motion-system.md)**: Waveform shaders, pulse beacons, and accessibility.

### 5. API & Protocols (`/docs/03-api/`)
- **[API Architecture](docs/03-api/api-architecture.md)**: REST design principles and OpenAPI schemas.
- **[REST Endpoints](docs/03-api/rest-endpoints.md)**: Complete endpoint contract reference.
- **[WebSocket Protocol](docs/03-api/websocket-protocol.md)**: Event payloads and streaming frames.

### 6. Security, Testing & DevOps (`/docs/04-06/`)
- **[Security Architecture](docs/04-security/security-architecture.md)**: Key isolation, Slither static analysis.
- **[Audit Compliance](docs/04-security/audit-compliance.md)**: FDA 21 CFR Part 11 and CDSCO alignment.
- **[Testing Strategy](docs/05-testing/testing-strategy.md)**: Testing pyramid and automated coverage.
- **[Verification Scenarios](docs/05-testing/verification-scenarios.md)**: Step-by-step viva demonstration walkthrough.
- **[Deployment & DevOps](docs/06-infrastructure/deployment-devops.md)**: Docker Compose and free cloud tiers.
- **[Zero-Cost Strategy](docs/06-infrastructure/zero-cost-strategy.md)**: Complete ₹0 cost matrix.
- **[Observability](docs/06-infrastructure/observability.md)**: Structured JSON logs and EVM event subscriptions.
- **[Architectural Decisions (ADRs)](docs/07-adrs/)**: ADR-001 through ADR-006.

---

## 🏗️ Implementation Phase Roadmaps (`/phases/`)
Every implementation phase has an authoritative markdown specification ready for execution:

- **[P00: Project Intelligence & Setup](phases/P00-project-intelligence-and-setup.md)**
- **[P01: Smart Contracts & Local EVM Ledger](phases/P01-smart-contracts-and-evm.md)**
- **[P02: Cryptographic Signing & Simulation Engine](phases/P02-crypto-and-simulation-engine.md)**
- **[P03: FastAPI Backend & Web3.py Bridge](phases/P03-fastapi-backend-and-web3-bridge.md)**
- **[P04: Design System & UI Foundations](phases/P04-design-system-and-ui-foundations.md)**
- **[P05: Frontend Command Center & Live Map](phases/P05-frontend-command-center-and-map.md)**
- **[P06: Chaos Studio & Attack Simulator](phases/P06-chaos-studio-and-attack-simulator.md)**
- **[P07: Self-Healing & Autonomous Replenishment](phases/P07-self-healing-and-auto-replenishment.md)**
- **[P08: Public Consumer QR & Auditor Portal](phases/P08-public-qr-and-auditor-portal.md)**
- **[P09: AI Predictive Engine & Reporting](phases/P09-ai-predictive-engine-and-reporting.md)**
- **[P10: E2E Testing & Security Hardening](phases/P10-e2e-testing-and-security-hardening.md)**
- **[P11: Docker DevOps & Demo Runbook](phases/P11-docker-devops-and-demo-runbook.md)**

---

## ⚡ Quick Start (Local ₹0 Development)

### 1. Requirements
- Node.js 22+
- Python 3.13+
- Docker & Docker Compose (Optional for containerized run)

### 2. Launch Local EVM Blockchain
```bash
cd contracts
npm install
npx hardhat node
```

### 3. Deploy Smart Contracts
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Launch FastAPI Simulation Backend
```bash
cd ../backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 5. Launch React Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Visit the Command Center at **`http://localhost:5173`** and the Swagger API at **`http://localhost:8000/docs`**.
