import React from "react";
import { Icons } from "../ui/Icons";

export default function MetricCards({ batches = [], lastPacket }) {
  const totalBatches = batches.length;
  const inTransitCount = batches.filter((b) => b.status === "IN_TRANSIT").length;
  const quarantinedCount = batches.filter((b) => b.status === "QUARANTINED").length;
  const deliveredCount = batches.filter((b) => b.status === "DELIVERED").length;

  const currentTemp = lastPacket ? lastPacket.temperature_celsius : 4.5;
  const isBreached = currentTemp > 8.0 || currentTemp < 2.0;
  const isNearLimit = (currentTemp > 7.0 && currentTemp <= 8.0) || (currentTemp < 2.5 && currentTemp >= 2.0);

  let tempColor = "var(--brand-primary)";
  let tempBg = "var(--brand-soft)";
  let tempStatus = "2.0°C – 8.0°C NOMINAL";

  if (isBreached) {
    tempColor = "var(--crimson-alert)";
    tempBg = "var(--crimson-soft)";
    tempStatus = "CRITICAL EXCURSION";
  } else if (isNearLimit) {
    tempColor = "var(--amber-warning)";
    tempBg = "var(--amber-soft)";
    tempStatus = "NEAR BOUNDARY";
  }

  const metrics = [
    {
      title: "Total Registered Lots",
      value: totalBatches,
      subtitle: `${inTransitCount} Active in Transit`,
      icon: Icons.Box,
      color: "var(--brand-primary)",
      bg: "var(--brand-soft)",
    },
    {
      title: "Live Core Temperature",
      value: `${currentTemp.toFixed(2)}°C`,
      subtitle: tempStatus,
      icon: Icons.Thermometer,
      color: tempColor,
      bg: tempBg,
    },
    {
      title: "Monotonic Nonce Checkpoint",
      value: lastPacket ? `#${lastPacket.nonce}` : "#0",
      subtitle: "EIP-191 Verified On-Chain",
      icon: Icons.ShieldCheck,
      color: "var(--emerald-success)",
      bg: "var(--emerald-soft)",
    },
    {
      title: "Quarantined Lots",
      value: quarantinedCount,
      subtitle: quarantinedCount > 0 ? "Replenishment Triggered" : "Zero Breaches Detected",
      icon: quarantinedCount > 0 ? Icons.AlertTriangle : Icons.CheckCircle2,
      color: quarantinedCount > 0 ? "var(--crimson-alert)" : "var(--emerald-success)",
      bg: quarantinedCount > 0 ? "var(--crimson-soft)" : "var(--emerald-soft)",
    },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px",
      marginBottom: "20px",
    }}>
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div key={idx} className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>
                {m.title}
              </span>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                background: m.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: m.color,
              }}>
                <Icon size={17} />
              </div>
            </div>

            <div className="font-display" style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "4px" }}>
              {m.value}
            </div>

            <div style={{ fontSize: "11px", fontWeight: "600", color: m.color }}>
              {m.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
