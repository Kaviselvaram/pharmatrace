# Motion System & Micro-Animations

---

## 1. PURPOSE OF MOTION
In this application, motion is not decorative; it communicates real-time security state and system liveness:
- **Liveness Indicators**: Pulsing beacons indicate active node telemetry transmission.
- **State Transition Alerts**: Screen edge alert pulses signal threshold breaches or quarantine transitions.
- **GPS Progress**: Smooth interpolation of vehicle markers along Leaflet polylines.

---

## 2. CSS ANIMATION DEFINITIONS

```css
/* Live Telemetry Beacon Pulse */
@keyframes beacon-pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(0, 240, 255, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 240, 255, 0);
  }
}

/* Breach Flashing Alert */
@keyframes breach-flash {
  0%, 100% {
    border-color: rgba(255, 0, 85, 0.4);
    box-shadow: 0 0 15px rgba(255, 0, 85, 0.2);
  }
  50% {
    border-color: rgba(255, 0, 85, 1);
    box-shadow: 0 0 30px rgba(255, 0, 85, 0.6);
  }
}

/* Smooth Waveform Shimmer */
@keyframes stream-shimmer {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}
```

---

## 3. ACCESSIBILITY & REDUCED MOTION
The application respects user system preferences:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
