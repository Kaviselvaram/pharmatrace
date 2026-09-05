# System Architecture Specification
**Five-Layer Decentralized Traceability & Simulation Architecture**

---

## 1. HIGH-LEVEL ARCHITECTURE OVERVIEW

The framework is organized into five decoupled layers, ensuring modularity, security, and zero-cost local execution:

```mermaid
flowchart TB
    subgraph L1["Layer 1: Virtualized Telemetry Engine (Data Generation)"]
        M_EMU["Manufacturer Node (secp256k1 Key)"]
        C_EMU["Transport Carrier Node (secp256k1 Key)"]
        H_EMU["Hospital Node (secp256k1 Key)"]
        PHYS["Thermodynamic Engine: dT/dt = -k(T - T_amb)"]
        GPS_ENG["Waypoint Interpolator (Road Geometries)"]
        PHYS --> C_EMU
        GPS_ENG --> C_EMU
    end

    subgraph L2["Layer 2: Edge Cryptographic Security"]
        HASH["Keccak-256 Hasher"]
        SIGN["ECDSA Signature: (v, r, s)"]
        REPLAY["Nonce & Timestamp Monotonicity Enforcer"]
        C_EMU --> HASH --> SIGN --> REPLAY
    end

    subgraph L3["Layer 3: Application Gateway & Orchestrator"]
        FASTAPI["FastAPI REST & WS Engine"]
        CHAOS["Chaos & Attack Injector"]
        AI_ENG["Thermal Anomaly Predictor"]
        OFF_DB[(Off-Chain SQLite / PostgreSQL)]
        REPLAY --> FASTAPI
        CHAOS -.->|MITM / Excursion| REPLAY
        FASTAPI <--> OFF_DB
        FASTAPI <--> AI_ENG
    end

    subgraph L4["Layer 4: EVM Decentralized Ledger"]
        WEB3["Web3.py Bridge"]
        SC_REG["SupplyChainRegistry.sol"]
        SC_BATCH["BatchManager.sol"]
        SC_VERIF["TelemetryVerifier.sol"]
        SC_CUST["CustodyHandover.sol"]
        SC_HEAL["SelfHealingController.sol"]
        FASTAPI <--> WEB3
        WEB3 --> SC_REG & SC_BATCH & SC_VERIF & SC_CUST & SC_HEAL
    end

    subgraph L5["Layer 5: Presentation & Verification"]
        UI_CMD["Command Center Dashboard"]
        UI_MAP["Live GPS Transit Map"]
        UI_EXPL["Block Ledger Explorer"]
        UI_CHAOS["Chaos Attack Panel"]
        UI_PORTAL["Consumer QR Portal"]
        FASTAPI <==> UI_CMD & UI_MAP & UI_EXPL & UI_CHAOS & UI_PORTAL
    end
```

---

## 2. LAYER SPECIFICATIONS

### Layer 1: Virtualized Telemetry Engine
- Implemented in Python using `asyncio` and worker threads.
- Avoids physical IoT hardware costs while generating realistic data.
- Physics-based sensor model simulates ambient heat transfer, mechanical refrigeration compressor cycling, and vehicle velocity.

### Layer 2: Edge Cryptographic Security
- Every virtual node possesses an isolated private key generated using Ethereum's standard curve (`secp256k1`).
- Payloads are serialized deterministically and hashed using `Keccak-256`.
- Payloads are signed at source; signatures include $(v, r, s)$ parameters compatible with EVM `ecrecover`.

### Layer 3: Application Gateway & Orchestrator
- Python FastAPI framework running on `uvicorn`.
- Exposes RESTful endpoints for batch lifecycle operations and simulation management.
- Exposes WebSocket server for real-time telemetry fan-out to web clients.
- Manages local off-chain database (SQLite) for caching sub-second raw telemetry points.

### Layer 4: EVM Decentralized Ledger
- Runs on a local Hardhat or Anvil node (RPC at `http://127.0.0.1:8545`).
- Executes 5 Solidity smart contracts.
- Provides cryptographic consensus, immutable history, access control, and self-healing state transitions.

### Layer 5: Presentation & Verification
- React 19 + Vite web application styled with custom Obsidian Cyber-Clinical CSS tokens.
- Real-time updates delivered over WebSockets.
- Includes public mobile QR code scanner, live vehicle tracker, and on-chain block explorer.
