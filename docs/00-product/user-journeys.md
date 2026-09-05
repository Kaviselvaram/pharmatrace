# End-to-End User Journeys & Workflow Specifications

---

## 1. WORKFLOW 1: NOMINAL BATCH GENESIS & TRANSIT

```mermaid
journey
    title Journey 1: Nominal Batch Transit
    section Batch Creation
      Log in as Manufacturer: 5: Manufacturer
      Define Product Name & Limits: 5: Manufacturer
      Deploy Batch on Ledger: 5: Manufacturer, Smart Contract
    section Transit & Telemetry
      Simulate Transit Route: 5: Simulator, Carrier
      Generate Telemetry: 5: Edge Node
      Sign with secp256k1: 5: Edge Node
      Commit to EVM: 5: Smart Contract
    section Delivery & Handover
      Arrive at Hospital: 5: Carrier, Hospital
      Execute Dual Multi-Sig: 5: Carrier, Hospital, Smart Contract
      Status -> DELIVERED: 5: Smart Contract
    section Consumer Scan
      Scan Package QR: 5: Patient
      View Verified Green Badge: 5: Patient, UI Portal
```

### Detailed Steps:
1. **Manufacturer Release**:
   - Manufacturer generates lot metadata: `COVID-VAX-BATCH-104`, Min Temp: `2.0°C`, Max Temp: `8.0°C`.
   - Calls `BatchManager.sol -> createBatch()`.
   - Transaction is mined into Block #102; emits `BatchCreated`.
2. **Custody Transfer to Carrier**:
   - Manufacturer signs `initiateHandover(batchId, CarrierAddress)`.
   - Carrier inspects physical cold container and signs `confirmHandover(batchId, ManufacturerAddress)`.
   - On-chain status becomes `IN_TRANSIT` with Carrier as registered custodian.
3. **Telemetry Streaming**:
   - Python simulation engine moves vehicle along GPS waypoints.
   - Temperature stays within nominal band ($4.5^\circ\text{C} \pm 0.4^\circ\text{C}$).
   - Every 5 seconds, an edge-signed telemetry checkpoint is submitted to the EVM.
   - Smart contract executes `ecrecover`, confirms Carrier's signature, validates $2.0 \le T \le 8.0$, and commits the checkpoint.
4. **Final Delivery & Acceptance**:
   - Vehicle arrives at Hospital dock.
   - Carrier and Hospital Pharmacist execute mutual handover.
   - Status updates to `DELIVERED`.

---

## 2. WORKFLOW 2: REFRIGERATION BREACH & AUTONOMOUS SELF-HEALING

```mermaid
journey
    title Journey 2: Cold-Chain Breach & Self-Healing
    section Transit
      Nominal Transit (4.8°C): 5: Carrier
      Refrigeration Unit Fails: 1: Simulator, Vehicle
      Temperature Climbs (8.5°C -> 11.2°C): 1: Vehicle
    section Detection & Quarantine
      Carrier Node Signs 11.2°C: 4: Edge Node
      EVM Evaluates: 11.2°C > 8.0°C: 1: Smart Contract
      Contract Marks QUARANTINED: 1: Smart Contract
      Emit ColdChainBreach Event: 1: Smart Contract
    section Autonomous Self-Healing
      SelfHealingController Intercepts: 5: Smart Contract
      Generate Replacement Order: 5: Smart Contract
      Dispatch Backup Batch: 5: Manufacturer, UI
      Hospital Dashboard Updates: 5: Hospital
```

### Detailed Steps:
1. **Incident Occurrence**:
   - At transit hour 3, the vehicle's refrigeration unit malfunctions (triggered via Chaos Studio or simulated stochastic failure).
   - Temperature climbs past the $8.0^\circ\text{C}$ critical ceiling to $11.2^\circ\text{C}$.
2. **Algorithmic Enforcement**:
   - The carrier node truthfully signs the $11.2^\circ\text{C}$ payload with its private key.
   - Smart contract validates signature authenticity via `ecrecover`.
   - Smart contract checks: $11.2 > 8.0 \rightarrow$ Threshold breached!
   - State instantly changes to `QUARANTINED`.
   - Contract emits event: `ColdChainBreach(batchId, 11.2C, timestamp)`.
3. **Automated Self-Healing Execution**:
   - `SelfHealingController.sol` automatically catches the breach event.
   - Triggers automated reorder: `mintReplacementBatch(originalBatchId, "COVID-VAX-BATCH-104-REP")`.
   - Dispatches emergency replacement from the nearest regional logistics depot.
   - Hospital dashboard reflects replacement ETA; damaged batch is permanently locked from being administered.

---

## 3. WORKFLOW 3: ADVERSARIAL ATTACK & TAMPER ATTEMPT

```mermaid
sequenceDiagram
    autonumber
    actor Attacker as Corrupt Carrier Operator
    participant Edge as Edge Device Emulator
    participant MITM as Attacker Interceptor (Chaos Panel)
    participant BC as Smart Contract (EVM)
    participant Log as Security Audit Log

    Edge->>Edge: Read Real Sensor: Temp = 12.5°C (Excursion)
    Edge->>Edge: Sign Real Payload with Node Private Key
    Edge->>MITM: Forward Telemetry Packet
    Note over MITM: Attacker intercepts packet & modifies<br/>Payload Temp: 12.5°C -> 4.2°C (Falsification)
    MITM->>BC: submitSignedTelemetry(batchId, 4.2°C, orig_v, orig_r, orig_s)
    BC->>BC: Recompute Keccak-256(4.2°C, timestamp, nonce)
    BC->>BC: ecrecover(tampered_hash, v, r, s) => Recovered 0xDEAD...
    BC->>BC: Assert Recovered == CurrentCustodian (FAILED!)
    BC->>Log: Flag TAMPER_DETECTED & Cryptographic Fraud
    BC-->>MITM: Revert Transaction: "Invalid Cryptographic Signature"
```
