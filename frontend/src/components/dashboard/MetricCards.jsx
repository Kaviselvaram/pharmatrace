import React from "react";
import { Thermometer, ShieldCheck, Box, AlertTriangle } from "lucide-react";

export default function MetricCards({ batches, lastPacket }) {
  const totalBatches = batches.length;
  const inTransitCount = batches.filter((b) => b.status === "IN_TRANSIT").length;
  const quarantinedCount = batches.filter((b) => b.status === "QUARANTINED").length;

  const currentTemp = lastPacket ? lastPacket.temperature_celsius : 4.5;
  const isBreached = currentTemp > 8.0 || currentTemp < 2.0;
  const isNearLimit = (currentTemp > 7.0 && currentTemp <= 8.0) || (currentTemp < 2.5 && currentTemp >= 2.0);

  let tempColor = "var(--cyan-primary)";
  let tempStatus = "OPTIMAL (2°C - 8°C)";
  if (isBreached) {
    tempColor = "var(--crimson-alert)";
    tempStatus = "CRITICAL EXCURSION";
  } else if (isNearLimit) {
    tempColor = "var(--amber-warning)";
    tempStatus = "NEAR THRESHOLD";
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px",
      marginBottom: "20px",
    }}>
      {/* Metric 1: Batches */}
      <div className="glass-panel" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "500" }}>Total Batches</span>
          <Box size={18} color="var(--cyan-primary)" />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span className="font-display" style={{ fontSize: "28px", fontWeight: "700", color: "#FFFFFF" }}>
            {totalBatches}
          </span>
          <span style={{ fontSize: "12px", color: "var(--cyan-primary)" }}>
            {inTransitCount} In Transit
          </span>
        </div>
      </div>

      {/* Metric 2: Live Core Temperature */}
      <div className="glass-panel" style={{ padding: "16px 20px", borderColor: isBreached ? "var(--crimson-alert)" : "var(--border-subtle)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "500" }}>Live Temperature</span>
          <Thermometer size={18} color={tempColor} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <span className="font-mono" style={{ fontSize: "28px", fontWeight: "700", color: tempColor }}>
            {currentTemp.toFixed(2)}°C
          </span>
          <span className="font-mono" style={{ fontSize: "11px", color: tempColor, fontWeight: "600" }}>
            {tempStatus}
          </span>
        </div>
      </div>

      {/* Metric 3: Cryptographic Nonces */}
      <div className="glass-panel" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "500" }}>Signed Checkpoints</span>
          <ShieldCheck size={18} color="var(--emerald-success)" />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span className="font-mono" style={{ fontSize: "28px", fontWeight: "700", color: "#FFFFFF" }}>
            {lastPacket ? `#${lastPacket.nonce}` : "#0"}
          </span>
          <span style={{ fontSize: "12px", color: "var(--emerald-success)" }}>
            secp256k1 Verified
          </span>
        </div>
      </div>

      {/* Metric 4: Quarantined Count */}
      <div className="glass-panel" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "500" }}>Quarantined Batches</span>
          <AlertTriangle size={18} color={quarantinedCount > 0 ? "var(--crimson-alert)" : "var(--emerald-success)"} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span className="font-display" style={{ fontSize: "28px", fontWeight: "700", color: quarantinedCount > 0 ? "var(--crimson-alert)" : "#FFFFFF" }}>
            {quarantinedCount}
          </span>
          <span style={{ fontSize: "12px", color: quarantinedCount > 0 ? "var(--crimson-alert)" : "var(--emerald-success)" }}>
            {quarantinedCount > 0 ? "Replenishment Triggered" : "Zero Breaches"}
          </span>
        </div>
      </div>
    </div>
  );
}
