# Design System Specification: Obsidian Cyber-Clinical
**CSS Tokens, Visual Hierarchy, Typography & Components**

---

## 1. DESIGN TOKENS (CSS VARIABLES)

```css
:root {
  /* Color Palette - Canvas & Surfaces */
  --bg-canvas: #090C12;
  --bg-surface-primary: #101522;
  --bg-surface-secondary: #161D2F;
  --bg-surface-elevated: #1D263D;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: rgba(0, 240, 255, 0.4);

  /* Semantic Cyber Colors */
  --cyan-primary: #00F0FF;
  --cyan-glow: rgba(0, 240, 255, 0.25);
  --emerald-success: #00FF88;
  --emerald-glow: rgba(0, 255, 136, 0.25);
  --amber-warning: #FFB800;
  --amber-glow: rgba(255, 184, 0, 0.25);
  --crimson-alert: #FF0055;
  --crimson-glow: rgba(255, 0, 85, 0.3);
  --purple-accent: #A855F7;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Glassmorphism & Elevation */
  --glass-bg: rgba(16, 21, 34, 0.75);
  --glass-blur: blur(12px);
  --card-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);

  /* Spacing Scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

---

## 2. ATOMIC COMPONENT SPECIFICATIONS

### 1. `GlassCard`
- Semi-transparent dark background with high-def backdrop blur.
- Subtle $1\text{px}$ perimeter border: `border: 1px solid var(--border-subtle)`.
- Smooth hover transition with glowing accent border.

### 2. `TelemetryWaveform`
- Canvas or SVG based live streaming sparkline.
- Shaded green horizontal band between $2.0^\circ\text{C}$ and $8.0^\circ\text{C}$.
- Dynamic cursor tooltip showing timestamp, exact temperature, and cryptographic block hash.

### 3. `NeonBadge`
- Semantic status pills:
  - `CREATED`: Soft purple pill.
  - `IN_TRANSIT`: Glowing cyan pill with pulsing live beacon.
  - `DELIVERED`: Solid emerald green badge.
  - `QUARANTINED`: Flashing crimson badge with alert icon.
  - `REPLENISHED`: Electric blue badge with link to replacement lot.

### 4. `CryptographicDissector`
- Monospace visualizer breaking down:
  - Raw Keccak-256 Hash
  - ECDSA Parameters: $v$ (recovery ID), $r$ (32 bytes), $s$ (32 bytes)
  - EVM Recovered Public Address vs Registered Custodian Address
