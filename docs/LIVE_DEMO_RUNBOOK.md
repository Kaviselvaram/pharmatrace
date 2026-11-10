# PharmaTrace: End-to-End Live Demonstration Runbook
**Project**: Blockchain-Secured Pharmaceutical Supply Chain with Cryptographically Verified Cold-Chain Telemetry  
**Capstone Authors**: Kaviselvaram Kathirvel & Aniesh S  
**Course / Context**: CBS3002 Information Security — Capstone Demonstration & Evaluator Defense  
**Architecture**: Solidity (Cancun EVM via Hardhat) | Python 3.13 (FastAPI, Web3.py, aiosqlite) | React 19 (Vite)  

---

## 1. Project Overview (Simple Language)

PharmaTrace is a decentralized cold-chain custody and traceability system designed to solve a critical vulnerability in global pharmaceutical distribution: **unauthenticated and easily falsified cold-chain monitoring records**.

In conventional supply chains, IoT temperature trackers write readings into private, centralized databases where breach incidents can be quietly deleted or modified. PharmaTrace introduces:
1. **Edge Cryptography**: Every temperature observation and GPS coordinate is packed into an exact **78-byte canonical binary payload** and signed using **ECDSA secp256k1** under the **EIP-191 personal-sign standard**.
2. **On-Chain Enforcement**: The `PharmaSupplyChain.sol` smart contract executes `ecrecover` directly on the local EVM. If an in-transit reading breaches the allowed range (e.g. $2^\circ\text{C}$ to $8^\circ\text{C}$), the smart contract **irrevocably transitions the lot to `QUARANTINED` status**.
3. **Autonomous Digital Recovery**: When a breach is proven on-chain, the system orchestrator links an authorized expedited replacement lot (`linkReplacementBatch`) to avoid hospital patient stockouts while preserving complete parent-child audit lineage.
4. **Adversarial Resilience**: Defends against Man-in-the-Middle (MITM) data tampering and packet replay attacks via strictly monotonic nonces.

---

## 2. Verified Prerequisites

Before running the demonstration, verify that your local environment has the required runtime tools installed:

- **Node.js**: `v20.x` or higher (Tested on `v24.15.0`)
- **npm**: `v10.x` or higher (Tested on `11.12.1`)
- **Python**: `3.11` to `3.13` (Virtual environment pre-configured in `.venv/bin/python`)
- **Operating System**: macOS or Linux (POSIX shell required)
- **Dedicated Local Ports**:
  - `8546` — Hardhat Local EVM RPC
  - `8001` — FastAPI REST & WebSocket Backend
  - `5174` — Vite React 19 Development Server

---

## 3. Exact Startup Commands

The stack can be started with a single orchestrator script:

```bash
# Navigate to the repository root
cd /Users/kaviselvaramkathirvel/Infosecproj

# Launch Hardhat EVM (8546), deploy contracts, start FastAPI (8001), and Vite (5174)
bash scripts/start_stack.sh
```

### Manual Individual Commands (If running in separate terminal tabs):

```bash
# Terminal 1: Start Hardhat EVM Node
cd contracts
npx hardhat node --port 8546

# Terminal 1b (One-off): Deploy Contracts to Local Network
cd contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 2: Start FastAPI Backend Gateway
source .venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8001

# Terminal 3: Start React 19 Frontend
npm --prefix frontend run dev
```

---

## 4. Health-Check Commands & Endpoints

Verify that all three layers are responding prior to presentation:

```bash
# 1. EVM Node Health (port 8546)
curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:8546

# 2. FastAPI Backend Health (port 8001)
curl -s http://127.0.0.1:8001/health

# 3. Blockchain Web3 Bridge Health (port 8001)
curl -s http://127.0.0.1:8001/api/v1/blockchain/status

# 4. Frontend HTTP Response (port 5174)
curl -s -I http://127.0.0.1:5174
```

