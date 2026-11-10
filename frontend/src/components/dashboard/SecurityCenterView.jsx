import React from "react";
import { Icons } from "../ui/Icons";

export default function SecurityCenterView({
  batches = [],
  lastPacket,
  onNavigateTab,
}) {
  const quarantinedBatches = batches.filter((b) => b.status === "QUARANTINED");
  const isAttackActive = lastPacket?.attack_mode && lastPacket.attack_mode !== "NONE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "32px" }}>
      {/* Header */}
      <div className="dash-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Icons.ShieldCheck size={22} color="var(--dash-blue-accent)" />
          <h2 className="font-display" style={{ fontSize: "20px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            Cryptographic Security & System Integrity Center
          </h2>
        </div>
        <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", maxWidth: "700px" }}>
          Real-time cryptographic audit of supply-chain telemetries, EIP-191 personal signatures, monotonic sequence nonces, and mathematical cold-chain boundary checks.
        </p>
      </div>

      {/* Security Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        {/* Signature Verification */}
        <div className="dash-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600" }}>SIGNATURE ENGINE</span>
            <button className="circle-arrow-btn">
              <Icons.ShieldCheck size={14} color="var(--dash-green-pill-text)" />
            </button>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            ECDSA secp256k1
          </div>
          <div style={{ fontSize: "11px", color: "var(--dash-green-pill-text)", marginTop: "6px" }}>
            ✓ EIP-191 Canonical Digest Verified
          </div>
        </div>

        {/* Monotonic Nonces */}
        <div className="dash-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600" }}>REPLAY PROTECTION</span>
            <button className="circle-arrow-btn">
              <Icons.Lock size={14} color="var(--dash-green-pill-text)" />
            </button>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            Strict Monotonic Nonces
          </div>
          <div style={{ fontSize: "11px", color: "var(--dash-green-pill-text)", marginTop: "6px" }}>
            ✓ Monotonic Counter Check Enforced
          </div>
        </div>

        {/* MITM Tamper Detector */}
        <div className="dash-card" style={{ padding: "20px", borderColor: isAttackActive ? "rgba(239, 68, 68, 0.4)" : "var(--dash-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600" }}>TAMPER INTEGRITY</span>
            <button className="circle-arrow-btn">
              <Icons.ShieldAlert size={14} color={isAttackActive ? "#EF4444" : "var(--dash-green-pill-text)"} />
            </button>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "700", color: isAttackActive ? "#EF4444" : "var(--dash-text-primary)" }}>
            {isAttackActive ? `ATTACK: ${lastPacket.attack_mode}` : "Zero Tamper Breaches"}
          </div>
          <div style={{ fontSize: "11px", color: isAttackActive ? "#EF4444" : "var(--dash-green-pill-text)", marginTop: "6px" }}>
            {isAttackActive ? "Reverted by Contract Engine" : "✓ In-Transit Bitstreams Intact"}
          </div>
        </div>

        {/* Thermal Excursion Status */}
        <div className="dash-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600" }}>THERMAL EXCURSIONS</span>
            <button className="circle-arrow-btn">
              <Icons.Thermometer size={14} color={quarantinedBatches.length > 0 ? "#EF4444" : "var(--dash-green-pill-text)"} />
            </button>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "700", color: quarantinedBatches.length > 0 ? "#EF4444" : "var(--dash-text-primary)" }}>
            {quarantinedBatches.length} Quarantined
          </div>
          <div style={{ fontSize: "11px", color: quarantinedBatches.length > 0 ? "#EF4444" : "var(--dash-green-pill-text)", marginTop: "6px" }}>
            {quarantinedBatches.length > 0 ? "Replenishment Triggered" : "✓ All Lots Nominal (2°C – 8°C)"}
          </div>
        </div>
      </div>

      {/* Security Architecture Explanations & Chaos Lab Link */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "18px" }}>
        <div className="dash-card" style={{ padding: "22px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "14px" }}>
            Zero-Trust Telemetry Defense Breakdown
          </h3>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Icons.CheckCircle2 size={16} color="var(--dash-green-pill-text)" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ color: "var(--dash-text-secondary)" }}>
                <b style={{ color: "var(--dash-text-primary)" }}>Canonical Serialization (78 Bytes):</b> Pre-agreed bit packing prevents JSON formatting ambiguities or floating point precision differences across execution runtimes.
              </div>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Icons.CheckCircle2 size={16} color="var(--dash-green-pill-text)" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ color: "var(--dash-text-secondary)" }}>
                <b style={{ color: "var(--dash-text-primary)" }}>ECDSA Signature Verification:</b> Every packet is signed with the reefer edge device’s private key. The smart contract recovers the signer address on Cancun EVM.
              </div>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Icons.CheckCircle2 size={16} color="var(--dash-green-pill-text)" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ color: "var(--dash-text-secondary)" }}>
                <b style={{ color: "var(--dash-text-primary)" }}>Replay Protection:</b> Monotonic nonces prevent intercepted valid historical packets from being broadcast again.
              </div>
            </li>
          </ul>
        </div>

        {/* Chaos Laboratory Prompt */}
        <div className="dash-card" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Icons.Zap size={18} color="var(--dash-cat-peach-bg)" />
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "var(--dash-text-primary)" }}>Adversarial Attack Laboratory</h4>
            </div>
            <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", lineHeight: "1.6" }}>
              Test the security framework by injecting real-time MITM sensor tampering, freeze excursions (1.5°C), or heat excursions (9.5°C) to observe on-chain rejections.
            </p>
          </div>

          <button
            className="dash-pill-btn white-action"
            onClick={() => onNavigateTab("chaos")}
            style={{ marginTop: "18px", alignSelf: "flex-start" }}
          >
            <Icons.Zap size={14} />
            <span>Launch Chaos Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
