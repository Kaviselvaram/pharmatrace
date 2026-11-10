import React, { useState } from "react";
import { Icons } from "../ui/Icons";
import { api } from "../../services/api";

export default function ChaosStudio({
  activeBatchId,
  batches = [],
  onSelectBatch,
  isSimulationRunning,
  onStartSimulation,
  lastPacket,
  onAttackInjected,
}) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const selectedBatch = batches.find((b) => b.batch_id === activeBatchId) || batches[0];
  const currentBatchId = activeBatchId || selectedBatch?.batch_id;

  async function handleInject(attackType, tamperDelta = -8.0) {
    if (!currentBatchId) {
      setStatusMessage({ type: "error", text: "Please select or create a batch lot first!" });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      if (!isSimulationRunning && onStartSimulation) {
        await onStartSimulation(currentBatchId);
        await new Promise((r) => setTimeout(r, 600));
      }

      await api.injectAttack({
        batch_id: currentBatchId,
        attack_type: attackType,
        tamper_delta: tamperDelta,
      });
      setStatusMessage({ type: "success", text: `Attack scenario injected: ${attackType}` });
      if (onAttackInjected) onAttackInjected(attackType);
    } catch (e) {
      setStatusMessage({ type: "error", text: e.message || "Failed to trigger attack scenario." });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!currentBatchId) return;
    setLoading(true);
    try {
      await api.resetAttacks(currentBatchId);
      setStatusMessage({ type: "info", text: "Simulated physics reset to nominal operating parameters." });
    } catch (e) {
      setStatusMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", paddingBottom: "32px" }}>
      {/* Left: Controlled Security Laboratory Console */}
      <div className="dash-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Icons.Zap size={22} color="var(--dash-cat-peach-bg)" />
          <h2 className="font-display" style={{ fontSize: "18px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            Adversarial Security & Chaos Laboratory
          </h2>
        </div>
        <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", marginBottom: "20px" }}>
          Execute controlled adversarial fault injection to verify non-repudiation, signature validation, and automated smart contract quarantine.
        </p>

        {/* Target Batch Selector & Simulation State Bar */}
        <div
          style={{
            background: "#18191E",
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--dash-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600" }}>Target lot:</span>
            <select
              value={currentBatchId || ""}
              onChange={(e) => onSelectBatch && onSelectBatch(e.target.value)}
              style={{
                background: "#222329",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text-primary)",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "12px",
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

          <button
            className="dash-pill-btn"
            onClick={handleReset}
            disabled={loading}
          >
            <Icons.RotateCcw size={13} />
            <span>Restore Nominal Physics</span>
          </button>
        </div>

        {/* Feedback message banner */}
        {statusMessage && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: statusMessage.type === "error" ? "var(--dash-red-pill-bg)" : "rgba(79, 128, 248, 0.15)",
              color: statusMessage.type === "error" ? "var(--dash-red-pill-text)" : "var(--dash-blue-accent)",
              fontSize: "12px",
              marginBottom: "16px",
              border: `1px solid ${statusMessage.type === "error" ? "rgba(239, 68, 68, 0.4)" : "rgba(79, 128, 248, 0.3)"}`,
            }}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Scenarios Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Scenario 1: MITM Tampering */}
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--dash-border)",
              background: "#18191E",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <Icons.ShieldAlert size={16} color="var(--dash-red-pill-text)" />
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)" }}>MITM Telemetry Tampering</span>
                <span className="dash-status-badge await">ATTACK</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", margin: 0 }}>
                Corrupts payload bits in transit while preserving original signature.
              </p>
            </div>
            <button
              className="dash-pill-btn"
              style={{ background: "rgba(239, 68, 68, 0.2)", color: "var(--dash-red-pill-text)", borderColor: "rgba(239, 68, 68, 0.4)" }}
              onClick={() => handleInject("MITM_ALTERATION", -8.0)}
              disabled={loading}
            >
              <span>Inject MITM</span>
            </button>
          </div>

          {/* Scenario 2: Heat Excursion */}
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--dash-border)",
              background: "#18191E",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <Icons.Thermometer size={16} color="var(--dash-cat-peach-bg)" />
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)" }}>Compressor Failure (Heat Breach)</span>
                <span className="dash-status-badge created">EXCURSION</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", margin: 0 }}>
                Simulates chiller loss, causing temperature to rise above 8.00°C boundary.
              </p>
            </div>
            <button
              className="dash-pill-btn white-action"
              onClick={() => handleInject("COMPRESSOR_FAILURE", 12.0)}
              disabled={loading}
            >
              <span>Trigger Excursion</span>
            </button>
          </div>

          {/* Scenario 3: Extreme Freeze Breach */}
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--dash-border)",
              background: "#18191E",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <Icons.Wind size={16} color="var(--dash-blue-accent)" />
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)" }}>Thermostat Runaway (Freeze Breach)</span>
                <span className="dash-status-badge in-transit">SUBLIMIT</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", margin: 0 }}>
                Simulates over-cooling below 2.00°C to test crystallization thresholds.
              </p>
            </div>
            <button
              className="dash-pill-btn"
              onClick={() => handleInject("FREEZING_EVENT", -6.0)}
              disabled={loading}
            >
              <span>Trigger Freeze</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Security Verification & Rejection Mechanics Feedback */}
      <div className="dash-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
        <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "14px" }}>
          On-Chain Security Enforcement Mechanics
        </h3>

        <div
          style={{
            background: "#18191E",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--dash-border)",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Icons.ShieldCheck size={16} color="var(--dash-green-pill-text)" />
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-primary)" }}>ECDSA Defense Sequence</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--dash-text-secondary)", lineHeight: "1.6", margin: 0 }}>
            1. Ingress packet packed into canonical 78 bytes.<br />
            2. Keccak-256 hashed with EIP-191 prefix.<br />
            3. <code>ECDSA.recover</code> computes signer address.<br />
            4. If address != authorized reefer node: <b style={{ color: "var(--dash-red-pill-text)" }}>REVERT ON-CHAIN</b>.<br />
            5. If temperature outside 200..800: <b style={{ color: "var(--dash-cat-peach-bg)" }}>AUTONOMOUS QUARANTINE</b>.
          </p>
        </div>

        {/* Live Attack Telemetry Snapshot */}
        <div style={{ marginTop: "auto" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "10px" }}>
            Active Sensor Diagnostic
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
            <div style={{ background: "#18191E", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--dash-border)" }}>
              <span style={{ color: "var(--dash-text-muted)", display: "block" }}>CURRENT TEMP</span>
              <span className="font-mono" style={{ fontSize: "15px", fontWeight: "700", color: (lastPacket?.temperature_celsius > 8 || lastPacket?.temperature_celsius < 2) ? "var(--dash-red-pill-text)" : "var(--dash-green-pill-text)" }}>
                {lastPacket ? `${lastPacket.temperature_celsius.toFixed(2)}°C` : "4.50°C"}
              </span>
            </div>

            <div style={{ background: "#18191E", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--dash-border)" }}>
              <span style={{ color: "var(--dash-text-muted)", display: "block" }}>ATTACK MODE</span>
              <span className="font-mono" style={{ fontSize: "15px", fontWeight: "700", color: lastPacket?.attack_mode !== "NONE" ? "var(--dash-red-pill-text)" : "var(--dash-blue-accent)" }}>
                {lastPacket?.attack_mode || "NONE"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
