# REST Endpoints Specification

---

## 1. BATCH LIFECYCLE MANAGEMENT

### `POST /api/v1/batches`
- **Description**: Mint a new digital twin batch on the EVM ledger and local database.
- **Access**: `MANUFACTURER`
- **Request Body**:
  ```json
  {
    "productName": "COVID-19 mRNA Vaccine Lot B",
    "minTempCelsius": 2.0,
    "maxTempCelsius": 8.0,
    "maxTransitHours": 48
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "batchId": "0x4a9b...f1",
    "productName": "COVID-19 mRNA Vaccine Lot B",
    "currentCustodian": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "status": "CREATED",
    "genesisTxHash": "0x82f1...12"
  }
  ```

### `GET /api/v1/batches`
- **Description**: List all active and historical pharmaceutical batches.
- **Query Params**: `status` (optional), `page` (default 1), `limit` (default 20).

### `GET /api/v1/batches/{batch_id}`
- **Description**: Retrieve detailed batch state, custody history, on-chain event logs, and status.

---

## 2. MULTI-SIG CUSTODY HANDOVER

### `POST /api/v1/handover/initiate`
- **Description**: Current custodian initiates custody transfer to next actor.
- **Request Body**:
  ```json
  {
    "batchId": "0x4a9b...f1",
    "recipientAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  }
  ```

### `POST /api/v1/handover/confirm`
- **Description**: Receiving actor confirms acceptance of custody.
- **Request Body**:
  ```json
  {
    "batchId": "0x4a9b...f1",
    "senderAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }
  ```

---

## 3. SIMULATION & CHAOS CONTROLS

### `POST /api/v1/simulation/start`
- **Description**: Launch background thread simulation for active batches.

### `POST /api/v1/simulation/pause`
- **Description**: Pause transit simulation.

### `POST /api/v1/simulation/attack`
- **Description**: Inject a security anomaly or mechanical failure into the simulation.
- **Request Body**:
  ```json
  {
    "batchId": "0x4a9b...f1",
    "attackType": "COMPRESSOR_FAILURE | MITM_DATA_ALTERATION | GPS_SPOOF | REPLAY_ATTACK",
    "parameters": {
      "targetTemperature": 12.5,
      "alterationDelta": -8.0
    }
  }
  ```

---

## 4. PUBLIC CONSUMER & AUDITOR ENDPOINTS

### `GET /api/v1/verify/{batch_id}`
- **Description**: Public verification query for QR scans. Returns green verification badge or red quarantine notice with mathematical proof.

### `GET /api/v1/audit/{batch_id}/export`
- **Description**: Export full cryptographically verified audit trail as Markdown or PDF.
