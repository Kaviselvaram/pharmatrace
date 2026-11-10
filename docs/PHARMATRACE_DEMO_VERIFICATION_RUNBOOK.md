# PharmaTrace: Live Demonstration & Verification Runbook

**System:** PharmaTrace — Blockchain-Secured Pharmaceutical Cold-Chain Platform  
**Target Audience:** Evaluators, Auditors, Engineers, and Presenters  
**URL Reference:**
- **Frontend Command Center:** `http://localhost:5174`
- **Backend Swagger UI:** `http://localhost:8001/docs`
- **Backend Health Check:** `http://localhost:8001/health`
- **Local Hardhat EVM RPC:** `http://127.0.0.1:8546`

---

## 1. System Startup & Verification

### 1.1 Verify Running Services
Run the following health check command in your terminal:
```bash
curl -s http://localhost:8001/health
```
**Expected Output:**
```json
{"status":"HEALTHY","service":"Pharma Cold-Chain Cryptographic Traceability Platform","version":"1.0.0"}
```

If any service is offline, launch them using the dedicated run script:
```bash
# 1. Hardhat EVM Node (Terminal 1)
npx hardhat node --port 8546

# 2. FastAPI Backend (Terminal 2)
PYTHONPATH=backend .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# 3. Vite React Frontend (Terminal 3)
npm run dev --prefix frontend
```

---

## 2. Step-by-Step Live Demonstration Script

### Scene 1: Platform Overview & System Health
1. Open `http://localhost:5174/#overview` in your browser.
2. Point out:
   - **EVM Block Counter:** Live mined block height (`#1579+`) with active heartbeat.
   - **Active Fleet Statistics:** Number of active lots in transit, delivered, and quarantined.
   - **Role Switcher (Header):** Switch between `BioVax Pharma (Manufacturer)`, `Apex Logistics (Carrier)`, `MediDistribute (Distributor)`, and `Metro Hospital (Provider)`.

---

### Scene 2: Batch Minting & Genesis Formulation
1. Click **+ Mint Batch** in the top right navigation bar.
2. Enter:
   - **Drug Name:** `Moderna Spikevax mRNA-1273`
   - **Dosage:** `0.5 mL / 50 mcg`
   - **Storage Requirements:** `Strict Cold Chain (2.0°C to 8.0°C)`
3. Click **Mint Genesis Lot On-Chain**.
4. Observe:
   - The transaction is confirmed on EVM with a genuine 32-byte transaction hash.
   - Status transitions to `CREATED` with current custodian set to `BioVax Pharma`.

---

### Scene 3: 2-of-2 Custody Handover (Manufacturer $\to$ Carrier)
1. Navigate to **Custody Handover** (`/#handover`).
2. Select your newly minted batch.
3. Switch role to `BioVax Pharma (Manufacturer)` and click **Initiate Handover** to `Apex Logistics (Carrier)`.
4. Switch role to `Apex Logistics (Carrier)` and click **Confirm Custody Receipt**.
5. Observe:
   - Both signatures are recorded on-chain.
   - Batch status advances from `CREATED` $\to$ `IN_TRANSIT`.

---

### Scene 4: Real-Time Telemetry & Chaos Studio Adversarial Defense
1. Navigate to **Live Telemetry** (`/#telemetry`) and **Fleet Transit Map** (`/#map`).
2. Observe GPS coordinates interpolating along the transit route and real-time temperature updates within the nominal $2.00^\circ\text{C}$ to $8.00^\circ\text{C}$ band.
3. Navigate to **Chaos Studio** (`/#chaos`).
4. **Demonstrate MITM Tampering Defense:**
   - Click **Inject MITM Fault (Tamper Temperature)**.
   - The simulation worker injects a forged temperature payload.
   - The cryptographic verification layer detects `INVALID_SIGNATURE (recovered signer mismatch)` and rejects the packet without committing it to the blockchain.
