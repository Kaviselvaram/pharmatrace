# Phase 4: Frontend Design System & UI Foundations

---

## 1. OBJECTIVE
Initialize the React 19 + Vite frontend, establish the bespoke Obsidian Cyber-Clinical CSS design tokens, build global layouts, navigation shell, and create reusable atomic UI components (GlassCard, NeonBadge, TelemetryGauge).

## 2. INPUTS & DEPENDENCIES
- `docs/02-design/design-system.md`
- `docs/02-design/motion-system.md`
- Node.js 22+

## 3. FILES TO CREATE
- `frontend/src/styles/tokens.css`
- `frontend/src/styles/global.css`
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/common/GlassCard.jsx`
- `frontend/src/components/common/NeonBadge.jsx`
- `frontend/src/components/common/CryptoHashChip.jsx`
- `frontend/src/hooks/useWebSocket.js`
- `frontend/src/App.jsx`
- `frontend/src/main.jsx`

## 4. IMPLEMENTATION REQUIREMENTS
- Configure CSS variables for `--bg-canvas`, `--cyan-primary`, `--crimson-alert`, etc.
- Build responsive sidebar navigation linking:
  - Command Center (`/`)
  - Chaos Attack Studio (`/chaos`)
  - On-Chain Block Explorer (`/explorer`)
  - Regulatory Auditor (`/auditor`)
  - Public Consumer QR Portal (`/verify`)
- Global top bar displaying:
  - EVM Network Status (Connected, Block #, Latency)
  - Active Simulation State (Running / Paused)
  - Role switcher dropdown
- `useWebSocket.js` custom React hook maintaining resilient reconnecting socket to `/ws/telemetry`.

## 5. DEFINITION OF DONE
- [ ] `npm run dev` serves the React application at `http://localhost:5173`.
- [ ] UI displays dark cyber-clinical aesthetic with zero generic unstyled browser defaults.
- [ ] Navigation transitions smoothly between views.
- [ ] WebSocket hook establishes active connection with FastAPI backend.
