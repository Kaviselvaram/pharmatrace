# FINAL ADVERSARIAL AUDIT & SECURITY HARDENING REPORT

**Project**: Blockchain-Based Pharmaceutical Supply Chain Simulation Framework  
**Date**: September 6, 2026  
**Auditors**: Antigravity Principal Architecture & Security Audit Team  
**Scope**: Smart Contracts, Python Physics & Cryptography, FastAPI Web3 Gateway, React 19 Frontend, Docker Infrastructure  
**Verification Baseline**: CBS3002 Information Security Project Review 2 Presentation (`InfoSec_Blockchain_Supply_Chain_Kavi_Aniesh.pptx`)

---

# Executive Summary

This report documents an evidence-based, hostile security and consistency audit of the `Infosecproj` repository. Every claim from previous development phases was audited directly against executable source code, test execution, mathematical proofs, and static analysis.

### Summary of Audit Results
- **Solidity Smart Contracts**: **39/39 passing** (expanded from 19 to 39 tests covering full adversarial matrix).
- **Python Cryptographic Engine & REST APIs**: **14/14 passing** (expanded from 11 to 14 tests including bounds validation and round-half-up).
- **Static Security Analysis**: Executed Slither on Cancun EVM; 0 high severity, 0 medium severity vulnerabilities.
- **Frontend Production Bundle**: Built with zero compilation errors via Vite.
- **Docker Isolation**: Verified safe with zero conflict against host processes (host ports: 5174, 8001, 8546; preserved `finops` on ports 5433, 9000, 9001).

---

# Source-of-Truth Findings

To prevent specification drift, all capabilities were evaluated against the foundational project presentation (`InfoSec_Blockchain_Supply_Chain_Kavi_Aniesh.pptx`):

| Capability | Source Classification | Notes & Defensible Alignment |
| :--- | :--- | :--- |
| **ECDSA secp256k1 Signing at Edge** | **A (Explicitly in PPT)** | Implemented via `VirtualizedNode` generating genuine `(v, r, s)` signatures. |
| **On-Chain EVM `ecrecover` Validation** | **A (Explicitly in PPT)** | Implemented in `PharmaSupplyChain.sol` using OpenZeppelin `ECDSA.recover`. |
| **78-Byte Canonical Binary Payload** | **B (Engineering Interpretation)** | Mathematical derivation of packed types matching PPT telemetry parameters. |
| **Monotonic Nonce Anti-Replay** | **B (Engineering Interpretation)** | `lastNonce[batchId][nodeAddress]` prevents packet re-injection. |
| **Strict 2°C–8°C Thermal Policy** | **A (Explicitly in PPT)** | Evaluated on-chain with integer-scaled boundary tests ($199, 200, 800, 801$). |
| **2-of-2 Multi-Sig Custody Handover** | **A (Explicitly in PPT)** | Two-step atomic state transition requiring dual cryptographic approval. |
| **Autonomous Digital Recovery** | **B (Engineering Interpretation)** | On-chain quarantine + backend replenishment order (not physical self-healing). |
| **Consumer QR Code Verification** | **A (Explicitly in PPT)** | Web portal validating provenance and unbroken temperature integrity. |
| **FDA 21 CFR Part 11 Alignment** | **B (Engineering Interpretation)** | Technical controls inspired by electronic record regulations; not certified software. |

---

# Cryptography Audit

### Findings:
1. **No Mock Cryptography**: No stubbed hashes, mock signatures, or hardcoded booleans exist. Python uses `eth_account` and `eth_utils.keccak`; Solidity uses OpenZeppelin `ECDSA.sol` and EVM `ecrecover`.
2. **Deterministic Rounding**: Standard Python `round()` uses banker's rounding (round-half-to-even). To ensure deterministic scaling across off-chain environments, `backend/app/core/security.py` now enforces `round_half_up()` using `decimal.Decimal` with `ROUND_HALF_UP`.
3. **Integer Bounds Protection**: Added strict input validation preventing `int16`, `int32`, `uint32`, and `uint256` overflows.

---

# Canonical Payload Specification

The canonical telemetry payload is tightly packed without 32-byte word padding:

```text
Byte Range    Field Name           Solidity Type    Scale Factor        Notes
-------------------------------------------------------------------------------------------------
00 - 31       batchId              bytes32          None                Unique lot hash
32 - 33       temperatureScaled    int16            x100                Range: -327.68°C to +327.67°C
34 - 37       latitudeScaled       int32            x1,000,000          WGS-84 microdegrees [-90°, +90°]
38 - 41       longitudeScaled      int32            x1,000,000          WGS-84 microdegrees [-180°, +180°]
42 - 45       timestamp            uint32           1 (epoch seconds)   Unix epoch seconds
46 - 77       nonce                uint256          1 (integer)         Monotonic counter >= 1
-------------------------------------------------------------------------------------------------
TOTAL: 78 BYTES (Verified in Python and Solidity)
```

---

# EIP-191 Verification

