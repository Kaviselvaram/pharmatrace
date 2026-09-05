# Phase 7: Self-Healing Pipeline & Autonomous Replenishment

---

## 1. OBJECTIVE
Complete the autonomous self-healing logistics pipeline: upon a confirmed smart contract cold-chain excursion, the system automatically quarantines the damaged lot, generates a cryptographically linked replacement batch, and dispatches emergency replenishment without human intervention.

## 2. INPUTS & DEPENDENCIES
- `SelfHealingController.sol` deployed in Phase 1.
- Backend event listener capturing `ColdChainBreach` and `ReplenishmentOrderDispatched`.
- `docs/01-architecture/smart-contracts.md`.

## 3. FILES TO CREATE
- `frontend/src/components/dashboard/QuarantineAlertModal.jsx`
- `frontend/src/components/dashboard/ReplenishmentCard.jsx`
- `backend/app/services/self_healing_service.py`
- `backend/tests/test_self_healing.py`

## 4. IMPLEMENTATION REQUIREMENTS

### 1. Backend Service (`self_healing_service.py`)
- Background listener captures `ColdChainBreach` event from EVM.
- Calls `SelfHealingController.dispatchReplenishment(batchId)`.
- Updates database state: original batch set to `QUARANTINED`, replacement batch registered with status `IN_TRANSIT`.
- Broadcasts high-priority WebSocket alert: `REPLENISHMENT_DISPATCHED`.

### 2. Frontend Visuals
- Full-screen audible or visual alert banner when quarantine occurs.
- Replacement Lot Card appears immediately on dashboard showing:
  - Original Breached Lot ID
  - New Replacement Lot ID
  - Origin Warehouse Depot
  - Updated Hospital Delivery ETA

## 5. TESTING REQUIREMENTS
- Automated test: Trigger $11.5^\circ\text{C}$ excursion $\rightarrow$ Assert original batch status is `QUARANTINED` $\rightarrow$ Assert replacement batch is instantiated on EVM.

## 6. DEFINITION OF DONE
- [ ] End-to-end self-healing executes within 2.0 seconds of temperature breach.
- [ ] UI reflects both the quarantined lot and the newly created replacement lot simultaneously.
