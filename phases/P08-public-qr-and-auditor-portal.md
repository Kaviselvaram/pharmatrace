# Phase 8: Public Consumer QR Portal & Regulatory Inspector

---

## 1. OBJECTIVE
Build the consumer-facing mobile QR verification portal enabling patients and pharmacists to scan batch QR codes to verify authenticity, and build the regulatory auditor portal for exporting 21 CFR Part 11 compliant audit packages.

## 2. INPUTS & DEPENDENCIES
- `GET /api/v1/verify/{batch_id}` and `GET /api/v1/audit/{batch_id}/export`.
- `docs/04-security/audit-compliance.md`.

## 3. FILES TO CREATE
- `frontend/src/pages/VerifyPortal.jsx`
- `frontend/src/pages/AuditorView.jsx`
- `frontend/src/components/portal/QRScannerMock.jsx`
- `frontend/src/components/portal/VerificationCertificate.jsx`
- `backend/app/services/audit_reporter.py`

## 4. IMPLEMENTATION REQUIREMENTS

### 1. `VerifyPortal.jsx` (Mobile-Friendly Consumer View)
- Responsive layout styled like a mobile application.
- Supports selecting from active batches or scanning camera stream.
- Queries blockchain:
  - If status == `DELIVERED` & breaches == 0: Green Certificate (*"AUTHENTIC & COLD-CHAIN VERIFIED"*).
  - If status == `QUARANTINED`: Red Warning (*"DO NOT ADMINISTER: TEMPERATURE BREACH DETECTED"*).
  - Displays interactive temperature history timeline.

### 2. `AuditorView.jsx` (Regulatory Inspector)
- Searchable by Batch ID or Ethereum Tx Hash.
- Detailed cryptographic proof table: Block Number, Timestamp, Node Address, ECDSA Signature ($v, r, s$), Keccak Hash.
- *"Export Compliance PDF / Markdown"* button generating formal audit package.

## 5. DEFINITION OF DONE
- [ ] Scanning nominal batch displays green verification badge with full transit provenance.
- [ ] Scanning breached batch displays red quarantine warning with exact excursion timestamp.
- [ ] Auditor view exports full markdown compliance report with zero missing data fields.