Both Python and Solidity strictly conform to the EIP-191 standard for 32-byte message hashing:
1. `rawPayloadHash = keccak256(canonicalPayload)` (32 bytes)
2. `eip191Digest = keccak256("\x19Ethereum Signed Message:\n32" || rawPayloadHash)`
3. Python generates `(v, r, s)` using `Account.sign_message(encode_defunct(rawPayloadHash), private_key)`.
4. Solidity verifies using `rawPayloadHash.toEthSignedMessageHash()` and `ECDSA.recover()`.

---

# Cryptographic Test Vector

The permanent deterministic test vector is defined and verified in automated suites:

- **Batch ID**: `0x4a9b6c8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b`
- **Temperature**: `4.25°C` ($\rightarrow 425$)
- **Latitude**: `12.9716°N` ($\rightarrow 12971600$)
- **Longitude**: `77.5946°E` ($\rightarrow 77594600$)
- **Timestamp**: `1772798400`
- **Nonce**: `1042`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Expected Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Canonical Payload Hex (78 bytes)**:  
  `0x4a9b6c8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b01a900c5ee50049fffe869aac1c00000000000000000000000000000000000000000000000000000000000000412`
- **Raw Keccak-256 Digest**:  
  `0xf1ab697f1f9b154772c485059ab5e2ea802460192a1f6489703029d714c09dca`
- **EIP-191 Signing Digest**:  
  `0xc9c705c42dffe727421ebddbd53e4e1ec3dacf06a7c7e60ccd827e8c0e4a5382`
- **Signature Tuple**:
  - `v`: `28`
  - `r`: `0x92c2a3931a6e790488e69f50925902c639ed2c857457bf64a57ae707f4564113`
  - `s`: `0x2c0d325a3bea82ea76521681e983379434b321f7600f5dd51348b35dfeb7c828`
