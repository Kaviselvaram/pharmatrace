# Product Scope & MoSCoW Prioritization

---

## 1. MUST HAVE (P0 - MANDATORY FOR MVP & EVALUATION)
- [x] **Solidity Smart Contracts on Local EVM**:
  - `SupplyChainRegistry.sol`: Actor identity and RBAC.
  - `BatchManager.sol`: Batch creation, threshold limits, status machine.
  - `TelemetryVerifier.sol`: Native ECDSA `ecrecover` verification, threshold enforcement.
  - `CustodyHandover.sol`: 2-of-2 multi-signature custody transfer.
  - `SelfHealingController.sol`: Autonomous quarantine and automated replenishment order.
- [x] **Multi-threaded Python Simulation Engine**:
  - Realistic thermodynamic decay model: $\frac{dT}{dt} = -k(T - T_{\text{amb}})$.
  - Multi-tier transit route simulation (Manufacturer $\rightarrow$ Carrier $\rightarrow$ Hospital).
  - Native ECDSA secp256k1 signing using `eth-account`.
- [x] **FastAPI Backend Gateway & Web3 Bridge**:
  - REST endpoints for batch lifecycle and simulation control.
  - WebSockets for live telemetry and on-chain event streaming.
  - Off-chain SQLite database caching high-frequency telemetry.
- [x] **Modern Cyber-Clinical Web Frontend**:
  - Real-time command dashboard with metrics and status badges.
  - Live animated telemetry waveform graph.
  - Interactive Leaflet map displaying real-time vehicle route and safety breadcrumbs.
  - On-chain block ledger inspector.
  - Chaos Attack Panel (MITM, compressor failure, geofence exit).
  - Public mobile-responsive QR verification portal.

---

## 2. SHOULD HAVE (P1 - PROTOCOL & MARKET ENHANCEMENTS)
- [x] **Predictive Thermal Decay Engine**:
  - Lightweight Scikit-learn model forecasting breach before it occurs.
  - Proactive early warning alert in UI.
- [x] **Automated Regulatory Compliance Auditor**:
  - Markdown / PDF audit trail generator for FDA 21 CFR Part 11 compliance.
  - Free Google Gemini 1.5 Flash natural language audit report generator with deterministic offline fallback.
- [x] **Cryptographic Replay Attack Prevention**:
  - Monotonic nonces and timestamp drift verification in smart contracts.

---

## 3. COULD HAVE (P2 - FUTURE ENHANCEMENTS)
- [ ] Multi-chain deployment to Ethereum Sepolia or Arbitrum testnets.
- [ ] Zero-knowledge proof (zk-SNARK) privacy layer for concealing commercial pricing and proprietary routes while verifying temperature compliance.
- [ ] Multi-sensor fusion (tri-axial shock g-force + ambient humidity).

---

## 4. WON'T HAVE (EXPLICIT OUT-OF-SCOPE BOUNDARIES)
- ❌ **Physical Hardware Dongles / Raspberry Pis**: All telemetry is virtualized in software to eliminate CapEx and ensure 100% reproducibility.
- ❌ **Paid Third-Party SaaS**: No paid Infura, Alchemy, Datadog, AWS, or OpenAI subscriptions. Everything runs on open-source tools and free tiers.
- ❌ **Real Cryptocurrency Payments**: All gas and transactions use local test ETH without economic cost.
