# Testing Strategy & Verification Pyramid

---

## 1. THE TESTING PYRAMID

```text
               /\
              /  \     Level 4: End-to-End Live Chaos Demonstrations
             /----\    Level 3: API Integration & WebSocket Verification
            /------\   Level 2: Smart Contract Hardhat Suite (100% Edge Coverage)
           /--------\  Level 1: Pytest Unit Tests (Physics, Signatures, Nonces)
```

---

## 2. LEVEL SPECIFICATIONS & TOOLS

### Level 1: Unit Tests (`backend/tests/`)
- **Tool**: `pytest`
- **Scope**:
  - Physics equations: Verify thermal decay follows exponential curve under varying insulation coefficients.
  - Serialization: Verify binary packing matches Solidity `abi.encodePacked`.
  - Cryptography: Verify private key generation, Keccak-256 hash output, and signature recovery off-chain.

### Level 2: Smart Contract Tests (`contracts/test/`)
- **Tool**: Hardhat + Chai
- **Coverage Target**: 100% of branch and function paths.
- **Edge Cases**:
  - Exact boundary tests: $1.99^\circ\text{C}$ (reverts/quarantines), $2.00^\circ\text{C}$ (passes), $8.00^\circ\text{C}$ (passes), $8.01^\circ\text{C}$ (reverts/quarantines).
  - Multi-sig custody: Handover fails if counterparty does not sign or if third party intervenes.
  - Replay attack: Submitting previous nonce reverts with exact error string.

### Level 3: Integration Tests (`backend/tests/test_integration.py`)
- **Tool**: `httpx` + `pytest-asyncio`
- **Scope**: FastAPI endpoints communicating with local Hardhat EVM node via Web3.py.
- **Validation**: Contract deployments, batch creations, and event emissions reflect across REST and WebSocket feeds.

### Level 4: E2E Demonstration Verification
- Automated scenario scripts verifying the three primary viva/evaluation journeys (Nominal, Breach/Self-Healing, MITM Attack).
