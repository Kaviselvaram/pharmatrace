# Phase 11: Docker Compose Orchestration & Demo Runbook

---

## 1. OBJECTIVE
Package the entire multi-service stack into a turnkey Docker Compose environment and write the comprehensive demonstration runbook mapping directly to the CBS3002 project review slides.

## 2. INPUTS & DEPENDENCIES
- Phases 1 through 10.
- `docs/06-infrastructure/deployment-devops.md`.

## 3. FILES TO CREATE
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `DEMO_RUNBOOK.md`
- `README.md` (Updated master project presentation guide)

## 4. IMPLEMENTATION REQUIREMENTS

### 1. `docker-compose.yml`
- One-command startup orchestrating:
  - `blockchain` (Hardhat node on `:8545`)
  - `backend` (FastAPI on `:8000`)
  - `frontend` (React on `:5173`)
- Includes healthcheck dependencies ensuring backend starts only after the EVM node is ready.

### 2. `DEMO_RUNBOOK.md` (Slide-by-Slide Viva Walkthrough)
- Section 1: Intro & Problem Statement (Slide 3) $\rightarrow$ Show legacy database vulnerability.
- Section 2: Architecture & Virtualized Nodes (Slides 5, 7, 8) $\rightarrow$ Show multi-node live telemetry streaming.
- Section 3: ECDSA Cryptographic Signing (Slides 9, 11) $\rightarrow$ Open Block Explorer, show $(v, r, s)$ parameters and on-chain `ecrecover`.
- Section 4: MITM Tamper Attack (Slide 11) $\rightarrow$ Open Chaos Studio, tamper temperature, observe instant EVM signature rejection.
- Section 5: Cold-Chain Excursion & Self-Healing (Slides 5, 9, 14) $\rightarrow$ Inject compressor failure, watch auto-quarantine and autonomous replacement lot dispatch.
- Section 6: Consumer Trust (Slide 13) $\rightarrow$ Scan medicine QR code on mobile.

## 5. DEFINITION OF DONE
- [ ] Running `docker compose up` starts all three services cleanly without manual intervention.
- [ ] Demo runbook is rehearsed and verified against live running application.
- [ ] README.md contains complete setup instructions, architecture diagrams, and academic submission details.
