import React from "react";
import { Activity, Wind, AlertCircle } from "lucide-react";

export default function TelemetryWaveform({ history, telemetryHistory, lastPacket, minThreshold = 2.0, maxThreshold = 8.0 }) {
  const dataList = Array.isArray(history) ? history : (Array.isArray(telemetryHistory) ? telemetryHistory : []);

  // Waveform rendering bounds: Y-axis from 0°C to 15°C
  const minTempAxis = 0.0;
  const maxTempAxis = 15.0;
  const height = 180;
  const width = 640;
  const paddingX = 40;
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
    <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Activity size={18} color="var(--cyan-primary)" />
          <span className="font-display" style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>
            Real-Time Cold-Chain Telemetry Stream
          </span>
          <span style={{ fontSize: "11px", background: "rgba(0, 255, 136, 0.15)", color: "var(--emerald-success)", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
            2°C – 8°C Safe Zone
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Compressor Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Wind size={15} color={lastPacket?.compressor_active ? "var(--cyan-primary)" : "#64748B"} />
            <span style={{ fontSize: "12px", color: lastPacket?.compressor_active ? "var(--cyan-primary)" : "#64748B", fontWeight: "600" }}>
              Reefer Compressor: {lastPacket?.compressor_active ? "COOLING" : "IDLE"}
            </span>
          </div>

          {/* Attack Indicator */}
          {lastPacket?.attack_mode && lastPacket.attack_mode !== "NONE" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--crimson-dim)", padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255, 0, 85, 0.4)" }}>
              <AlertCircle size={14} color="var(--crimson-alert)" />
              <span className="font-mono" style={{ fontSize: "11px", color: "var(--crimson-alert)", fontWeight: "700" }}>
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
            fill="rgba(0, 255, 136, 0.08)"
            stroke="rgba(0, 255, 136, 0.3)"
            strokeDasharray="4,4"
          />

          {/* Threshold Boundary Lines */}
          <line x1={paddingX} y1={ySafeMax} x2={width - paddingX} y2={ySafeMax} stroke="rgba(255, 0, 85, 0.5)" strokeWidth="1" strokeDasharray="3,3" />
          <text x={paddingX - 35} y={ySafeMax + 4} fill="rgba(255, 0, 85, 0.8)" fontSize="10" fontFamily="var(--font-mono)">8.0°C</text>

          <line x1={paddingX} y1={ySafeMin} x2={width - paddingX} y2={ySafeMin} stroke="rgba(0, 240, 255, 0.5)" strokeWidth="1" strokeDasharray="3,3" />
          <text x={paddingX - 35} y={ySafeMin + 4} fill="rgba(0, 240, 255, 0.8)" fontSize="10" fontFamily="var(--font-mono)">2.0°C</text>

          {/* Telemetry Waveform Polyline */}
          {points && (
            <polyline
              fill="none"
              stroke={isBreach ? "var(--crimson-alert)" : "var(--cyan-primary)"}
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
                fill={isBreach ? "var(--crimson-alert)" : "var(--cyan-primary)"}
                style={{ filter: `drop-shadow(0 0 6px ${isBreach ? "var(--crimson-alert)" : "var(--cyan-primary)"})` }}
              />
              <text
                x={latestX - 15}
                y={latestY - 12}
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {latestTemp.toFixed(2)}°C
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
