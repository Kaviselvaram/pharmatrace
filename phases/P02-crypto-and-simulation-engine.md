# Phase 2: Cryptographic Signing & Simulation Engine

---

## 1. OBJECTIVE
Implement the Python multi-threaded simulation engine modeling realistic thermodynamic temperature decay, interstate GPS routing, and edge ECDSA secp256k1 payload signing with nonces and Keccak-256 hashes.

## 2. INPUTS & DEPENDENCIES
- `docs/01-architecture/simulation-engine.md`
- `docs/01-architecture/cryptography-spec.md`
- Python environment with `web3`, `eth-account`, `pytest`.

## 3. FILES TO CREATE
- `backend/app/engine/telemetry_node.py`
- `backend/app/engine/simulator.py`
- `backend/app/engine/routes.py`
- `backend/app/core/security.py`
- `backend/tests/test_simulation_engine.py`

## 4. IMPLEMENTATION REQUIREMENTS

### 1. `telemetry_node.py`
- Class `VirtualizedNode`:
  - Holds `private_key` and derived `ethereum_address`.
  - Maintains `current_nonce`.
  - Method `sign_telemetry_payload(batch_id, temperature, latitude, longitude, timestamp)`:
    - Encodes payload to canonical binary format matching Solidity `abi.encodePacked`.
    - Generates Keccak-256 hash.
    - Signs with `eth_account.Account.sign_message`.
    - Returns `(v, r, s)` alongside raw payload.

### 2. `simulator.py`
- Class `TransitSimulator`:
  - Runs in a background `asyncio` loop or worker thread.
  - Implements thermodynamic formula:
    $$\frac{dT}{dt} = -k(T - T_{\text{ambient}}) + Q_{\text{cooling}}$$
  - Implements compressor hysteresis cycle ($3.8^\circ\text{C}$ to $5.2^\circ\text{C}$).
  - Interpolates GPS coordinates along route waypoints defined in `routes.py`.
  - Fires callback on each generated telemetry reading.

### 3. `routes.py`
- Pre-configured realistic geographic coordinates for demonstration corridors:
  - Route A: Hyderabad Pharma City $\rightarrow$ Bangalore Electronic City $\rightarrow$ Chennai Apollo Hospital.

## 5. TESTING REQUIREMENTS
- Verify that `eth-account` generated signatures can be verified in Python via `Account.recover_message` and yield the exact node address.
- Verify that temperature remains within $2.0^\circ\text{C}$ to $8.0^\circ\text{C}$ in nominal mode.
- Verify that nonces strictly increment by 1 on each successive reading.

## 6. DEFINITION OF DONE
- [ ] `pytest backend/tests/test_simulation_engine.py` passes with zero failures.
- [ ] Simulation engine can run for 60 seconds generating valid signed telemetry packets with zero crashes.