**Expected Responses**:
- Health: `{"status":"HEALTHY","service":"...","version":"1.0.0"}`
- Blockchain Status: `{"connected":true,"chain_id":31337,"block_number":...,"registry_address":"0x5FbDB2315678afecb367f032d93F642f64180aa3","supply_chain_address":"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"}`

---

## 5. Browser URL & Port Information

| Service | Target URL | Purpose |
| :--- | :--- | :--- |
| **Command Center UI** | `http://localhost:5174` | Main React 19 dashboard, map, and telemetry viewer |
| **Public Portal / Landing** | `http://localhost:5174/#portal` | Public facing pharmaceutical landing page |
| **Consumer QR Portal** | `http://localhost:5174/#verify` | Public consumer/patient QR code batch verification |
| **Regulatory Auditor** | `http://localhost:5174/#auditor` | FDA 21 CFR Part 11 / CDSCO audit report exporter |
| **Chaos Studio** | `http://localhost:5174/#chaos` | Real-time adversarial failure injection console |
| **Interactive API Docs** | `http://localhost:8001/docs` | Swagger / OpenAPI backend specification |
| **Local EVM JSON-RPC** | `http://localhost:8546` | Local Hardhat Ethereum blockchain node |

---

## 6. Demo Accounts & Pre-Configured Roles

The local Hardhat environment provisions standard deterministic pre-funded accounts registered in `SupplyChainRegistry.sol`:

| Role Name | Organization Label | Public Ethereum Address |
| :--- | :--- | :--- |
| **Deployer / Admin** | Contract Deployer | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| **Manufacturer** | BioVax LifeSciences Ltd | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| **Carrier** | ColdLogix Freight Fleet | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| **Hospital / Pharmacy**| Apollo Specialty Hospital | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| **Regulatory Auditor** | CDSCO Drug Control Division| `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |

---

## 7. Timed Presentation Sequence (8–12 Minutes)

```
[00:00 - 01:30] Act 1: The Problem & Architectural Overview
[01:30 - 03:00] Act 2: Command Center & Batch Creation
[03:00 - 04:30] Act 3: Edge Cryptography (78-Byte Canonical Payload)
[04:30 - 06:00] Act 4: Two-Party Custody Handover
[06:00 - 08:00] Act 5: Adversarial Attacks (MITM & Replay Defense)
[08:00 - 09:30] Act 6: Thermal Excursion & Autonomous Digital Recovery
[09:30 - 11:00] Act 7: Consumer QR Verification & Regulatory Auditor
[11:00 - 12:00] Act 8: Summary, Boundaries & Evaluator Q&A
```

---

## 8. Exact Clicks & Actions for Every Demo Stage

### Act 1 — The Problem & Architectural Overview (00:00 - 01:30)
1. **Screen**: Open `http://localhost:5174/#portal` (Public Portal).
2. **Action**: Scroll briefly past the Hero and Surveillance sections.
3. **Talking Point**:
   > *"In cold-chain distribution for biologics and mRNA vaccines, centralized IoT trackers allow compromised records to be edited after the fact. PharmaTrace solves this by anchoring cryptographic edge signatures directly to a Solidity smart contract on the blockchain."*
4. **Action**: Click the white **"Launch App"** button in the header. Browser navigates to `http://localhost:5174/#overview`.

### Act 2 — Command Center & Batch Genesis (01:30 - 03:00)
1. **Screen**: Dashboard Overview (`#overview`).
2. **Action**: Point to the **EVM Block Pill** (e.g. `#182`) and the green **"LIVE HEARTBEAT"** WebSocket pill in the top header.
3. **Action**: Click the white **"+ Mint Batch"** button in the top right.
4. **Modal Interaction**:
   - Product Name: `Pfizer Comirnaty BNT162b2 (Live Viva)`
   - Min Temp: `2.0`
   - Max Temp: `8.0`
   - Click **"Mint Lot on EVM"**.