- **Recovered Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` $\equiv$ Expected Address.

---

# Replay Protection

The smart contract enforces strictly monotonic nonces per `(batchId, nodeAddress)`:
- `nonce == lastNonce` $\rightarrow$ Reverts with `REPLAY_ATTACK_DETECTED`.
- `nonce < lastNonce` $\rightarrow$ Reverts with `REPLAY_ATTACK_DETECTED`.
- `nonce == 0` $\rightarrow$ Reverts with `nonce must be strictly positive`.
- `nonce > lastNonce` $\rightarrow$ Accepted and updates `lastNonce`.

---

# Signature Malleability

OpenZeppelin v5 `ECDSA.recover()` is strictly enforced:
- **Low-$s$ Enforcement**: Signatures with $s > \text{secp256k1n}/2$ revert with custom error `ECDSAInvalidSignatureS`.
- **Valid $v$ Enforcement**: $v \in \{27, 28\}$ is required. $v=0, 1, 29$ revert with `ECDSAInvalidSignature`.

---

# Authorization Audit

Privileged function access controls:
1. `createBatch`: Restriced to active accounts with `MANUFACTURER_ROLE`.
2. `initiateHandover`: Restricted to current recorded custodian of the batch.
3. `confirmHandover`: Restricted to designated recipient, with real-time check that recipient remains an active authorized carrier or hospital.
4. `submitSignedTelemetry`: Cryptographically verifies recovered signer equals current custodian AND is an active carrier in the registry.
5. `linkReplacementBatch`: Restricted to `MANUFACTURER_ROLE` AND enforces that caller created both the original quarantined batch and the replacement batch (preventing cross-manufacturer lot hijacking).

---

# Custody Security

2-of-2 Multi-Sig Handover enforces:
- Neither party can unilaterally complete custody transfer.
- Custodian cannot initiate handover to self.
- Unauthorized third parties cannot confirm.
- Double confirmations are rejected (`activeHandovers` record is deleted upon confirmation).
- Revoked entities cannot accept custody even if handover was previously initiated.

---

# Batch State Machine

Valid Transitions:
- `CREATED` $\rightarrow$ `IN_TRANSIT` (Manufacturer to Carrier handover)
- `IN_TRANSIT` $\rightarrow$ `DELIVERED` (Carrier to Hospital handover)
- `IN_TRANSIT` $\rightarrow$ `QUARANTINED` (Thermal threshold breach)
- `QUARANTINED` $\rightarrow$ `REPLENISHED` (Expedited replacement lot linked)

Invalid Transitions Tested and Reverted:
- `QUARANTINED` $\rightarrow$ `IN_TRANSIT` (Cannot resume transit once breached)
- `QUARANTINED` $\rightarrow$ Handover (Cannot transfer quarantined lots)
- `DELIVERED` $\rightarrow$ Handover (Cannot transfer already delivered lots)
- `DELIVERED` $\rightarrow$ Telemetry (Cannot submit telemetry for finished deliveries)
- Linking replacement to non-quarantined batch $\rightarrow$ Reverts

---

# Thermal Detection

Boundary evaluations on-chain:
- $1.99^\circ\text{C}$ ($199$) $\rightarrow$ **BREACH** (Status: `QUARANTINED`)
- $2.00^\circ\text{C}$ ($200$) $\rightarrow$ **VALID** (Status: `IN_TRANSIT`)
- $8.00^\circ\text{C}$ ($800$) $\rightarrow$ **VALID** (Status: `IN_TRANSIT`)
- $8.01^\circ\text{C}$ ($801$) $\rightarrow$ **BREACH** (Status: `QUARANTINED`)

---

# MITM / Replay / Excursion Attack Results

Automated tests confirm distinct security responses:
- **MITM Data Alteration (Case A)**: Modifying temperature, latitude, longitude, timestamp, nonce, or batchId reverts with `INVALID_SIGNATURE`.
- **Authentic Excursion (Case B)**: Signature is valid, but temperature exceeds policy. Triggers on-chain `ColdChainBreach`, transitions to `QUARANTINED`, and emits `ReplenishmentOrderDispatched`.
- **Replay Attack (Case C)**: Valid signature with duplicate/stale nonce reverts with `REPLAY_ATTACK_DETECTED`.

---

# Autonomous Digital Recovery

- **Defensible Framing**: The framework explicitly disclaims physical self-healing.
- **Workflow**: Smart contract emits `ReplenishmentOrderDispatched` $\rightarrow$ Backend orchestrator captures event $\rightarrow$ Selects substitute lot $\rightarrow$ Mints replacement on-chain $\rightarrow$ Registers immutable parent-child lineage via `linkReplacementBatch`.

---

# Backend Audit

- FastAPI application routes are modularized across `/api/v1` (`batches`, `handover`, `simulation`, `blockchain`, `audit`).
- Web3 RPC bridge handles connection drops and transaction timeouts gracefully.
- Replaced deprecated `datetime.utcnow` with timezone-aware `get_utc_now()`.

---

# Database Audit

- SQLite persistence acts as a query cache and event store.
- Blockchain consensus remains authoritative: if local DB status differs from EVM storage, on-chain state takes precedence.

---

# Frontend Audit

- Resolved WebSocket event name discrepancy (`TELEMETRY_STREAM` vs `TELEMETRY_PACKET`).
- Fixed `useWebSocket` hook argument signature and connection state exports.
- Real-time waveforms, Leaflet route tracking, Chaos Studio, Block Explorer, and QR verification portal operate with zero console errors.

---

# QR Verification Audit

- Consumer QR portal explicitly states what is verified: on-chain genesis hash, custodian signature authenticity, monotonic nonces, and zero thermal excursions.
- Does not claim that a physical QR sticker alone guarantees chemical drug potency.

---

# Blockchain / Decentralization Claims

- Documentation accurately describes the local Hardhat node as a deterministic EVM-compatible development network, not a multi-region decentralized production mainnet.

---

# Regulatory Language Audit

- Replaced all unqualified "FDA compliant" or "certified" claims with defensible phrasing:
  > *"The prototype implements technical controls inspired by FDA 21 CFR Part 11 and CDSCO electronic record guidelines. It is not presented as regulatory-certified software."*

---

# AI / ML Audit

- Deterministic Newton’s Law of Cooling differential equations govern the simulation.
- No mandatory cloud LLM or paid AI APIs are required for core security mechanisms.

---

# Docker Isolation Audit

- Verified `-p infosecproj` namespace isolation.
- Ports `5174` (Frontend), `8001` (Backend), and `8546` (EVM) do not collide with host services (`finops` on ports 5433, 9000, 9001 remains intact).
- Verified `docker compose -p infosecproj config` passes cleanly.

---

# Dependency Audit

- Root `package.json` created with convenience scripts (`npm run dev`, `npm test`, etc.).
- All package versions pinned and compatible with Node 20 and Python 3.11/3.13.

---

# Slither / Static Analysis

Slither static analysis executed with solc 0.8.28:
- **High Severity**: 0
- **Medium Severity**: 0
- **Reentrancy**: 0 (protected by OpenZeppelin `ReentrancyGuard`)
- **Block Timestamp**: Flagged comparisons on `createdAt > 0` and 60s clock skew; confirmed intentional and safe.
- **Style/Literal Digits**: Resolved numeric readability with standard separators (`90_000_000`, `180_000_000`).

---

# End-to-End Test Results

Master verification suite (`./scripts/verify_all.sh`):
- **EVM Contracts**: 39/39 passing
- **Python Backend**: 14/14 passing
- **Frontend Build**: 0 errors
- **Crypto Vector Proof**: 100% match

---

# Remaining Risks

1. **Private Key Management at Physical Edge**: In this virtualized simulation, keys are loaded in Python memory. In a physical IoT device, keys must be protected by a Hardware Security Module (HSM) or Secure Element (e.g. ATECC608A).
2. **Gas Cost Scaling**: Committing every telemetry checkpoint directly on L1 EVM is cost-prohibitive in production. A production deployment would use an L2 Rollup (e.g. Arbitrum, Optimism) or ZK-SNARK batch rollups.

---

# Known Limitations

1. **Single Simulated Vehicle**: The default simulation engine models one interstate corridor (Hyderabad $\rightarrow$ Bangalore $\rightarrow$ Chennai).
2. **Deterministic Route Waypoints**: GPS waypoints follow predefined coordinates along NH44.

---

# Final Verdict

### **READY FOR CAPSTONE DEMONSTRATION**

The framework is mathematically sound, cryptographically authentic, defensively engineered, and thoroughly tested across all layers.
