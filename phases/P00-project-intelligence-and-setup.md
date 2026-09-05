# Phase 0: Project Intelligence, Environment & Foundation Setup

---

## 1. OBJECTIVE
Establish the foundational monorepo structure, initialize Git, configure tooling for Node.js/Hardhat and Python, and establish strict linting and code quality standards.

## 2. CONSTRAINTS
- **Zero Paid Dependencies**: Do NOT configure paid SaaS services or external paid APIs.
- **Python Version**: Standardize on Python 3.13.
- **Node Version**: Standardize on Node.js 22+.
- **Directory Layout**: Strictly follow the layout defined in `PROJECT_SOURCE_OF_TRUTH.md`.

## 3. EXACT TASKS
1. Initialize project root:
   - Create directories: `contracts/`, `backend/`, `frontend/`, `docs/`, `phases/`.
2. Configure `.gitignore`:
   - Ignore `node_modules/`, `artifacts/`, `cache/`, `__pycache__/`, `.env`, `*.db`, `dist/`.
3. Initialize Python virtual environment:
   - Create `backend/requirements.txt` with exact pinned dependencies:
     - `fastapi>=0.115.0`
     - `uvicorn>=0.32.0`
     - `web3>=7.5.0`
     - `eth-account>=0.13.0`
     - `pydantic>=2.10.0`
     - `scikit-learn>=1.6.0`
     - `pytest>=8.3.0`
     - `httpx>=0.28.0`
4. Initialize Node.js & Hardhat setup:
   - In `contracts/`, initialize `package.json`.
   - Install `@nomicfoundation/hardhat-toolbox`, `ethers`, `@openzeppelin/contracts`.

## 4. ACCEPTANCE CRITERIA & DEFINITION OF DONE
- [ ] Directory layout matches the monorepo specification.
- [ ] `PROJECT_SOURCE_OF_TRUTH.md` exists and is referenced in project root.
- [ ] Python packages install without dependency conflicts (`pip install -r backend/requirements.txt`).
- [ ] Hardhat compiles a blank test contract (`npx hardhat compile`).
- [ ] Git repository is initialized with clean working tree.
