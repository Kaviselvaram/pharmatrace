# WebSocket Protocol Specification (`/ws/telemetry`)

---

## 1. CONNECTION LIFECYCLE
- **Endpoint**: `ws://127.0.0.1:8000/ws/telemetry`
- **Protocol**: Standard WebSocket (WSS in cloud staging)
- **Heartbeat**: Client/Server ping-pong every 30 seconds.

---

## 2. OUTBOUND EVENT TYPES (SERVER -> CLIENT)

### 2.1 `TELEMETRY_UPDATE`
Broadcast every time a virtual node samples sensor values.
```json
{
  "type": "TELEMETRY_UPDATE",
  "data": {
    "batchId": "0x4a9b...f1",
    "temperature": 4.35,
    "humidity": 49.1,
    "latitude": 12.9812,
    "longitude": 77.6015,
    "timestamp": 1772798410,
    "nonce": 104,
    "signature": {
      "v": 28,
      "r": "0x12ab...99",
      "s": "0xfe33...01"
    },
    "isCommittedOnChain": true,
    "txHash": "0x9812...aa"
  }
}
```

### 2.2 `BLOCK_MINED`
Broadcast when a local EVM block is mined.
```json
{
  "type": "BLOCK_MINED",
  "data": {
    "blockNumber": 145,
    "blockHash": "0x77c1...33",
    "txCount": 2,
    "timestamp": 1772798412
  }
}
```

### 2.3 `COLD_CHAIN_BREACH`
Broadcast immediately upon threshold violation.
```json
{
  "type": "COLD_CHAIN_BREACH",
  "data": {
    "batchId": "0x4a9b...f1",
    "temperature": 11.8,
    "threshold": 8.0,
    "timestamp": 1772798425,
    "txHash": "0xaa11...55"
  }
}
```

### 2.4 `REPLENISHMENT_DISPATCHED`
Broadcast when self-healing logic creates replacement batch.
```json
{
  "type": "REPLENISHMENT_DISPATCHED",
  "data": {
    "originalBatchId": "0x4a9b...f1",
    "replacementBatchId": "0x5b0c...a2",
    "hospital": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "urgency": "HIGH"
  }
}
```
