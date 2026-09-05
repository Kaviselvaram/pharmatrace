# Zero-Cost Production Strategy & Cost Matrix

---

## 1. COMPONENT-BY-COMPONENT ZERO-COST BREAKDOWN

| Architecture Component | Open-Source / Free Provider | Monthly Cost | Free-Tier Limitations | Mitigation Strategy |
| :--- | :--- | :---: | :--- | :--- |
| **Blockchain Node** | Hardhat Local EVM Node | **₹0.00** | Runs locally in memory | Instant mining, unlimited test ETH, works completely offline. |
| **Backend & Engine** | FastAPI + Python 3.13 | **₹0.00** | Bound only by host CPU/RAM | Lightweight async architecture consumes $<150\text{MB}$ RAM. |
| **Frontend Framework**| React 19 + Vite | **₹0.00** | Open source MIT license | Zero license costs. |
| **Off-Chain Database** | SQLite (or Neon Postgres) | **₹0.00** | Neon: 0.5GB limit; SQLite: Local file | Local SQLite file eliminates cloud database bills entirely. |
| **Mapping Engine** | Leaflet.js + OpenStreetMap | **₹0.00** | OSM public tile rate limits | Standard CDN tile caching, zero Google Maps API charges. |
| **AI Predictive Model**| Scikit-learn (Polynomial Ridge) | **₹0.00** | None (runs local in-process) | Sub-millisecond local CPU execution. |
| **Auditor AI Assistant**| Google Gemini 1.5 Flash | **₹0.00** | 15 req/min, 1M tokens/min | Deterministic local template engine fallback if rate limit hit. |
| **Containerization** | Docker Community Edition | **₹0.00** | Open source | Standard local developer tooling. |
| **Code Hosting & CI** | GitHub & GitHub Actions | **₹0.00** | 2,000 CI minutes/month | Free tier provides ample capacity for automated test runs. |

**TOTAL MONTHLY OPERATIONAL EXPENDITURE: ₹0.00 / $0.00**