5. **Expected Result**:
   - A green toast notification appears: `Minted batch 0x... on EVM!`.
   - The new batch appears at the top of the Batch Registry table with status `CREATED`.

### Act 3 — Edge Cryptography: 78-Byte Canonical Payload (03:00 - 04:30)
1. **Screen**: Click **"Chaos Studio"** (`#chaos`) in the sidebar.
2. **Action**: Select the newly minted batch from the dropdown. Click **"Start Live Simulation"**.
3. **Observation**:
   - Telemetry waveform starts streaming live readings between $3.8^\circ\text{C}$ and $5.2^\circ\text{C}$.
   - Inspect the **Cryptographic Inspector** panel on screen.
4. **Talking Point**:
   > *"Every telemetry frame is packed into an exact 78-byte canonical binary structure: 32 bytes for batchId, 2 bytes for scaled temperature (int16), 4 bytes each for latitude and longitude (int32), 4 bytes for timestamp (uint32), and 32 bytes for monotonic nonce (uint256). Floating point ambiguity is completely eliminated using symmetric round-half-up math before signing under EIP-191."*

### Act 4 — Two-Party Custody Handover (04:30 - 06:00)
1. **Screen**: Click **"Custody Handover"** (`#custody`) in the sidebar.
2. **Action**: Find your batch, click **"Initiate Handover"**.
3. **Modal Step 1**:
   - Select Recipient: `ColdLogix Fleet (Carrier)`.
   - Click **"Sign & Initiate Transfer"**.
   - Point out that status updates on-chain to pending.
4. **Modal Step 2**:
   - Switch active role dropdown in the navbar to **"ColdLogix Fleet (Carrier)"**.
   - Click **"Confirm & Accept Custody"**.
5. **Expected Result**:
   - Status updates on-chain to `IN_TRANSIT`.
   - Current Custodian is now ColdLogix Carrier (`0x3C44...`).
   - Neither party could unilaterally take custody without counter-signature.

### Act 5 — Adversarial Attacks: MITM & Replay Defense (06:00 - 08:00)
1. **Screen**: Return to **"Chaos Studio"** (`#chaos`).
2. **Action**: Click the red **"MITM Tamper"** button.
3. **Observation & Talking Point**:
   > *"Simulating an active Man-in-the-Middle attack: The vehicle thermometer detected a breach, but a compromised router alters the payload to report a fake safe temperature of 4.00°C without possessing the carrier's private key."*
4. **Expected Result**:
   - A red security banner triggers on the UI: `SECURITY ALERT: Cryptographic signature mismatch! Reverted on EVM: INVALID_SIGNATURE`.
   - The smart contract's `ecrecover` generated an address divergence and rejected the packet.
5. **Action**: Point out that if an attacker replays a previously valid packet, the contract's monotonic check `require(nonce > lastNonce[batchId][signer])` reverts with `REPLAY_ATTACK_DETECTED`.

### Act 6 — Thermal Excursion & Autonomous Digital Recovery (08:00 - 09:30)
1. **Screen**: Inside **"Chaos Studio"** (`#chaos`).
2. **Action**: Click the orange **"Compressor Failure"** button.
3. **Observation**:
   - The cooling power cuts out; passive thermodynamic heat transfer drives temperature past $8.00^\circ\text{C}$ (e.g. $11.5^\circ\text{C}$).
   - Because the sensor's signature is authentic, the contract accepts the packet and immediately transitions the batch status to `QUARANTINED`.
   - Toast alert appears: `CRITICAL: Cold-Chain Excursion! Status: QUARANTINED`.
4. **Action**: Navigate to **"Quarantine & Recovery"** (`#recovery`).
5. **Observation**:
   - The quarantined batch is listed with breach metrics.
   - Click **"Expedite Replacement Lot"**.
   - The system calls `PharmaSupplyChain.linkReplacementBatch` on-chain, transitioning the original lot to `REPLENISHED` and linking the replacement lot ID.

