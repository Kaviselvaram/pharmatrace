# Simulation Engine & Telemetry Modeling
**Physics-Based Thermodynamic Simulation & Virtual Node Orchestration**

---

## 1. THE NEED FOR VIRTUALIZATION
Deploying physical IoT sensors across hundreds of delivery vehicles entails substantial capital costs ($200–$500 per certified calibrated logger) and high maintenance overhead. 

By virtualizing sensor nodes in software, we:
- Save **100% of physical hardware costs** (₹0 / $0 CapEx).
- Achieve identical cryptographic parity (each virtual node signs with real secp256k1 private keys).
- Enable repeatable, automated testing of edge-case failures (compressor breakdowns, deliberate spoofing, MITM tampering).

---

## 2. THERMODYNAMIC SENSOR MODEL
In real reefer (refrigerated) transit vehicles, temperature does not fluctuate randomly; it follows heat transfer principles governed by ambient conditions, container insulation quality, and refrigeration compressor cycling.

### Mathematical Formulation:
Newton's Law of Cooling with active refrigeration hysteresis:

$$\frac{dT}{dt} = -k_{\text{insulation}} \cdot (T(t) - T_{\text{ambient}}) + Q_{\text{cooling}}(t) + \epsilon(t)$$

Where:
- $T(t)$: Internal container temperature at time $t$ (°C).
- $T_{\text{ambient}}$: External ambient temperature (e.g., $32.0^\circ\text{C}$ in tropical transit).
- $k_{\text{insulation}}$: Thermal conductivity coefficient of container walls ($0.02\text{ s}^{-1}$).
- $Q_{\text{cooling}}(t)$: Refrigeration cooling power. Active when $T(t) > 5.2^\circ\text{C}$; turns off when $T(t) < 3.8^\circ\text{C}$ (compressor hysteresis cycle).
- $\epsilon(t)$: Gaussian sensor measurement noise $\mathcal{N}(0, \sigma^2)$ where $\sigma = 0.08^\circ\text{C}$.

```text
Temperature (°C)
  8.0°C ----------------------------------------- MAX THRESHOLD CEILING
        /\        /\        /\
  5.2°C --\------/--\------/--\------------------ Compressor Starts Cooling
           \    /    \    /    \
  3.8°C ----\--/------\--/------\---------------- Compressor Shuts Off
  2.0°C ----------------------------------------- MIN THRESHOLD FLOOR
```

---

## 3. GEOSPATIAL WAYPOINT INTERPOLATION
The simulation engine models actual interstate transit corridors (e.g., Pharma Hub in Hyderabad $\rightarrow$ Distribution Depot in Bengaluru $\rightarrow$ Apollo Hospital in Chennai).

- Waypoints are stored as a polyline array of `[latitude, longitude]` coordinates.
- The simulator moves vehicles along the trajectory with realistic ground velocities ($40\text{ km/h}$ to $80\text{ km/h}$).
- Interpolated coordinates are clamped to geographic boundaries, allowing the UI to render smooth, continuous transit animations on Leaflet maps.
