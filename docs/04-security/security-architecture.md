# Security Architecture & Key Management
**Zero-Trust Identity, Key Lifecycle & Static Vulnerability Analysis**

---

## 1. KEY MANAGEMENT LIFECYCLE
Each node in the simulated decentralized network operates an asymmetric Ethereum keypair:
1. **Key Generation**: Generated securely via cryptographically secure random number generators (`os.urandom(32)` $\rightarrow$ `eth_account.Account.create()`).
2. **Key Storage**: Private keys are held strictly in memory within the node process. In production deployments, keys are loaded via isolated environment variables (`.env`). Private keys are **never** returned over API endpoints or sent to the web frontend.
3. **Public Key Registration**: The Ethereum address derived from the public key is registered in `SupplyChainRegistry.sol` on-chain.

---

## 2. SMART CONTRACT SECURITY & STATIC ANALYSIS
To ensure defense-in-depth, all contracts are audited against common EVM vulnerabilities:
- **Reentrancy**: State variables updated *before* external contract calls; OpenZeppelin `ReentrancyGuard` applied on custody and breach handlers.
- **Integer Underflow / Overflow**: Built-in compiler checks in Solidity `^0.8.28`.
- **Slither Static Analysis**: Automated CI pipeline runs `slither contracts/` to assert zero high/critical security findings.
- **Access Control Rigor**: Custom modifiers (`onlyCustodian`, `onlyManufacturer`, `onlyRegistryAdmin`) prevent unauthorized function invocation.
