# Observability, Telemetry & Logging Architecture

---

## 1. STRUCTURED JSON LOGGING
Both the backend and simulation nodes output high-density JSON logs with standard correlation IDs:
```json
{
  "timestamp": "2026-09-05T19:40:12.182Z",
  "level": "INFO",
  "component": "TelemetryVerifier",
  "batchId": "0x4a9b...f1",
  "action": "SIGNATURE_VERIFIED",
  "signer": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "temperature": 4.35,
  "status": "NOMINAL",
  "txHash": "0x77ab...99"
}
```

---

## 2. REAL-TIME EVM EVENT MONITORING
The backend runs an event listener subscribing to contract events:
- `event BatchCreated(bytes32 indexed batchId, address indexed manufacturer, string productName);`
- `event TelemetryRecorded(bytes32 indexed batchId, int16 temperature, uint32 timestamp, address indexed custodian);`
- `event ColdChainBreach(bytes32 indexed batchId, int16 temperature, uint32 timestamp, address indexed custodian);`
- `event ReplenishmentOrderDispatched(bytes32 indexed originalBatchId, bytes32 indexed replacementBatchId, address indexed hospital);`

These events are immediately captured and broadcast over WebSockets to trigger instantaneous UI updates and audit logs.
