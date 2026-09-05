import React from "react";
import { ShieldCheck, Activity, Box, PlusCircle, UserCheck } from "lucide-react";

export default function Navbar({
  blockNumber,
  connected,
  activeRole,
  onRoleChange,
  onOpenCreateModal,
}) {
  return (
    <header className="glass-panel" style={{
      margin: "12px 16px",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-subtle)",
    }}>
      {/* Brand Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-sm)",
          background: "linear-gradient(135deg, var(--cyan-primary), var(--purple-accent))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--cyan-glow)",
        }}>
          <ShieldCheck size={20} color="#07090E" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="font-display" style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "0.5px", color: "#FFFFFF" }}>
              PHARMATRACE
            </span>
            <span style={{ fontSize: "11px", color: "var(--cyan-primary)", background: "var(--cyan-dim)", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
              EVM SECURED
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>
            Cryptographic Traceability & Autonomous Recovery
          </span>
        </div>
      </div>

      {/* Network & Live Status Indicators */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* EVM Block Height */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-surface-elevated)", padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
          <Activity size={14} color="var(--cyan-primary)" />
          <span style={{ fontSize: "12px", color: "#94A3B8" }}>EVM Block:</span>
          <span className="font-mono" style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>
            #{blockNumber || "..."}
          </span>
        </div>

        {/* Telemetry Stream Liveness */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-surface-elevated)", padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
          <span className="beacon-dot" style={{ background: connected ? "var(--emerald-success)" : "var(--crimson-alert)" }} />
          <span style={{ fontSize: "12px", color: connected ? "var(--emerald-success)" : "var(--crimson-alert)", fontWeight: "600" }}>
            {connected ? "LIVE TELEMETRY" : "CONNECTING..."}
          </span>
        </div>

        {/* Active Role Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <UserCheck size={16} color="var(--purple-accent)" />
          <select
            value={activeRole}
            onChange={(e) => onRoleChange(e.target.value)}
            style={{
              background: "var(--bg-surface-elevated)",
              color: "#FFFFFF",
              border: "1px solid var(--border-medium)",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="MANUFACTURER">BioVax Pharma (Manufacturer)</option>
            <option value="CARRIER">ColdLogix Fleet (Carrier)</option>
            <option value="HOSPITAL">Apollo Hospital (Pharmacy)</option>
            <option value="AUDITOR">CDSCO Inspector (Auditor)</option>
          </select>
        </div>

        {/* Action: Mint New Batch */}
        <button
          className="btn btn-primary"
          onClick={onOpenCreateModal}
          style={{ padding: "7px 14px" }}
        >
          <PlusCircle size={15} />
          <span>Mint Batch</span>
        </button>
      </div>
    </header>
  );
}
