# PharmaTrace — Demonstration Remaining Gaps & Hardening Roadmap

**Project:** PharmaTrace — Blockchain-Secured Cold-Chain Cryptographic Traceability  
**Evaluation Date:** 2026-10-22  
**Scope:** Transparent disclosure of operational limits, demonstration boundaries, and production hardening requirements.

---

## 1. Demonstration vs. Production Architecture Boundaries

The application is **100% demonstration-ready and functionally complete** for local, testnet, and architectural evaluation. The following architectural boundaries intentionally differentiate this local demonstration environment from a commercial multi-region pharmaceutical deployment:

| Boundary / Domain | Demonstration Implementation | Commercial Production Requirement | Rationale / Mitigation |
|---|---|---|---|
| **Cryptographic Edge Node** | Virtualized Telematics Node (`telemetry_node.py`) using Secp256k1 key in `.env` | Physical ATECC608B or TPM 2.0 Secure Element onboard reefer vehicle | Virtualized node implements identical 78-byte EIP-191 packed bytes and ECDSA signatures. Demonstrates identical cryptographic verification without requiring physical hardware. |
| **Blockchain Network** | Local Hardhat EVM Node (Chain ID 31337) on port 8546 | Ethereum L2 Rollup (Arbitrum One, Optimism, or Polygon PoS) | Hardhat provides zero-cost, instantaneous sub-second block finality ideal for repeatable demonstration. Contract code is 100% EVM-compatible and ready for testnet deployment without modification. |
| **Relational Database** | SQLite with Write-Ahead Logging (WAL) (`data/infosecproj.db`) | Managed PostgreSQL with Multi-Region High Availability (RDS / Aurora) | SQLite requires zero operational overhead, enables deterministic demonstration seeding, and supports clean atomic backups via file copy. |
| **Transit Corridor Maps** | Canvas / SVG Vector Corridor with GPS waypoints along NH44 | Live Mapbox / Google Maps satellite vector tiles with API key | Prevents demonstration breakage due to expired third-party API quotas or network air-gaps while accurately rendering genuine highway waypoints. |
| **Identity & Authentication** | Mock Persona Dropdown (Manufacturer, Carrier, Hospital, Auditor) | OIDC / SAML Enterprise SSO with Hardware WebAuthn 2FA | Allows instant role switching in a live presentation without requiring multi-party credential management. |

---

## 2. Inventory of Known Minor Limitations

The following items are documented as non-blocking minor observations:

### GAP-01: Ephemeral Block Numbers on Chain Node Termination
- **Severity:** Low (Operational)
- **Description:** If the Hardhat background daemon (`npx hardhat node`) is killed and restarted, the block number resets to `#0`.
- **Mitigation:** Run `python scripts/seed_demo_data.py` immediately after restarting Hardhat to re-deploy contracts and re-seed the 8 demonstration lots. Documented in `docs/demo_runbook.md`.

### GAP-02: Map Route Static Waypoints vs. Real-Time Physical Traffic
- **Severity:** Low (Presentation)
- **Description:** The vehicle waypoint simulation follows deterministic speed and coordinates along the NH44 Hyderabad-Chennai corridor rather than querying real-time commercial traffic telemetry.
- **Mitigation:** Sufficient for GxP cold-chain audit demonstration, as thermal compliance and cryptographic provenance are the core evaluation targets.

---

## 3. Production Hardening Checklist (Pre-Mainnet)

Prior to enterprise clinical deployment, the following standard life-sciences verification milestones are recommended:

- [ ] **Physical Hardware Qualification (IQ/OQ/PQ):** Install cryptographic hardware secure elements (e.g., ATECC608A) onto reefer telematics units.
- [ ] **External Smart Contract Security Audit:** Engage a third-party security firm (e.g., OpenZeppelin, Trail of Bits) to conduct formal verification of `PharmaSupplyChain.sol`.
- [ ] **21 CFR Part 11 Electronic Records Certification:** Execute formal validation protocols (IQ, OQ, PQ) with digital signature manifestation auditing.
- [ ] **L2 Rollup Testnet Deployment:** Deploy contracts to Sepolia or Arbitrum Sepolia testnet with chain link keepers for automated monitoring.
