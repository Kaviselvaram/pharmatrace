# UX Strategy & Information Architecture

---

## 1. UX DESIGN PHILOSOPHY: CYBER-CLINICAL PALETTE
The interface bridges two distinct aesthetics:
- **Enterprise Cyber Defense**: Dark, futuristic, high-contrast command center inspired by security operation centers (SOC) and hardware diagnostic consoles.
- **Clinical Pharmaceutical Rigor**: Clean, crisp typography, unmistakable status badges (Nominal, Breach, Quarantined), and mathematical audit trails.

---

## 2. INFORMATION ARCHITECTURE & NAVIGATION

```text
[Main Application View]
├── 1. Top Global Navigation Bar
│   ├── Network Status Indicator (Local Hardhat EVM · Block #142 · 12ms)
│   ├── Active Simulated Nodes Ticker (Manufacturer, ColdLogix, Apollo Hospital)
│   └── Current Active Role Switcher (QA Director, Carrier, Pharmacist, Auditor)
│
├── 2. Primary Navigation Views
│   ├── [Dashboard / Command Center] (Default)
│   │   ├── Metric Counters (Active Batches, Fleet In-Transit, Breaches Prevented)
│   │   ├── Real-Time Telemetry Waveform (Canvas live 2°C–8°C envelope)
│   │   ├── Interactive Live Transit Map (Leaflet GPS trails & animated markers)
│   │   └── Active Batch Inventory Table
│   │
│   ├── [Chaos & Attack Studio]
│   │   ├── Attack Scenario Injector (MITM, Compressor Breakdown, GPS Spoof)
│   │   ├── Raw Telemetry vs On-Chain Verification Diff Inspector
│   │   └── Active Threat Status Log
│   │
│   ├── [On-Chain Block Explorer]
│   │   ├── Real-Time Block Stream
│   │   ├── Transaction Hash Inspector
│   │   └── Cryptographic Signature Dissector (ecrecover demo widget)
│   │
│   ├── [Regulatory Audit Inspector]
│   │   ├── Batch Provenance Search
│   │   ├── Cryptographic Hash Verifier
│   │   └── One-Click FDA/CDSCO Report Export
│   │
│   └── [Public Consumer QR Verification Portal]
│       ├── Mobile QR Camera Scanner / File Upload
│       ├── Batch Cold-Chain Authenticity Verification Certificate
│       └── Temperature Excursion Timeline Proof
```

---

## 3. USER INTERACTION PRINCIPLES
- **Sub-Second Feedback**: Any telemetry reading or state change immediately updates the waveform, map marker, and block feed without manual page refresh.
- **Visual Color-Coded Safety Envelope**: The temperature graph prominently shows the $2.0^\circ\text{C}$ to $8.0^\circ\text{C}$ green safe zone. The line color changes smoothly from Cyan (nominal) to Amber ($7.5^\circ\text{C}$ warning) to Neon Crimson ($>8.0^\circ\text{C}$ breach).
- **One-Click Attack Demos**: Evaluators and reviewers can click single buttons (*"Cut Compressor Cooling"*, *"Tamper Packet Payload"*) and watch the entire cryptographic pipeline react in real time.
