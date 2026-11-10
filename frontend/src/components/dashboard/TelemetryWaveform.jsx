import React from "react";
import { Icons } from "../ui/Icons";

export default function TelemetryWaveform({
  history,
  telemetryHistory,
  lastPacket,
  minThreshold = 2.0,
  maxThreshold = 8.0,
  compact = false,
}) {
  const dataList = Array.isArray(history) ? history : (Array.isArray(telemetryHistory) ? telemetryHistory : []);

  // Waveform rendering bounds: Y-axis from 0°C to 15°C
  const minTempAxis = 0.0;
  const maxTempAxis = 15.0;
  const height = compact ? 140 : 200;
  const width = 640;
  const paddingX = 44;
  const paddingY = 20;

  function tempToY(temp) {
    const clamped = Math.max(minTempAxis, Math.min(maxTempAxis, temp));
    const normalized = (clamped - minTempAxis) / (maxTempAxis - minTempAxis);
    return height - paddingY - normalized * (height - 2 * paddingY);
  }

  const ySafeMin = tempToY(minThreshold);
  const ySafeMax = tempToY(maxThreshold);
  const safeHeight = Math.abs(ySafeMin - ySafeMax);

  // Generate SVG polyline points
  const points = dataList.map((item, idx) => {
    const x = paddingX + (idx / Math.max(1, dataList.length - 1)) * (width - 2 * paddingX);
    const y = tempToY(item.temperature_celsius);
    return `${x},${y}`;
  }).join(" ");

  const latestTemp = lastPacket?.temperature_celsius ?? (dataList.length > 0 ? dataList[dataList.length - 1].temperature_celsius : 4.5);
  const latestX = dataList.length > 0
    ? paddingX + ((dataList.length - 1) / Math.max(1, dataList.length - 1)) * (width - 2 * paddingX)
    : paddingX;
  const latestY = tempToY(latestTemp);

  const isBreach = latestTemp > maxThreshold || latestTemp < minThreshold;

  return (
    <div className="dash-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icons.Activity size={18} color="var(--dash-blue-accent)" />
          <span className="font-display" style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            Cold-Chain Telemetry Waveform
          </span>
          <span style={{
            fontSize: "11px",
            background: "var(--dash-green-pill-bg)",
            color: "var(--dash-green-pill-text)",
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            fontWeight: "600",
          }}>
            2.0°C – 8.0°C SAFE ZONE
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Compressor Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Icons.Wind size={15} color={lastPacket?.compressor_active ? "var(--dash-blue-accent)" : "var(--dash-text-muted)"} />
            <span style={{ fontSize: "12px", color: lastPacket?.compressor_active ? "var(--dash-blue-accent)" : "var(--dash-text-muted)", fontWeight: "600" }}>
              Compressor: {lastPacket?.compressor_active ? "COOLING" : "IDLE"}
            </span>
          </div>

          {/* Attack Indicator */}
          {lastPacket?.attack_mode && lastPacket.attack_mode !== "NONE" && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "var(--dash-red-pill-bg)",
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
            }}>
              <Icons.AlertTriangle size={13} color="var(--dash-red-pill-text)" />
              <span className="font-mono" style={{ fontSize: "10px", color: "var(--dash-red-pill-text)", fontWeight: "700" }}>
                CHAOS: {lastPacket.attack_mode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Waveform */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: `${height}px`, display: "block" }}>
          {/* Shaded Safe Envelope (2°C to 8°C) */}
          <rect
            x={paddingX}
            y={ySafeMax}
            width={width - 2 * paddingX}
            height={safeHeight}
            fill="rgba(52, 211, 153, 0.08)"
            stroke="rgba(52, 211, 153, 0.3)"
            strokeDasharray="4,4"
          />

          {/* Threshold Boundary Lines */}
          <line x1={paddingX} y1={ySafeMax} x2={width - paddingX} y2={ySafeMax} stroke="#EF4444" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
          <text x={paddingX - 40} y={ySafeMax + 4} fill="#EF4444" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">8.0°C</text>

          <line x1={paddingX} y1={ySafeMin} x2={width - paddingX} y2={ySafeMin} stroke="#6E97F6" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
          <text x={paddingX - 40} y={ySafeMin + 4} fill="#6E97F6" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">2.0°C</text>

          {/* Zero degree reference line */}
          <line x1={paddingX} y1={tempToY(0)} x2={width - paddingX} y2={tempToY(0)} stroke="var(--dash-border)" strokeWidth="1" />

          {/* Telemetry Waveform Polyline */}
          {points && (
            <polyline
              fill="none"
              stroke={isBreach ? "#EF4444" : "var(--dash-blue-bar)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          )}

          {/* Pulsing Live Head Point */}
          {dataList.length > 0 && (
            <g>
              <circle
                cx={latestX}
                cy={latestY}
                r="6"
                fill={isBreach ? "#EF4444" : "var(--dash-blue-accent)"}
              />
              <circle
                cx={latestX}
                cy={latestY}
                r="10"
                fill="none"
                stroke={isBreach ? "#EF4444" : "var(--dash-blue-accent)"}
                strokeWidth="1.5"
                opacity="0.5"
              />
              <rect
                x={latestX - 25}
                y={latestY - 26}
                width="50"
                height="18"
                rx="4"
                fill="#FFFFFF"
              />
              <text
                x={latestX}
                y={latestY - 14}
                fill="#0C0D11"
                fontSize="10"
                fontWeight="700"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {latestTemp.toFixed(2)}°C
              </text>
            </g>
          )}
        </svg>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "11px", color: "var(--dash-text-muted)" }}>
        <span>Sampling Rate: 1.0s Edge Sensor Heartbeat</span>
        <span>Replay Nonce: #{lastPacket ? lastPacket.nonce : 0}</span>
      </div>
    </div>
  );
}
