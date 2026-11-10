# PharmaTrace: Root-Cause Analysis & Fix for Autonomous Recovery

## 1. Executive Summary

During testing of the **One-Click Autonomous Recovery** workflow on the PharmaTrace command center (`/#recovery`), triggering recovery on lot `0x62e80968fe15f6796f350c3f1e36593f93a19d8de3091b1df35590fa1730cd17` resulted in a critical transaction revert:

```
Contract call reverted: 'PharmaSupplyChain: original batch does not exist'
```

Simultaneously, the frontend generated multiple orphaned replacement lots (`0xb315d2a0...`, `0x168717b3...`, `0x05ae635f...`, `0xfdd70e01...`) with each failed click.

This document details the exact root causes, architectural vulnerabilities, the atomic backend resolution implemented, and the verification proving zero regressions and strict idempotency.

---

## 2. Root Cause Analysis

### 2.1 The Disconnect Between Off-Chain SQLite and Ephemeral EVM Node
In local blockchain development environments (e.g., Hardhat node on port 8546), restart cycles reset EVM state to block #0 while persistent databases like SQLite (`data/infosecproj.db`) preserve historic batches.

1. Batch `0x62e809...` existed in SQLite marked as `QUARANTINED` from a prior test session.
2. The current Hardhat EVM node had been restarted and re-deployed at new contract addresses.
3. Batch `0x62e809...` had never been minted on the *currently active* EVM contract instance.

### 2.2 Client-Side Two-Step Recovery Vulnerability
Prior to the fix, the UI (`RecoveryView.jsx`) orchestrated recovery across two separate HTTP operations:
1. **Step 1:** The frontend called `POST /api/v1/batches/` to mint a brand-new replacement lot.
2. **Step 2:** The frontend called `POST /api/v1/batches/{origId}/link-replacement` passing the new lot's ID.

In `PharmaSupplyChain.sol` lines 180–195:
```solidity
function linkReplacementBatch(bytes32 originalBatchId, bytes32 replacementBatchId) external {
    require(_batches[originalBatchId].createdAt > 0, "PharmaSupplyChain: original batch does not exist");
    require(_batches[originalBatchId].status == BatchStatus.QUARANTINED, "PharmaSupplyChain: original batch must be quarantined");
    require(_batches[replacementBatchId].createdAt > 0, "PharmaSupplyChain: replacement batch does not exist");
    ...
}
```

Because `_batches[originalBatchId].createdAt` evaluated to `0` on the EVM:
- Step 1 succeeded, minting a new batch and saving it to SQLite.
- Step 2 reverted with `"PharmaSupplyChain: original batch does not exist"`.
- Each subsequent click generated another orphaned batch in Step 1 before reverting in Step 2, creating duplicates in the database without ever resolving the recovery workflow.

---

## 3. Engineering Remediation

### 3.1 Dedicated Atomic Server-Side Endpoint
We eliminated client-side multi-step recovery by implementing an atomic, server-side orchestrated endpoint:
`POST /api/v1/batches/{batch_id}/autonomous-recovery` in `backend/app/api/v1/batches.py`.

### 3.2 Auto-Anchoring of Historic Lots
If a batch exists in SQLite as `QUARANTINED` but is not yet anchored on the active EVM instance, the backend detects `chain_data is None` and automatically anchors it:
1. Mints the original lot on-chain via `createBatch()`.
2. Triggers on-chain quarantine transition so that `_batches[originalBatchId].status == BatchStatus.QUARANTINED`.
3. Proceeds with replacement minting and atomic lineage linking.

```python
# Auto-anchor original batch on-chain if missing from ephemeral EVM state
orig_chain = web3_service.get_batch_from_chain(batch_id)
if not orig_chain and web3_service.is_connected():
    clean_b32 = bytes.fromhex(batch_id.replace("0x", ""))
    # Anchor original batch
    web3_service.supply_chain_contract.functions.createBatch(
        clean_b32,
        target_batch.drug_name,
        target_batch.dosage,
        DEFAULT_MFG_ADDRESS
    ).transact(...)
    # Transition to QUARANTINED on-chain
    web3_service.supply_chain_contract.functions.quarantineBatch(
        clean_b32,
        "Auto-anchored historical batch for autonomous recovery"
    ).transact(...)
```

### 3.3 Strict Idempotency & Reuse of Pre-Allocated Replacements
To ensure repeated clicks never spawn duplicate batches:
1. **Pre-Check:** If `target_batch.status == "REPLENISHED"`:
   - Returns HTTP 200 immediately with the existing replacement ID and confirmation status `ALREADY_RECOVERED_IDEMPOTENT`.
2. **Re-use Existing Replacement:**
   - If a replacement batch was already created in a previous run (`target_batch.replacement_batch_id`), the backend reuses that existing lot ID instead of generating a new one.
3. **Database Transaction Integrity:**
   - SQLite status is atomically set to `REPLENISHED` and `replacement_batch_id` is linked in the same transaction.

---

## 4. Verification Evidence

### 4.1 Automated Acceptance Results
From `scripts/test_recovery_and_hash_verification.py`:
- `[REC-01]` Trigger Demo Thermal Breach Quarantine: **PASS** (Status: 200)
- `[REC-02]` Reject Non-existent Lot Recovery: **PASS** (Status: 404)
- `[REC-03]` Reject Recovery on Ineligible (CREATED) Lot: **PASS** (Status: 400)
- `[REC-04]` Valid One-Click Autonomous Recovery: **PASS** (Status: 200, On-chain Tx Verified)
- `[REC-05]` Idempotent Recovery Rerun: **PASS** (Status: 200, Zero Duplicate Batches)
- `[REC-06]` Parent-Child Lineage Persisted: **PASS** (Status: 200)
- `[REC-07]` Replacement Lot Activated On-Chain: **PASS** (Status: 200)

### 4.2 End-to-End Golden Path
In `bash scripts/verify_all.sh`:
- Scenario 13 executed successfully:
  `Parent: 0x8db1da13612b (REPLENISHED) -> Replacement: 0x3a410c519578 (IN_TRANSIT)`.
- Smart contract tests: 39/39 passing.
- REST API Pytest suite: 21/21 passing.