### Act 7 — Consumer QR Verification & Regulatory Auditor (09:30 - 11:00)
1. **Screen**: Click **"Consumer QR"** (`#verify`) in the sidebar.
2. **Action**: Click your batch ID from the Quick-Select chips, click **"Verify Batch"**.
3. **Observation**:
   - Shows a consumer certificate: `BATCH QUARANTINED — DO NOT ADMINISTER`.
   - Shows the verified on-chain link: `Replacement Lot Dispatched: 0x...`.
4. **Screen**: Click **"Regulatory Auditor"** (`#auditor`) in the sidebar.
5. **Action**: Select the lot and view the generated compliance report.
6. **Observation**:
   - Full deterministic compliance report aligned with **FDA 21 CFR Part 11 § 11.10** and CDSCO GDP.
   - Shows all verified transactions, breach counts, and ECDSA signature algorithms.
   - Click **"Export .md Report"** to copy the verified regulatory document.

### Act 8 — Summary, Boundaries & Defense (11:00 - 12:00)
1. Conclude the demonstration using the honest boundary disclosures in Section 12.
2. Invite evaluators' questions.

---

## 9. Expected Results Checklist

- [x] EVM Node responds with valid block height > 0.
- [x] Backend responds to `/health` with `{"status":"HEALTHY"}`.
- [x] All 7 gates in `./scripts/verify_all.sh` pass with 100% green exit code 0.
- [x] Inverting temperature bounds (`min >= max`) returns HTTP 400 Bad Request, not 500.
- [x] MITM alteration triggers EVM transaction revert with reason `INVALID_SIGNATURE`.
- [x] Replay attack triggers EVM transaction revert with reason `REPLAY_ATTACK_DETECTED`.
- [x] Real thermal excursion ($>8.00^\circ\text{C}$) triggers contract quarantine.
- [x] Replacement lot is cryptographically linked on-chain via `linkReplacementBatch`.

---

## 10. Recovery Instructions If a Service Fails

If any component becomes unresponsive during practice:

```bash
# 1. Check which processes are occupying the ports
lsof -i :8546 -i :8001 -i :5174

# 2. Kill stale processes safely
kill -9 $(lsof -t -i :8546) 2>/dev/null || true
kill -9 $(lsof -t -i :8001) 2>/dev/null || true
kill -9 $(lsof -t -i :5174) 2>/dev/null || true

# 3. Clean-restart the full stack
bash scripts/start_stack.sh
```

---

## 11. Shutdown Commands

To stop all services after the presentation:

```bash
# Gracefully terminate all active background daemons
kill -9 $(lsof -t -i :8546 -i :8001 -i :5174) 2>/dev/null || true
echo "✅ PharmaTrace local stack stopped."
```

---

## 12. Limitations & Honest Presentation Wording

When presenting to professors and evaluators, use these exact, defensible phrases:

1. **On Blockchain Environment**:
   > *"We run our smart contracts on a local Ethereum Cancun EVM node via Hardhat on port 8546. This provides complete EVM consensus fidelity and on-chain ecrecover execution without requiring testnet faucets or paid gas fees."*
2. **On Sensor Trust**:
   > *"The ECDSA digital signature does not physically prove that the ambient air is cold; it mathematically proves that the private key assigned to this specific edge device signed this specific 78-byte reading without alteration. Trust in physical calibration remains an edge-sensor hardware assumption."*
3. **On Multisig Custody**:
   > *"Our custody handover implements a role-based dual-party state transition machine between verified nodes in the `SupplyChainRegistry` contract, rather than a generic M-of-N threshold wallet like Gnosis Safe."*
4. **On Map Tiles**:
   > *"The transit map uses Leaflet with OpenStreetMap public tiles. It displays the National Highway 44 dedicated pharma corridor between Hyderabad and Chennai."*
5. **On Autonomous Recovery**:
   > *"Autonomous Digital Recovery refers to algorithmic supply-chain orchestration (disagreeing, quarantining, and dispatching replacement lots), not physical repair of machinery."*
