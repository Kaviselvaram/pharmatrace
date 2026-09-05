# Phase 6: Chaos Studio & Attack Simulator

---

## 1. OBJECTIVE
Implement the interactive Chaos & Attack Studio allowing evaluators to inject security attacks (MITM data falsification, replay attacks) and mechanical failures (cooling compressor failure, route deviation) and observe cryptographic rejection or state changes in real time.

## 2. INPUTS & DEPENDENCIES
- Backend attack injector API (`POST /api/v1/simulation/attack`).
- `docs/01-architecture/threat-model-stride.md`.

## 3. FILES TO CREATE
- `frontend/src/pages/ChaosStudio.jsx`
- `frontend/src/components/chaos/AttackSelector.jsx`
- `frontend/src/components/chaos/MitmInspector.jsx`
- `frontend/src/components/chaos/TamperDiffViewer.jsx`
- `backend/app/engine/attack_injector.py`

## 4. IMPLEMENTATION REQUIREMENTS

### 1. `attack_injector.py` (Backend)
- Method `inject_compressor_failure(batch_id)`: Disables simulated reefer cooling, letting thermodynamic heat transfer drive temperature upward.
- Method `inject_mitm_alteration(batch_id, altered_temp)`: Modifies payload temperature without re-signing, causing EVM `ecrecover` to fail.
- Method `inject_replay_attack(batch_id)`: Re-submits an earlier signed packet with duplicate nonce.

### 2. `ChaosStudio.jsx` (Frontend)
- Attack Control Center with one-click injection buttons:
  - *"Simulate Compressor Failure"* (Physical Cold-Chain Breach)
  - *"Attempt MITM Log Tampering"* (Cryptographic Integrity Attack)
  - *"Inject Replay Attack"* (Cryptographic Nonce Attack)
- Live Side-by-Side Diff Viewer:
  - Left Panel: Sensor Payload Sent by Node.
  - Right Panel: EVM Recovered Signature & On-Chain Decision (`ACCEPTED` vs `REVERTED: INVALID_SIGNATURE`).

## 5. DEFINITION OF DONE
- [ ] Injecting compressor failure causes temperature on Dashboard to climb and trigger smart contract breach at $8.1^\circ\text{C}$.
- [ ] Injecting MITM alteration triggers immediate EVM transaction revert and displays red cryptographic fraud alert on UI.
