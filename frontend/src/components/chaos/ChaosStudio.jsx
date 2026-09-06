import React, { useState } from "react";
import { Zap, ShieldAlert, AlertTriangle, RefreshCw, Lock, Terminal, Play, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";

export default function ChaosStudio({
  activeBatchId,
  batches = [],
  onSelectBatch,
  isSimulationRunning,
  onStartSimulation,
  lastPacket,
  onAttackInjected
}) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const selectedBatch = batches.find(b => b.batch_id === activeBatchId) || batches[0];
  const currentBatchId = activeBatchId || selectedBatch?.batch_id;

  async function handleInject(attackType, tamperDelta = -8.0) {
    if (!currentBatchId) {
      setStatusMessage({ type: "error", text: "Please select or create a batch first!" });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      // If simulation is not running for this batch, start it first
      if (!isSimulationRunning && onStartSimulation) {
        await onStartSimulation(currentBatchId);
        // Small delay to allow simulation task initialization
        await new Promise(r => setTimeout(r, 600));
      }

      await api.injectAttack({
        batch_id: currentBatchId,
        attack_type: attackType,
        tamper_delta: tamperDelta,
      });
      setStatusMessage({ type: "success", text: `Attack successfully injected: ${attackType}` });
      if (onAttackInjected) onAttackInjected(attackType);
    } catch (e) {
      setStatusMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!currentBatchId) return;
    setLoading(true);
    try {
      await api.resetAttacks(currentBatchId);
      setStatusMessage({ type: "info", text: "Simulation reset to nominal operating parameters." });
    } catch (e) {
      setStatusMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
      {/* Left: Attack Injection Console */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Zap size={20} color="var(--crimson-alert)" />
          <h2 className="font-display" style={{ fontSize: "18px", fontWeight: "700", color: "#FFFFFF" }}>
            Chaos & Security Attack Laboratory
          </h2>
        </div>
        <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>
          Interactive adversarial testbed to evaluate cryptographic non-repudiation, EIP-191 signature validation, and autonomous digital recovery.
        </p>

        {/* Target Batch Selector & Simulation State Bar */}
        <div style={{
          background: "var(--bg-surface-elevated)",
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-medium)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>Target Lot:</span>
            <select
              value={currentBatchId || ""}
              onChange={(e) => onSelectBatch && onSelectBatch(e.target.value)}
              className="font-mono"
              style={{
                background: "var(--bg-base)",
                color: "var(--cyan-primary)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 10px",
                fontSize: "12px",
                outline: "none",
                fontWeight: "600",
                maxWidth: "260px"
              }}
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.product_name} ({b.batch_id.substring(0, 8)}... - {b.status})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isSimulationRunning ? "var(--emerald-success)" : "#64748B",
                display: "inline-block",
                boxShadow: isSimulationRunning ? "0 0 8px var(--emerald-success)" : "none"
              }} />
              <span style={{ fontSize: "12px", color: isSimulationRunning ? "var(--emerald-success)" : "#94A3B8", fontWeight: "600" }}>
                {isSimulationRunning ? "TELEMETRY ACTIVE" : "STANDBY"}
              </span>
            </div>

            {!isSimulationRunning && onStartSimulation && currentBatchId && (
              <button
                className="btn btn-primary"
                style={{ padding: "4px 10px", fontSize: "11px" }}
                onClick={() => onStartSimulation(currentBatchId)}
              >
                <Play size={12} />
                <span>Start Transit</span>
              </button>
            )}
          </div>
        </div>

        {statusMessage && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "16px",
            background: statusMessage.type === "error" ? "var(--crimson-dim)" : "var(--cyan-dim)",
            color: statusMessage.type === "error" ? "var(--crimson-alert)" : "var(--cyan-primary)",
            fontSize: "12px",
            fontWeight: "600",
            border: `1px solid ${statusMessage.type === "error" ? "rgba(255, 0, 85, 0.4)" : "rgba(0, 240, 255, 0.4)"}`,
          }}>
            {statusMessage.text}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Attack 1: MITM Tampering */}
          <div style={{ background: "var(--bg-surface-elevated)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={16} color="var(--crimson-alert)" />
                <span style={{ fontWeight: "700", color: "#FFFFFF", fontSize: "13px" }}>
                  Attack A: Man-In-The-Middle Data Tampering
                </span>
              </div>
              <button
                className="btn btn-danger"
                style={{ padding: "5px 12px", fontSize: "11px" }}
                disabled={loading}
                onClick={() => handleInject("MITM_ALTERATION", -8.0)}
              >
                Inject MITM
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#94A3B8" }}>
              Simulates an adversary modifying temperature (12.5°C → 4.2°C) without the private key. Proves that Solidity <code>ecrecover</code> detects the hash divergence and reverts transaction.
            </p>
          </div>

          {/* Attack 2: Compressor Failure */}
          <div style={{ background: "var(--bg-surface-elevated)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={16} color="var(--amber-warning)" />
                <span style={{ fontWeight: "700", color: "#FFFFFF", fontSize: "13px" }}>
                  Attack B: Refrigeration Compressor Breakdown
                </span>
              </div>
              <button
                className="btn"
                style={{ background: "var(--amber-warning)", color: "#07090E", padding: "5px 12px", fontSize: "11px" }}
                disabled={loading}
                onClick={() => handleInject("COMPRESSOR_FAILURE")}
              >
                Cut Compressor
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#94A3B8" }}>
              Simulates physical cooling loss. Legitimate carrier signs truthful rising temperature. Demonstrates smart contract threshold violation, auto-quarantine, and automated replenishment dispatch.
            </p>
          </div>

          {/* Attack 3: Replay Attack */}
          <div style={{ background: "var(--bg-surface-elevated)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={16} color="var(--purple-accent)" />
                <span style={{ fontWeight: "700", color: "#FFFFFF", fontSize: "13px" }}>
                  Attack C: Cryptographic Nonce Replay Attack
                </span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: "5px 12px", fontSize: "11px", borderColor: "var(--purple-accent)", color: "#D8B4FE" }}
                disabled={loading}
                onClick={() => handleInject("REPLAY_ATTACK")}
              >
                Inject Replay
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#94A3B8" }}>
              Re-submits a previously valid signed packet with duplicate nonce. Demonstrates on-chain monotonic counter protection.
            </p>
          </div>

          {/* Reset Button */}
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={14} />
              <span>Reset to Nominal State</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Real-Time Cryptographic Diff Inspector */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Terminal size={18} color="var(--cyan-primary)" />
          <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}>
            Real-Time Cryptographic Inspector
          </h3>
        </div>

        <div className="font-mono" style={{ background: "#05070A", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", fontSize: "12px", lineHeight: "1.7" }}>
          <div style={{ color: "#64748B", marginBottom: "6px" }}>// CANONICAL 78-BYTE SERIALIZATION</div>
          <div style={{ color: "#94A3B8" }}>Batch ID: <span style={{ color: "var(--cyan-primary)" }}>{lastPacket?.batch_id || "None selected"}</span></div>
          <div style={{ color: "#94A3B8" }}>Reported Temp: <span style={{ color: lastPacket?.is_tampered_mitm ? "var(--crimson-alert)" : "#FFFFFF" }}>{lastPacket?.temperature_celsius ?? "..."}°C</span></div>
          {lastPacket?.is_tampered_mitm && (
            <div style={{ color: "var(--crimson-alert)", fontWeight: "700" }}>
              [MITM ALERT]: Sensor recorded {lastPacket.raw_sensor_temperature}°C, but packet was edited to {lastPacket.temperature_celsius}°C!
            </div>
          )}
          <div style={{ color: "#94A3B8" }}>GPS Coordinates: {lastPacket?.latitude?.toFixed(4)}, {lastPacket?.longitude?.toFixed(4)}</div>
          <div style={{ color: "#94A3B8" }}>Nonce Counter: #{lastPacket?.nonce ?? "0"}</div>

          <div style={{ color: "#64748B", margin: "10px 0 6px" }}>// CRYPTOGRAPHIC PROOF (EIP-191)</div>
          <div style={{ color: "#94A3B8" }}>v (Recovery ID): <span style={{ color: "var(--purple-accent)" }}>{lastPacket?.signature_v ?? "28"}</span></div>
          <div style={{ color: "#94A3B8", wordBreak: "break-all" }}>r: {lastPacket?.signature_r || "..."}</div>
          <div style={{ color: "#94A3B8", wordBreak: "break-all" }}>s: {lastPacket?.signature_s || "..."}</div>
          <div style={{ color: "#94A3B8", wordBreak: "break-all" }}>Keccak-256: {lastPacket?.raw_hash || "..."}</div>

          <div style={{ color: "#64748B", margin: "10px 0 6px" }}>// ON-CHAIN EVM VERDICT</div>
          {lastPacket?.error ? (
            <div style={{ color: "var(--crimson-alert)", background: "var(--crimson-dim)", padding: "6px 10px", borderRadius: "4px", border: "1px solid rgba(255, 0, 85, 0.4)" }}>
              REVERTED: {lastPacket.error}
            </div>
          ) : lastPacket?.on_chain_committed ? (
            <div style={{ color: "var(--emerald-success)", background: "var(--emerald-dim)", padding: "6px 10px", borderRadius: "4px", border: "1px solid rgba(0, 255, 136, 0.4)" }}>
              SUCCESS: Verified on-chain via ecrecover & committed!
            </div>
          ) : (
            <div style={{ color: "#94A3B8" }}>Awaiting next signed checkpoint...</div>
          )}
        </div>
      </div>
    </div>
  );
}
