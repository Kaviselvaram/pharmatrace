import React from "react";
import TelemetryWaveform from "./TelemetryWaveform";
import TransitMap from "./TransitMap";
import { Icons } from "../ui/Icons";

export default function MonitoringView({
  batches = [],
  activeBatchId,
  onSelectBatch,
  isSimulationRunning,
  onStartSimulation,
  onPauseSimulation,
  lastPacket,
  telemetryHistory = [],
  isConnected,
}) {
  const selectedBatch = batches.find((b) => b.batch_id === activeBatchId) || batches[0];
  const currentTemp = lastPacket?.temperature_celsius ?? 4.5;
  const isBreach = currentTemp > 8.0 || currentTemp < 2.0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "32px" }}>
      {/* Top Operations Header */}
      <div
        className="dash-card"
        style={{
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isConnected ? "var(--dash-green-pill-text)" : "var(--dash-red-pill-text)",
                boxShadow: isConnected ? "0 0 8px var(--dash-green-pill-text)" : "none",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: isConnected ? "var(--dash-green-pill-text)" : "var(--dash-red-pill-text)",
                letterSpacing: "0.5px",
              }}
            >
              {isConnected ? "WEBSOCKET STREAM ACTIVE (/ws/telemetry)" : "TELEMETRY DISCONNECTED"}
            </span>
          </div>
          <h2 className="font-display" style={{ fontSize: "22px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            Live Telemetry Operations
          </h2>
          <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", marginTop: "2px" }}>
            Cryptographic sensor stream emitted from edge virtualized reefer nodes on interstate corridors.
          </p>
        </div>

        {/* Target Batch Selector and Simulation Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>Target lot:</span>
            <select
              value={selectedBatch?.batch_id || ""}
              onChange={(e) => onSelectBatch(e.target.value)}
              style={{
                background: "#18191E",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text-primary)",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none",
                maxWidth: "200px",
              }}
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.product_name} ({b.status})
                </option>
              ))}
            </select>
          </div>

          {selectedBatch && (
            <button
              className={`dash-pill-btn ${isSimulationRunning ? "" : "white-action"}`}
              onClick={() => {
                if (isSimulationRunning) {
                  onPauseSimulation(selectedBatch.batch_id);
                } else {
                  onStartSimulation(selectedBatch.batch_id);
                }
              }}
            >
              {isSimulationRunning ? <Icons.Pause size={13} /> : <Icons.Play size={13} />}
              <span>{isSimulationRunning ? "Pause Stream" : "Start Live Stream"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sensor Metric Cards Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {/* Metric: Core Temp */}
        <div className="dash-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>Core Temp</span>
            <button className="circle-arrow-btn">
              <Icons.Thermometer size={14} color={isBreach ? "#EF4444" : "var(--dash-blue-accent)"} />
            </button>
          </div>
          <div className="font-mono" style={{ fontSize: "26px", fontWeight: "700", color: isBreach ? "#EF4444" : "var(--dash-text-primary)" }}>
            {currentTemp.toFixed(2)}°C
          </div>
          <div style={{ marginTop: "6px" }}>
            <span className={`dash-change-pill ${isBreach ? "negative" : "positive"}`}>
              {isBreach ? "EXCURSION DETECTED" : "NOMINAL RANGE"}
            </span>
          </div>
        </div>

        {/* Metric: Ambient Temperature */}
        <div className="dash-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>Ambient Weather</span>
            <button className="circle-arrow-btn">
              <Icons.Sun size={14} color="var(--dash-cat-yellow-bg)" />
            </button>
          </div>
          <div className="font-mono" style={{ fontSize: "26px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            {lastPacket?.ambient_temp_celsius ? `${lastPacket.ambient_temp_celsius.toFixed(1)}°C` : "34.2°C"}
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--dash-text-muted)" }}>
            External Heat Transfer
          </div>
        </div>

        {/* Metric: Reefer Compressor */}
        <div className="dash-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>Chiller Compressor</span>
            <button className="circle-arrow-btn">
              <Icons.Wind size={14} color={lastPacket?.compressor_active ? "var(--dash-blue-accent)" : "var(--dash-text-muted)"} />
            </button>
          </div>
          <div className="font-display" style={{ fontSize: "26px", fontWeight: "700", color: lastPacket?.compressor_active ? "var(--dash-blue-accent)" : "var(--dash-text-primary)" }}>
            {lastPacket?.compressor_active ? "ACTIVE" : "STANDBY"}
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--dash-text-muted)" }}>
            PID Thermodynamic Loop
          </div>
        </div>

        {/* Metric: Battery & Signal */}
        <div className="dash-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>Sensor Battery</span>
            <button className="circle-arrow-btn">
              <Icons.Activity size={14} color="var(--dash-green-pill-text)" />
            </button>
          </div>
          <div className="font-mono" style={{ fontSize: "26px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            {lastPacket?.battery_level ? `${lastPacket.battery_level.toFixed(0)}%` : "98%"}
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--dash-green-pill-text)" }}>
            Nominal Lithium Voltage
          </div>
        </div>
      </div>

      {/* Real-Time Waveform Center */}
      <TelemetryWaveform
        history={telemetryHistory}
        lastPacket={lastPacket}
        minThreshold={2.0}
        maxThreshold={8.0}
      />

      {/* Route Map & Raw Packet Inspector Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "18px" }}>
        <TransitMap lastPacket={lastPacket} height="280px" />

        {/* Raw Ingress Telemetry Packet Inspector */}
        <div className="dash-card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icons.Cpu size={16} color="var(--dash-blue-accent)" />
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)" }}>Raw Edge Packet Stream</h4>
            </div>
            <span className="font-mono" style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              78-Byte Canonical Layout
            </span>
          </div>

          <pre
            style={{
              flex: 1,
              background: "#101115",
              padding: "14px",
              borderRadius: "var(--radius-md)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              overflowX: "auto",
              border: "1px solid var(--dash-border)",
              color: "#34D399",
              lineHeight: "1.5",
            }}
          >
            {lastPacket
              ? JSON.stringify(lastPacket, null, 2)
              : "// Waiting for live telemetry packet stream...\n// Click 'Start Live Stream' above to stream from reefer node."}
          </pre>
        </div>
      </div>
    </div>
  );
}
