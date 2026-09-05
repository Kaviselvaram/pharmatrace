# Demonstration & Verification Scenarios
**Step-by-Step Viva & Presentation Validation Checklist**

---

## 1. SCENARIO A: NOMINAL TRANSIT (GREEN PATH)
1. **Action**: Open Dashboard $\rightarrow$ Click *"Launch Nominal Batch"* (`COVID-VAX-LOT-01`).
2. **Observed System Behavior**:
   - `BatchCreated` transaction mined on local EVM.
   - Transit begins on Leaflet map; vehicle marker moves along Bangalore-Chennai highway.
   - Live telemetry sparkline shows temperatures fluctuating safely between $4.1^\circ\text{C}$ and $4.8^\circ\text{C}$.
   - Block explorer increments block height and shows signed transactions.
   - Handover to Apollo Hospital completes via dual signature confirmation.
3. **Acceptance Proof**: Public QR verification portal displays green badge: *"VERIFIED AUTHENTIC & COLD-CHAIN SECURED"*.

---

## 2. SCENARIO B: COMPRESSOR FAILURE & AUTONOMOUS SELF-HEALING (RED PATH)
1. **Action**: Open Chaos Studio $\rightarrow$ Select active Batch $\rightarrow$ Click *"Inject Compressor Failure"*.
2. **Observed System Behavior**:
   - Simulated cooling turns off; container temperature begins climbing exponentially.
   - At $8.1^\circ\text{C}$, the next signed packet is submitted to EVM.
   - `TelemetryVerifier` detects threshold breach and emits `ColdChainBreach`.
   - UI status badge flashes red: `QUARANTINED`.
   - `SelfHealingController` executes autonomous replenishment:
     `ReplenishmentOrderDispatched(original: LOT-01, replacement: LOT-01-REP)`.
   - Backup batch appears in transit with urgent dispatch tag.
3. **Acceptance Proof**: Scanning original batch QR shows red banner: *"QUARANTINED: THERMAL EXCURSION DETECTED"*.

---

## 3. SCENARIO C: MAN-IN-THE-MIDDLE TAMPER ATTACK (SECURITY ATTACK)
1. **Action**: Open Chaos Studio $\rightarrow$ Enable *"Simulate MITM Interceptor"* $\rightarrow$ Set Altered Temp to $4.0^\circ\text{C}$ while real temperature is $13.5^\circ\text{C}$.
2. **Observed System Behavior**:
   - Attacker attempts to forge packet without private key.
   - Payload reaches EVM `submitSignedTelemetry`.
   - `ecrecover` reconstructs public address from altered hash and original signature.
   - Recovered address does NOT match custodian address.
   - Transaction reverts with `INVALID_SIGNATURE`.
   - Attack Studio displays alert: *"CRYPTOGRAPHIC FRAUD DETECTED: UNMATCHED SIGNER KEY"*.
3. **Acceptance Proof**: Tampered reading is rejected; ledger remains uncompromised.
