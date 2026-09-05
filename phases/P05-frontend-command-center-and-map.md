# Phase 5: Frontend Command Center & Live Transit Map

---

## 1. OBJECTIVE
Implement the primary operational dashboard: real-time animated temperature waveform graph, interactive Leaflet transit map showing live moving vehicles, active batch inventory table, and custody handover modals.

## 2. INPUTS & DEPENDENCIES
- Phase 3 backend WebSocket telemetry stream.
- Phase 4 layout and design system.
- `docs/02-design/ux-strategy.md`.

## 3. FILES TO CREATE
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/components/dashboard/MetricCards.jsx`
- `frontend/src/components/dashboard/TelemetryWaveform.jsx`
- `frontend/src/components/dashboard/TransitMap.jsx`
- `frontend/src/components/dashboard/ActiveBatchesTable.jsx`
- `frontend/src/components/dashboard/HandoverModal.jsx`

## 4. IMPLEMENTATION REQUIREMENTS

### 1. `TelemetryWaveform.jsx`
- Canvas or SVG-based real-time line chart updating on incoming WebSocket frames.
- Green highlighted region spanning $2.0^\circ\text{C}$ to $8.0^\circ\text{C}$.
- Dynamic color transitions:
  - Cyan for $2.5^\circ\text{C} \le T \le 7.0^\circ\text{C}$.
  - Amber for $7.0^\circ\text{C} < T \le 8.0^\circ\text{C}$ (approaching ceiling).
  - Crimson for $T > 8.0^\circ\text{C}$ or $T < 2.0^\circ\text{C}$ (breach).

### 2. `TransitMap.jsx`
- Integrated Leaflet map utilizing free OpenStreetMap tiles.
- Custom styled vehicle markers with pulsing beacon halos.
- Color-coded polyline breadcrumbs trailing behind active vehicles.

### 3. `ActiveBatchesTable.jsx`
- Displays active batches, product name, current custodian, temperature, status badge.
- Clicking a row opens detailed lineage view and custody handover modal.

## 5. DEFINITION OF DONE
- [ ] Real-time telemetry frames render smoothly on the waveform chart ($\ge 30\text{ fps}$).
- [ ] Vehicle marker smoothly animates across Leaflet map along interstate highway waypoints.
- [ ] Custody handover modal allows simulating transfer between Carrier and Hospital with dual signatures.
