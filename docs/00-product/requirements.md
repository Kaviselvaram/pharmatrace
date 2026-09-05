# Product Requirements Specification (FRs & NFRs)

---

## 1. FUNCTIONAL REQUIREMENTS (FR)

### 1.1 Virtualized Telemetry Engine
- **FR-1.1**: The system shall provide a multi-threaded Python simulation engine capable of simulating concurrent transit for multiple pharmaceutical batches across multiple nodes.
- **FR-1.2**: Each node (Manufacturer, Transport Carrier, Warehouse, Hospital Pharmacy) must manage its own distinct ECDSA secp256k1 keypair.
- **FR-1.3**: The simulation engine must calculate realistic temperature changes using Newton's law of cooling:
  $$\frac{dT}{dt} = -k(T - T_{\text{ambient}})$$
  with randomized thermodynamic compressor cycling ($\pm 0.5^\circ\text{C}$).
- **FR-1.4**: The system shall generate time-series telemetry packets containing: `batch_id`, `temperature`, `humidity`, `latitude`, `longitude`, `timestamp`, `nonce`, `custodian_address`, and `signature`.

### 1.2 Cryptographic Signing & Validation
- **FR-2.1**: The node must hash the canonical serialized telemetry payload using `keccak256`.
- **FR-2.2**: The node must sign the hash using its secp256k1 private key, producing parameters $(v, r, s)$.
- **FR-2.3**: The on-chain smart contract (`TelemetryVerifier.sol`) must extract the signer address using `ecrecover` and assert equality with the batch's registered custodian address.
- **FR-2.4**: The smart contract must reject transactions containing previously used nonces or out-of-order timestamps (replay attack prevention).

### 1.3 Smart Contract State Machine & Threshold Enforcement
- **FR-3.1**: Batches must be registered on-chain with immutable upper and lower temperature bounds (default: $2.0^\circ\text{C}$ to $8.0^\circ\text{C}$).
- **FR-3.2**: If a verified telemetry reading violates the threshold bounds, the contract must immediately transition the batch status from `IN_TRANSIT` to `QUARANTINED`.
- **FR-3.3**: The contract must emit a `ColdChainBreach(bytes32 batchId, int16 temperature, uint256 timestamp)` event upon threshold failure.

### 1.4 Multi-Signature Custody Handover
- **FR-4.1**: Transferring custody of a batch between two nodes requires an atomic $2\text{-of-}2$ multi-signature process.
- **FR-4.2**: The current custodian must call `initiateHandover(batchId, recipientAddress)`.
- **FR-4.3**: The receiving custodian must call `confirmHandover(batchId, senderAddress)`.
- **FR-4.4**: Only upon dual confirmation does the smart contract update `currentCustodian`.

### 1.5 Autonomous Self-Healing & Replenishment
- **FR-5.1**: Upon receiving a `ColdChainBreach` event, the `SelfHealingController.sol` contract must automatically trigger a replacement batch order.
- **FR-5.2**: The replacement order must link the new batch ID to the failed batch ID for audit lineage.
- **FR-5.3**: The UI must display an automated replenishment notification and update the hospital inventory schedule.

### 1.6 Interactive Attack & Chaos Studio
- **FR-6.1**: The system must provide an interactive UI control panel to inject attack scenarios into the running simulation:
  - *MITM Tampering*: Alter temperature reading in transit without valid private key.
  - *Compressor Cut*: Cut vehicle refrigeration, driving temperature up to $14^\circ\text{C}$.
  - *Geofence Deviation*: Divert simulated GPS coordinates $>50\text{km}$ away from approved transit corridor.
  - *Replay Attack*: Re-broadcast a previously valid telemetry packet.

### 1.7 Consumer & Regulatory Verification
- **FR-7.1**: The frontend must provide a public QR verification portal that queries the blockchain and displays full batch provenance.
- **FR-7.2**: The auditor view must provide one-click generation of cryptographic compliance reports detailing block heights, transaction hashes, and signature proofs.

---

## 2. NON-FUNCTIONAL REQUIREMENTS (NFR)

### 2.1 Performance & Latency
- **NFR-1.1**: The local EVM node must process and mine transactions in $\le 1.0\text{ second}$.
- **NFR-1.2**: WebSockets must stream telemetry packets to the browser UI with $\le 200\text{ms}$ latency.
- **NFR-1.3**: Frontend frame rates must remain smooth ($\ge 30\text{ fps}$) even with real-time waveform updates.

### 2.2 Security & Cryptographic Integrity
- **NFR-2.1**: Private keys must never be exposed to the frontend or transmitted in plaintext across network boundaries.
- **NFR-2.2**: Smart contracts must be immune to common EVM vulnerabilities (Reentrancy, Arithmetic Overflow/Underflow, Front-running) verified via Slither.
- **NFR-2.3**: Off-chain APIs must implement rate-limiting and input validation via Pydantic.

### 2.3 Cost & Sustainability
- **NFR-3.1**: The entire application must be deployable and runnable with ₹0 expenditure.
- **NFR-3.2**: No external cloud service keys should be required to run the local demo suite.

### 2.4 Usability & Aesthetics
- **NFR-4.1**: The UI must adhere to the Obsidian Cyber-Clinical design system with dark background, high contrast, and glowing status indicators.
- **NFR-4.2**: The application must be fully responsive across desktop ($1920\times 1080$), tablet ($1024\times 768$), and mobile ($375\times 812$).
