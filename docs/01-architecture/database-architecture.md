# Database Architecture (On-Chain vs Off-Chain Storage)
**Hybrid Ledger & Off-Chain Time-Series Cache**

---

## 1. ON-CHAIN VS OFF-CHAIN STORAGE STRATEGY

Storing every sensor reading (every 2 seconds) directly on a public or private blockchain creates unsustainable bloat, slow indexing, and high gas costs. 

Following the 2025 research identified in the project presentation (*"IoT + Cloud On-Chain Traceability: Edge & cloud cache heavy telemetry, then verify on-chain"*), this framework implements a **hybrid data architecture**:

```text
┌──────────────────────────────────────────────┐
│ OFF-CHAIN STORE (SQLite / PostgreSQL)        │
│ - High-frequency time-series telemetry       │
│ - Sub-second sensor logs (temp, humidity)    │
│ - GPS coordinate trails & route history      │
│ - Node configurations & transient state      │
└──────────────────────┬───────────────────────┘
                       │ Periodic Merkle / Hash Anchor & State Events
                       ▼
┌──────────────────────────────────────────────┐
│ ON-CHAIN LEDGER (EVM Smart Contracts)        │
│ - Batch Genesis & Immutable Threshold Bounds │
│ - Cryptographic Signatures (v, r, s)         │
│ - Periodic State Commitments (Hashes)        │
│ - Threshold Violations & Breach Events       │
│ - Multi-Sig Custody Handover Records         │
│ - Quarantine & Self-Healing Triggers         │
└──────────────────────────────────────────────┘
```

---

## 2. RELATIONAL SCHEMA (SQLITE / POSTGRESQL)

```sql
-- 1. Registered Actors & Nodes
CREATE TABLE actors (
    eth_address VARCHAR(42) PRIMARY KEY,
    organization_name VARCHAR(120) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK(role IN ('MANUFACTURER', 'DISTRIBUTOR', 'CARRIER', 'HOSPITAL', 'AUDITOR')),
    public_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pharmaceutical Batches
CREATE TABLE batches (
    batch_id VARCHAR(66) PRIMARY KEY, -- 0x + 64 hex chars
    product_name VARCHAR(120) NOT NULL,
    manufacturer_address VARCHAR(42) REFERENCES actors(eth_address),
    current_custodian VARCHAR(42) REFERENCES actors(eth_address),
    min_temp_celsius REAL NOT NULL,
    max_temp_celsius REAL NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    replacement_batch_id VARCHAR(66) NULL,
    genesis_tx_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Time-Series Telemetry Cache
CREATE TABLE telemetry_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id VARCHAR(66) REFERENCES batches(batch_id),
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    nonce INTEGER NOT NULL,
    payload_hash VARCHAR(66) NOT NULL,
    signature_v INTEGER NOT NULL,
    signature_r VARCHAR(66) NOT NULL,
    signature_s VARCHAR(66) NOT NULL,
    is_committed_on_chain BOOLEAN DEFAULT FALSE,
    on_chain_tx_hash VARCHAR(66) NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Custody Handover Events
CREATE TABLE custody_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id VARCHAR(66) REFERENCES batches(batch_id),
    from_actor VARCHAR(42) REFERENCES actors(eth_address),
    to_actor VARCHAR(42) REFERENCES actors(eth_address),
    handover_tx_hash VARCHAR(66) NOT NULL,
    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Security & Excursion Alerts
CREATE TABLE security_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id VARCHAR(66) REFERENCES batches(batch_id),
    alert_type VARCHAR(40) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    tx_hash VARCHAR(66) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance querying
CREATE INDEX idx_telemetry_batch ON telemetry_records(batch_id, timestamp);
CREATE INDEX idx_batches_custodian ON batches(current_custodian);
CREATE INDEX idx_alerts_batch ON security_alerts(batch_id);
```
