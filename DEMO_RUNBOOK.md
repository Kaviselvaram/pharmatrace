# PharmaTrace: Final Examination & Viva Demo Runbook
**Project**: Blockchain-Based Supply Chain Simulation Framework: Cryptographic Traceability using Virtualized Telemetry  
**Authors**: Kaviselvaram Kathirvel & Aniesh S  
**Course**: CBS3002 - Information Security (Review 2 & Final Project Presentation)  
**Stack**: Solidity (Cancun EVM) | Python 3.11 (Web3.py, FastAPI) | React 19 (Vite) | Docker Compose

---

## 1. Quick Start / How to Run the Demonstration

### Option A: Local Native Execution (Fastest & Recommended for Viva)

Open 3 terminal tabs in the project root `/Users/kaviselvaramkathirvel/Infosecproj`:

#### Terminal 1: Local EVM Node & Contract Deployment
```bash
cd contracts
npm run node
```
*(In a separate one-off command once the node is up, deploy the contracts)*:
```bash
npm run deploy:local
```

#### Terminal 2: FastAPI Backend & Physics Engine
```bash
source .venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### Terminal 3: React 19 Frontend Dashboard
```bash
npm --prefix frontend run dev
```

Then open your browser at:
👉 **`http://localhost:5174`**

---

### Option B: Automated Single-Script Verification Gate
Before starting your viva presentation, run the master test suite:
```bash
./scripts/verify_all.sh
```
This runs 19 Hardhat unit tests, 11 Python pytest suites, the Vite production build, and the exact 78-byte cryptographic vector verification.

---

### Option C: Isolated Docker Compose
```bash
docker compose -p infosecproj up --build
```
- Frontend: `http://localhost:5174`
- Backend API Docs: `http://localhost:8001/docs`
- EVM RPC: `http://localhost:8546`

*(Docker safety notice: Does not conflict with existing host services; avoids ports 5433, 9000, 9001).*

---

## 2. Step-by-Step Viva Presentation Script (PPT Slide Mapping)

| Stage | Topic / Slide | Live Screen Action | Key Talking Points for Evaluators |
| :--- | :--- | :--- | :--- |
| **Stage 1** | **Slide 1–3: Introduction & Architecture** | Navigate to **Command Center** (`http://localhost:5174`) | Explain that commercial IoT trackers report unauthenticated data to centralized cloud DBs where values can be secretly altered. Our architecture brings asymmetric cryptography (secp256k1) directly to the virtualized edge sensor, signing every GPS coordinate and temperature observation. |
| **Stage 2** | **Slide 4: Cryptographic Vector** | Click **Chaos Studio** $\rightarrow$ Inspect **Cryptographic Inspector** box | Point out the exact **78-byte canonical payload** (`bytes32` batchId, `int16` temp $\times 100$, `int32` lat $\times 10^6$, `int32` lon $\times 10^6$, `uint32` timestamp, `uint256` nonce). Explain why floating points are rejected in hashing and why EIP-191 personal sign is used. |
| **Stage 3** | **Slide 5: Nominal Transit Simulation** | Click **Command Center**, click **"Simulate"** on Batch #1 | Observe the live temperature waveform oscillating between $3.8^\circ\text{C}$ and $5.2^\circ\text{C}$ according to the calibrated Newton cooling physics model. Watch the pulsing vehicle marker move along NH44 (Hyderabad $\rightarrow$ Bangalore $\rightarrow$ Chennai). |
| **Stage 4** | **Slide 5: Adversarial Attack A (MITM Data Alteration)** | Go to **Chaos Studio**, click **"Inject MITM"** | Explain the attack: An attacker intercepted the telemetry packet and modified the temperature ($12.5^\circ\text{C} \rightarrow 4.2^\circ\text{C}$) to hide a breach. Because the attacker lacks the carrier's private key, Solidity's `ecrecover` produces a recovered address mismatch. The contract rejects the packet, proving non-repudiation. |
| **Stage 5** | **Slide 6: Attack B & Autonomous Digital Recovery** | Click **"Cut Compressor"** in Chaos Studio | Explain physical refrigeration breakdown: The sensor truthfully reports rising temperature ($>8.00^\circ\text{C}$). The smart contract marks the batch as `QUARANTINED` and emits a `ColdChainExcursion` event. The backend orchestrator catches the event and immediately generates an expedited replacement batch order to prevent hospital drug stockouts. |
| **Stage 6** | **Slide 7: 2-of-2 Custody Handover** | Return to **Batch Registry**, click **"Handover"** on a batch | Demonstrate dual-party custody transfer: Manufacturer signs transfer to ColdLogix Carrier (Step 1). Carrier counter-signs acceptance on-chain (Step 2). Neither party can unilaterally claim or abandon cargo without the counter-signature. |
| **Stage 7** | **Slide 8: Consumer QR Verification** | Click **"Consumer QR"** tab (or click "QR" in batch table) | Show the patient/pharmacist scanning view. For a healthy batch, it displays "AUTHENTIC & SAFE TO ADMINISTER" with unbroken cold-chain history. For a breached batch, it displays "BATCH QUARANTINED — DO NOT ADMINISTER" and points to the replacement dispatch lot. |
| **Stage 8** | **Slide 8: Regulatory Audit Workspace** | Click **"Audit Reports"** tab | Review the regulatory compliance checklist aligned with **FDA 21 CFR Part 11 § 11.10(a)(e) and § 11.50**, and CDSCO GDP. Click **"Download .md"** to export the verified on-chain audit log. |
| **Stage 9** | **Slide 9: Blockchain Ledger Explorer** | Click **"Ledger Explorer"** tab | Show live mined EVM blocks, transaction counts, gas used, and smart contract addresses (`PharmaSupplyChain` & `SupplyChainRegistry`). |

