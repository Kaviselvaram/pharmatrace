# Phase 1: Smart Contract Suite & Local EVM Ledger

---

## 1. OBJECTIVE
Implement, compile, test, and deploy the complete five-contract Solidity suite implementing RBAC, batch state machine, native ECDSA `ecrecover` verification, $2\text{-of-}2$ multi-sig custody transfer, and self-healing quarantine triggers.

## 2. INPUTS & DEPENDENCIES
- `docs/01-architecture/smart-contracts.md`
- `docs/01-architecture/cryptography-spec.md`
- Hardhat toolchain initialized in Phase 0.

## 3. FILES TO CREATE
- `contracts/contracts/SupplyChainRegistry.sol`
- `contracts/contracts/BatchManager.sol`
- `contracts/contracts/TelemetryVerifier.sol`
- `contracts/contracts/CustodyHandover.sol`
- `contracts/contracts/SelfHealingController.sol`
- `contracts/scripts/deploy.js`
- `contracts/test/Registry.test.js`
- `contracts/test/TelemetryVerifier.test.js`
- `contracts/test/CustodyHandover.test.js`
- `contracts/test/SelfHealing.test.js`

## 4. IMPLEMENTATION REQUIREMENTS & INTERFACES

### 1. `SupplyChainRegistry.sol`
- Manage roles: `MANUFACTURER`, `DISTRIBUTOR`, `CARRIER`, `HOSPITAL`, `AUDITOR`.
- Register public Ethereum addresses to organizational identities.
- Provide `isAuthorized(address, Role)` view helper.

### 2. `BatchManager.sol`
- `createBatch(bytes32 batchId, string productName, int16 minTemp, int16 maxTemp)`
- Restrict creation to `MANUFACTURER_ROLE`.
- Store `Batch` struct with scaled temperature bounds and status enum.

### 3. `TelemetryVerifier.sol`
- `submitSignedTelemetry(bytes32 batchId, int16 temp, int32 lat, int32 lon, uint32 timestamp, uint32 nonce, uint8 v, bytes32 r, bytes32 s)`
- Reconstruct canonical hash matching off-chain encoding.
- Execute `ecrecover` to extract signer address.
- Assert `signer == currentCustodian`.
- Validate monotonic nonce to prevent replay attacks.
- If threshold is breached, call `selfHealingController.handleBreach(batchId, temp, timestamp)`.

### 4. `CustodyHandover.sol`
- `initiateHandover(bytes32 batchId, address recipient)`
- `confirmHandover(bytes32 batchId, address sender)`
- Updates custodian only upon dual signature confirmation.

### 5. `SelfHealingController.sol`
- Sets batch status to `QUARANTINED`.
- Mints replacement batch ID and emits `ReplenishmentOrderDispatched`.

## 5. TESTING REQUIREMENTS
- 100% path coverage on `TelemetryVerifier.test.js`.
- Test exact boundary values:
  - $1.99^\circ\text{C}$ (Fails / Quarantines)
  - $2.00^\circ\text{C}$ (Passes)
  - $8.00^\circ\text{C}$ (Passes)
  - $8.01^\circ\text{C}$ (Fails / Quarantines)
- Test forged signature rejection.
- Test replay attack with repeated nonce.

## 6. DEFINITION OF DONE
- [ ] `npx hardhat compile` succeeds with zero warnings.
- [ ] `npx hardhat test` passes all tests with 100% pass rate.
- [ ] `npx hardhat run scripts/deploy.js --network localhost` successfully writes deployment artifacts and contract ABIs to `contracts/deployments/local.json`.