5. **Demonstrate Monotonic Replay Protection:**
   - Click **Inject Replay Fault**.
   - The worker sends a duplicate packet with an existing nonce.
   - The smart contract reverts with `REPLAY_ATTACK_DETECTED (nonce must strictly increment)`.
6. Click **Reset Chaos Faults**.

---

### Scene 5: Thermal Excursion & Autonomous Smart Contract Quarantine
1. In **Chaos Studio**, click **Simulate Compressor Failure Excursion**.
2. Temperature spikes to $14.8^\circ\text{C}$ ($> 8.00^\circ\text{C}$).
3. Observe:
   - `PharmaSupplyChain.sol` autonomously executes:
     `_batches[batchId].status = BatchStatus.QUARANTINED;`
   - Instant critical alert triggered in **Security Center** (`/#security`).
   - The batch is immediately locked against further handovers.

---

### Scene 6: One-Click Autonomous Recovery Workflow
1. Navigate to **Quarantine & Recovery** (`/#recovery`).
2. Locate the quarantined lot.
3. Click **One-Click Autonomous Recovery**.
4. Observe the atomic execution:
   - Automatically anchors historical lots on-chain if necessary.
   - Mints an expedited replacement lot.
   - Invokes `linkReplacementBatch()` on-chain to bind digital twins.
   - Updates status to `REPLENISHED`.
   - Displays the on-chain replacement batch hash and transaction receipt.
5. **Test Idempotency:**
   - Click the button a second time.
   - Observe that zero duplicate batches are created; the system returns `ALREADY_RECOVERED_IDEMPOTENT` instantly.

---

### Scene 7: Consumer QR & Hash Verification Portal
1. Navigate to **Consumer QR** (`/#verify`).
2. **Test 1 — Active Safe Lot:**
   - Enter `0x1111111111111111111111111111111111111111111111111111111111111111`.
   - Click **Verify Package**.
   - Observe: Green banner **VERIFIED: SAFE FOR CLINICAL ADMINISTRATION** with evidence:
     `Verified by Exact 32-Byte Canonical Batch ID`.
3. **Test 2 — Quarantined / Replenished Lot:**
   - Enter `0x3333333333333333333333333333333333333333333333333333333333333333`.
   - Click **Verify Package**.
   - Observe: Blue warning banner **LOT REPLENISHED: SUPERSEDED BY ON-CHAIN REPLACEMENT** with direct clickable link to the genuine expedited replacement lot.
4. **Test 3 — Blockchain Transaction / Block Hash Resolution:**
   - Copy a real transaction hash from the **Blockchain Ledger** (`/#blockchain`).
   - Paste into the verification input and click **Verify Package**.
   - Observe the **Cryptographic Provenance Evidence Banner** detailing resolution from `TRANSACTION_HASH` or `BLOCK_HASH` without any fallback to unrelated lots.
5. **Test 4 — Negative Verification (Zero Mock Fallback):**
   - Enter an unknown hash `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.
   - Observe HTTP 404 with explicit error detail:
     `Batch lot '0xaaaa...' not found in registry and does not match any confirmed EVM transaction or block.`

---

### Scene 8: Regulatory Audit Dossier (FDA 21 CFR Part 11)
1. Navigate to **Regulatory Auditor** (`/#audit`).
2. Select any active or completed lot.
3. Click **Generate FDA 21 CFR Part 11 Audit Report**.
4. Review the generated cryptographically verifiable compliance dossier containing:
   - Full SHA-256 telemetry hash audit trail.
   - Immutable on-chain transaction hashes and block numbers.
   - Electronic custodian signatures and device calibration certificates.
   - Download as JSON or printable regulatory PDF dossier.

---

## 3. Automated Verification Commands

To run all automated verification suites in one step:
```bash
# 1. Run Master All-Gate Verification Suite
bash scripts/verify_all.sh

# 2. Run Targeted Recovery & Hash Verification Suite
python3 scripts/test_recovery_and_hash_verification.py
```
Both suites must exit with code `0` and `100% GREEN`.