---

## 3. Potential Viva Questions & Model Answers

### Q1: Why did you use `ecrecover` in Solidity instead of verifying signatures on your backend?
**Answer**:
> *"If verification only happens off-chain in a backend server, the server is a single point of failure and trust. An attacker with server access could forge or accept invalid data. By verifying the secp256k1 digital signature on-chain inside the `PharmaSupplyChain` smart contract, the verification rule is immutable, deterministic, and audited by the entire network consensus."*

### Q2: Why is your payload exactly 78 bytes? Show the math.
**Answer**:
> *"Solidity `abi.encodePacked` tightly packs primitive types without 32-byte word padding:*
> - `bytes32 batchId`: 32 bytes
> - `int16 temperatureScaled` (multiplied by 100 to eliminate floating point ambiguity): 2 bytes
> - `int32 latitudeScaled` (multiplied by $10^6$): 4 bytes
> - `int32 longitudeScaled` (multiplied by $10^6$): 4 bytes
> - `uint32 timestamp` (Unix epoch seconds): 4 bytes
> - `uint256 nonce` (strictly monotonic counter): 32 bytes
> 
> $$32 + 2 + 4 + 4 + 4 + 32 = 78\text{ bytes}$$
> *Both Python and Solidity pack these exact byte offsets in big-endian ordering, guaranteeing identical Keccak-256 hashes."*

### Q3: What is "Autonomous Digital Recovery"? Does the blockchain fix the refrigerator?
**Answer**:
> *"No, blockchain cannot alter physical reality. We intentionally avoid buzzwords like 'self-healing hardware'. Instead, our system executes Autonomous Digital Recovery: When an immutable cold-chain violation ($T > 8.00^\circ\text{C}$ or $T < 2.00^\circ\text{C}$) is proven on-chain, the contract irrevocably locks the lot into `QUARANTINED` status and emits an event. The backend orchestration service intercepts this event, selects the nearest qualified inventory from a simulated distribution center, dispatches a replacement batch, and registers the cryptographic parent-child link on-chain, thereby preventing hospital patient therapy delays."*

### Q4: How do you prevent replay attacks if a trucker re-sends yesterday's good temperature reading?
**Answer**:
> *"Every signed telemetry payload includes a monotonic `nonce`. The smart contract maintains a state mapping `latestNonce[batchId][nodeAddress]`. If an incoming packet has a nonce $\le$ the recorded nonce, the transaction immediately reverts with `ReplayDetected()`. Replaying old packets is mathematically rejected."*

### Q5: What makes this compliant or aligned with FDA 21 CFR Part 11?
**Answer**:
> *"FDA 21 CFR Part 11 regulates electronic records and electronic signatures in pharmaceutical manufacturing. Our architecture aligns with:*
> 1. *§ 11.10(a): Validation through mathematically provable ECDSA digital signatures and deterministic EVM execution.*
> 2. *§ 11.10(e): Computer-generated, timestamped, immutable audit trails on the blockchain ledger that cannot be altered or deleted.*
> 3. *§ 11.50: Digital signature manifestations uniquely binding the signer's public key, timestamp, and location.*
> 4. *CDSCO Good Distribution Practices: Automated quarantine enforcement ensuring compromised temperature-sensitive drugs never reach patient administration."*

---

## 4. Test Vector Reference (Cryptographic Correctness)

- **Test Signer Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` (Hardhat Account #0)
- **Expected Ethereum Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Canonical Byte Length**: Exactly **78 bytes**
- **Test Raw Keccak-256 Digest**: `0xf1ab697f1f9b154772c485059ab5e2ea802460192a1f6489703029d714c09dca`
- **Solidity ecrecover Recovered Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` $\equiv$ Expected Address.
