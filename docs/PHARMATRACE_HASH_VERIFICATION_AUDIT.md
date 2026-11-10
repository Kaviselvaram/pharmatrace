# PharmaTrace: Technical Audit of Hash Verification & QR Resolution

## 1. Executive Summary

During testing of the **Consumer QR & Package Verification** portal (`/#verify`), users reported confusing and unexpected behavior when pasting hashes or copied blockchain explorer text:

1. When copying Block #168 (`0x2f7acd140c6ba80156792fd7d45802124c7b50dc330b7caa49a16e76d8ac091e`) or related strings from the Blockchain Ledger view, the verification portal resolved to **Vaccine Lot #10A5F7 (Spikevax mRNA-1273)**, an active nominal lot that appeared unrelated to the user's intended query.
2. If an invalid or reverted transaction was pasted, users received generic 400/404 messages without provenance context, leading to assumptions that the verification portal was broken or returning fabricated data.

This audit details the root causes identified across the backend Web3 service, API routing, and frontend parser, and documents the cryptographic resolution architecture implemented to ensure zero silent fallbacks and transparent provenance evidence.

---

## 2. Root Cause Analysis

### 2.1 The Silent Fallback Flaw in `web3_service.py`
In `backend/app/services/web3_service.py`, `find_batch_by_block` previously contained an unsafe fallback:
```python
# PREVIOUS VULNERABLE IMPLEMENTATION
if block and block.transactions:
    for tx in block.transactions:
        bid = self.find_batch_by_tx_hash(tx.hash.hex())
        if bid:
            return bid

# Unsafe Fallback:
all_bids = self.get_all_batches_on_chain()
if all_bids:
    return all_bids[-1]  # <--- CRITICAL BUG: Silently returned the latest lot!
```
When a user pasted a block hash or number that contained non-supply-chain transactions (or transactions whose EVM execution reverted), the method silently fell back to `all_bids[-1]`. The latest batch in the system was `0x10a5f7e23fa7fc14c491c30852ef38c01bc73b1f4e2e92843dfa91b35b26afa4` (Moderna Spikevax mRNA-1273 Lot #10A5F7). The user saw Lot #10A5F7 displayed and concluded the system had ignored their input.

### 2.2 Reverted Transactions in Block #168
Investigation of Block #168 confirmed that its embedded telemetry transaction had reverted on the EVM (`receipt.status == 0`) due to a simulated adversarial condition. Previously, `find_batch_by_tx_hash` failed to inspect `receipt.status`, treating failed transactions as unresolved and triggering the silent fallback.

### 2.3 Substring Collisions on Short Query Strings
In `audit.py`, early resolution logic performed SQL ILIKE substring queries (`%hex_body%`) against transaction hashes. When a user queried integer block numbers like `"0"` or `"1"`, the single digit matched nearly every 64-character hex hash in the database, triggering false ambiguity errors (`Ambiguous identifier: hash matches multiple batches: [...]`).

### 2.4 Lack of Cryptographic Provenance Evidence in the UI
The verification portal did not display metadata indicating *how* a query had been resolved. When an input was resolved via an on-chain transaction hash or block identifier, the user only saw the resulting lot's canonical batch ID, creating confusion as to why the displayed lot ID did not match the string they had pasted.

---

## 3. Engineering Remediation

### 3.1 Total Elimination of Silent Fallbacks
The fallback to `all_bids[-1]` was completely deleted from `backend/app/services/web3_service.py`. Every query now strictly resolves to its verifiable on-chain record or returns an explicit, truthful status code.

### 3.2 Granular EVM Transaction & Block Classification
`web3_service.py` and `audit.py` now classify EVM identifiers into unambiguous states:
- `FAILED_TX`: Transaction confirmed on EVM, but reverted on-chain (`status: 0`). Returns HTTP 400 with explanation.
- `WRONG_CONTRACT_TX`: Transaction verified on EVM, but sent to an unrelated contract address. Returns HTTP 400.
- `UNRELATED_TX`: Confirmed transaction with no association to any registered batch. Returns HTTP 404.
- `UNRELATED_BLOCK`: Block confirmed on EVM, but contains 0 transactions associated with pharmaceutical lots. Returns HTTP 404.
- `AMBIGUOUS`: Block contains transactions for multiple distinct lots. Returns HTTP 400 listing all candidates.

### 3.3 Safe Input Normalization & Length Enforcement
In `backend/app/api/v1/audit.py` (`resolve_batch_by_hash`):
1. **Pasted Text Sanitization:** Strips wrapping quotes, whitespace, and prefixes (`№`, `#`, `0x`).
2. **Concatenated 128-Hex Detection:**
   - If a 128-hex character string is pasted:
     * If first 64 chars == last 64 chars (repeated copy paste): deduplicates to single 32-byte hash.
     * If distinct: returns HTTP 400 rejecting ambiguous concatenated hashes.
3. **Length Validation:** Malformed strings between 50–63 or 65–127 characters are rejected with HTTP 400/404 without silent truncation.
4. **Length Threshold for Substrings:** Substring matching against `genesis_tx_hash`, `replacement_batch_id`, and `on_chain_tx_hash` requires `len(hex_body) >= 8`, preventing single-digit block numbers from matching hashes.

### 3.4 Cryptographic Provenance Evidence Banner
In `frontend/src/components/portal/QRVerifyPortal.jsx`:
- Added a dedicated **Verification Evidence Banner** directly inside the verification result card.
- Displays the resolution type:
  * `Verified by Exact 32-Byte Canonical Batch ID`
  * `Resolved from On-Chain EVM Transaction Hash`
  * `Resolved from On-Chain EVM Block Hash`
- Relabeled the quick test shortcut button to explicitly read:
  `Demo Shortcut: Try Active Lot` to prevent users from mistaking it for the currently searched lot.

---

## 4. Verification Evidence

### 4.1 Automated Acceptance Results
From `scripts/test_recovery_and_hash_verification.py`:
- `[VRF-01]` Canonical Batch ID (`0x` + 64 hex): **PASS** (Status: 200)
- `[VRF-02]` Uppercase Hex Lot Identifier: **PASS** (Status: 200)
- `[VRF-03]` Raw 64 Hex Chars (No `0x`): **PASS** (Status: 200)
- `[VRF-04]` Identifier with Whitespace and Quotes: **PASS** (Status: 200)
- `[VRF-05]` Real On-Chain Transaction Hash: **PASS** (Status: 200, Type: `TRANSACTION_HASH`)
- `[VRF-06]` Real On-Chain Block Number (Integer): **PASS** (Status: 404, No mock fallback)
- `[VRF-07]` Unknown 32-Byte Hash: **PASS** (Status: 404, Zero mock fallback)
- `[VRF-08]` Malformed Length (51 Chars): **PASS** (Status: 404)
- `[VRF-09]` Non-Hexadecimal Input: **PASS** (Status: 400)
- `[VRF-10]` Deduplicate Repeated 128-Hex String: **PASS** (Status: 200)
- `[VRF-11]` Reject Ambiguous Concatenated Hashes (128 Chars): **PASS** (Status: 400)
- `[VRF-12]` Reject Genesis / Unrelated Block 0: **PASS** (Status: 404, No mock fallback)
- `[REC-08]` Superseded Lot Flags Warning & Replacement Link: **PASS** (Status: 200)

### 4.2 Pytest QR Resilience Suite
In `backend/tests/test_qr_verification_resilience.py`:
- `test_qr_empty_input_rejection`: **PASSED**
- `test_qr_malformed_non_hex_rejection`: **PASSED**
- `test_qr_unrelated_evm_tx_rejection`: **PASSED**
- `test_qr_ambiguous_block_hash_rejection`: **PASSED**
- `test_qr_quarantined_batch_warning`: **PASSED**
