# PharmaTrace — Final Security & Cryptographic Review
**Project:** PharmaTrace — Blockchain-Secured Pharmaceutical Supply Chain Platform  
**Authors:** Kaviselvaram Kathirvel and Aniesh S  
**Course:** CBS3002 — Information Security  
**Audit Date:** October 21, 2026  

---

## 1. Security Architecture Summary

PharmaTrace applies a Zero-Trust defense-in-depth model across physical sensors, backend microservices, and smart contracts deployed on Cancun EVM. The security guarantees are enforced mathematically rather than relying on perimeter access controls.

---

## 2. Threat Modeling & Defense Matrix

| Threat / Attack Vector | Severity | Vulnerability Description | Mitigation Mechanism | Verification Result |
| :--- | :--- | :--- | :--- | :--- |
| **MITM Telemetry Tampering** | Critical | Network adversary alters sensor temperature in transit (e.g. modifying 12.5°C to 4.0°C to hide spoilage) | Canonical 78-byte payload is hashed with EIP-191 personal prefix. Smart contract invokes `ecrecover()`. Any bit modification produces address divergence | **PROVEN REJECTED**: Reverted with `INVALID_SIGNATURE (recovered signer != custodian)` |
| **Monotonic Replay Attack** | Critical | Adversary captures valid, authentically signed packet and re-transmits it later | Contract enforces strict monotonic progression: `require(nonce > batch.latestNonce)`. The `latestNonce` is stored on-chain per batch lot | **PROVEN REJECTED**: Reverted with `REPLAY_ATTACK_DETECTED (nonce must strictly increment)` |
| **Unilateral Custody Seizure** | High | Carrier or hospital claims possession of a lot without explicit handover by the current custodian | Smart contract implements 2-of-2 dual-custody multi-signature. Releasing custodian must sign `initiateHandover()`; recipient must co-sign `confirmHandover()` | **PROVEN ENFORCED**: Custody settles atomically only upon second valid signature |
| **Unauthorized Role Masquerading** | High | Unregistered address attempts to mint lots or submit telemetry | `SupplyChainRegistry.sol` maintains role bitmasks. `PharmaSupplyChain.sol` queries `isNodeActive()` and role permissions before state mutations | **PROVEN ENFORCED**: Unauthorized callers revert with `CALLER_NOT_AUTHORIZED_ROLE` |
| **Silent Excursion Concealment** | Critical | Reefer cooling failure compromises vaccine efficacy | Autonomous contract trigger: if `temperature < minTemp` or `temperature > maxTemp`, batch status immediately flips to `QUARANTINED` | **PROVEN AUTOMATED**: Contract automatically emits `ColdChainExcursionDetected` and locks batch |
| **Inverted Temperature Envelope** | Medium | User enters `min_temp >= max_temp`, breaking threshold math | Validated at 3 layers: React form client validation, Pydantic/FastAPI backend HTTP 400 validation, and Solidity `require(minTemp < maxTemp)` | **PROVEN ENFORCED**: All 3 layers independently reject inverted envelopes |
| **Circular / Duplicate Replacement** | Medium | Operator attempts to link a quarantined batch to itself or re-link an already replenished lot | Smart contract enforces `replacementBatchId != batchId`, verifies replacement is not quarantined, and marks parent `REPLENISHED` | **PROVEN ENFORCED**: Circular and duplicate links revert on-chain |

---

## 3. Cryptographic Specification & Verification

### The 78-Byte Canonical Telemetry Format

To prevent JSON key ordering ambiguities, whitespace divergence, or floating-point IEEE-754 precision mismatches between Python 3.13 and Solidity 0.8.24, telemetry packets use a strict 78-byte binary layout:

```text
Offsets:
[ 0..32] : bytes32 batchId        (32 bytes)
[32..34] : int16   temperature_scaled (2 bytes, big-endian, signed: °C * 100)
[34..38] : int32   latitude_scaled    (4 bytes, big-endian, signed: deg * 1,000,000)
[38..42] : int32   longitude_scaled   (4 bytes, big-endian, signed: deg * 1,000,000)
[42..46] : uint32  timestamp          (4 bytes, big-endian, unsigned epoch seconds)
[46..78] : uint256 nonce              (32 bytes, big-endian, strictly incrementing)
Total Length = 78 bytes
```

### Mathematical Invariants Tested

1. **Raw Keccak-256:**
   `keccak256(canonical_78_bytes)` = `0xf1ab697f1f9b154772c485059ab5e2ea802460192a1f6489703029d714c09dca`
2. **EIP-191 Personal Digest:**
   `keccak256("\x19Ethereum Signed Message:\n32" || raw_hash)` = `0xc9c705c42dffe727421ebddbd53e4e1ec3dacf06a7c7e60ccd827e8c0e4a5382`
3. **ECDSA Signature Recovery:**
   `ECDSA.recover(eip191_digest, v, r, s)` = `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Hardhat Node Account #0)
4. **Field Tamper Sensitivity:**
   Altering any of the 6 fields by even a single least-significant bit causes complete cryptographic address divergence.

---

## 4. Production vs. Demonstration Boundary

- **Local Hardhat Test Accounts:** The private keys utilized in the automated verification scripts (`DEFAULT_MFG_KEY`, `CARRIER_KEY`) are standard public pre-funded Hardhat test mnemonic keys (`test test test... junk`). They hold zero monetary value and exist solely for local deterministic demonstration.
- **Production Recommendation:** In a production cloud/edge deployment, private keys must be held within Hardware Security Modules (HSMs) or Secure Enclaves (e.g. AWS CloudHSM, TPM 2.0 on vehicular IoT edge computers) with ECDSA signing delegated via PKCS#11 interfaces.
