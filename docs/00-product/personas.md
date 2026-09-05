# User Personas & Stakeholder Analysis

---

## 1. PERSONA 1: PHARMACEUTICAL QA DIRECTOR
- **Name**: Dr. Elena Vance
- **Organization**: BioVax LifeSciences
- **Role**: Head of Global Quality Assurance & Product Release
- **Demographics**: 44 years old, Ph.D. in Biochemistry, 18 years in pharmaceutical compliance.
- **Goals**:
  - Ensure zero degraded vaccines reach clinical trial sites or hospitals.
  - Automate compliance reporting for FDA/EMA audits.
  - Eliminate paper-based custody records.
- **Pain Points**:
  - Logistics carriers often deliver temperature data weeks late.
  - Hard to prove whether a temperature spike occurred in the warehouse or during road freight.
- **Key User Journey**: Minting a new digital twin batch, defining allowable temperature tolerance bounds (2°C–8°C), cryptographically signing initial factory release.

---

## 2. PERSONA 2: FLEET LOGISTICS OPERATOR
- **Name**: Marcus Sterling
- **Organization**: ColdLogix Freight & Logistics
- **Role**: Fleet Dispatch & Telemetry Operations Manager
- **Demographics**: 36 years old, B.Tech in Supply Chain Engineering.
- **Goals**:
  - Monitor real-time status of 25+ reefer transit vehicles.
  - Receive early alerts if a cooling unit compressor begins to fail.
  - Complete frictionless custody handovers at regional distribution centers.
- **Pain Points**:
  - Traditional GPS trackers don't integrate with temperature loggers.
  - Unjustly blamed for cargo spoilage that occurred before handover.
- **Key User Journey**: Monitoring active transit fleet, executing two-party cryptographic handovers via digital signatures, receiving proactive AI thermal decay warnings.

---

## 3. PERSONA 3: HOSPITAL CHIEF PHARMACIST
- **Name**: Dr. Ananya Sharma
- **Organization**: Apollo Specialty Hospital
- **Role**: Chief of Inpatient Pharmacy
- **Demographics**: 41 years old, Pharm.D.
- **Goals**:
  - Instant verification of medicine integrity upon delivery dock arrival.
  - Zero patient risk from counterfeit or spoiled biological drugs.
  - Automated replacement requests when shipments are rejected.
- **Pain Points**:
  - Manual inspection of temperature loggers is time-consuming and prone to human error.
  - When a shipment is compromised, reordering takes days, leading to stockouts of vital oncology drugs.
- **Key User Journey**: Scanning incoming batch QR code, verifying smart contract clearance, reviewing unbroken cold-chain history, receiving automated replacement dispatch confirmation.

---

## 4. PERSONA 4: REGULATORY COMPLIANCE AUDITOR
- **Name**: Inspector John Davies
- **Organization**: CDSCO / US FDA Division of Compliance
- **Role**: Senior Pharmaceutical Supply Chain Inspector
- **Demographics**: 52 years old, Former Regulatory Attorney & Forensic Auditor.
- **Goals**:
  - Cryptographically verify that temperature logs have not been retroactively altered.
  - Inspect on-chain smart contract execution history.
  - Export tamper-evident audit packages for regulatory enforcement.
- **Pain Points**:
  - Centralized database logs can be doctored by database administrators before inspection.
- **Key User Journey**: Loading the On-Chain Ledger Explorer, inspecting ECDSA signatures against public keys, verifying zero hash discrepancies, exporting compliance certificate.

---

## 5. PERSONA 5: PATIENT / MEDICINE CONSUMER
- **Name**: Aarav Patel
- **Role**: End Consumer / Patient receiving insulin or biologics
- **Demographics**: 29 years old, Tech professional, Type-1 diabetic.
- **Goals**:
  - Personal assurance that expensive insulin has not experienced temperature abuse.
  - Verification that the medication is authentic, not a lethal counterfeit.
- **Pain Points**:
  - No way to know if a vial was left on a hot airport tarmac during shipping.
- **Key User Journey**: Pointing smartphone camera at medicine package QR code $\rightarrow$ viewing instant verification screen showing "VERIFIED SAFE & AUTHENTIC" with cold-chain history.
