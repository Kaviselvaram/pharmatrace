import React, { useState } from "react";
import { Icons, SwirlLogo } from "../ui/Icons";

export default function LoginPage({ activeRole, onRoleSelect, onEnterWorkspace, onCancel }) {
  const [selectedRole, setSelectedRole] = useState(activeRole || "MANUFACTURER");

  const roles = [
    {
      id: "MANUFACTURER",
      name: "BioVax Pharma",
      role: "Manufacturer Workspace",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      permissions: "Mint batches, initiate custody handover, view telemetry",
      icon: Icons.Building2,
      badge: "ORIGIN",
    },
    {
      id: "CARRIER",
      name: "ColdLogix Fleet",
      role: "Logistics & Reefer Workspace",
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      permissions: "Confirm custody, stream edge GPS/reefer telemetry",
      icon: Icons.Truck,
      badge: "TRANSIT",
    },
    {
      id: "HOSPITAL",
      name: "Apollo Specialty Hospital",
      role: "Clinical Pharmacy Workspace",
      address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      permissions: "Receive custody, verify cold-chain integrity before injection",
      icon: Icons.HeartPulse,
      badge: "RECEPTION",
    },
    {
      id: "AUDITOR",
      name: "CDSCO Inspector",
      role: "Regulatory Compliance Workspace",
      address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      permissions: "Full inspection rights, generate FDA & CDSCO audit reports",
      icon: Icons.Scale,
      badge: "GOVERNANCE",
    },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    onRoleSelect(selectedRole);
    onEnterWorkspace();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0C0D11",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        className="dash-card"
        style={{
          maxWidth: "960px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1.25fr",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-obsidian-lg)",
          background: "#16161A",
          border: "1px solid var(--dash-border)",
        }}
      >
        {/* Left Branding Panel */}
        <div
          style={{
            background: "#121317",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid var(--dash-border)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px" }}>
              <SwirlLogo size={36} />
              <span className="font-display" style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF" }}>
                PharmaTrace
              </span>
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: "26px",
                fontWeight: "700",
                color: "#FFFFFF",
                lineHeight: "1.3",
                marginBottom: "16px",
                letterSpacing: "-0.5px",
              }}
            >
              Secure pharmaceutical traceability, from telemetry to ledger.
            </h2>

            <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", lineHeight: "1.6" }}>
              Access the decentralized command center with simulated cryptographic node credentials. Each organization operates within dedicated smart contract permission boundaries.
            </p>
          </div>

          <div style={{ marginTop: "40px", borderTop: "1px solid var(--dash-border)", paddingTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Icons.ShieldCheck size={16} color="var(--dash-green-pill-text)" />
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--dash-text-primary)" }}>
                Simulated Node Authorization
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--dash-text-muted)", margin: 0 }}>
              Operating on Hardhat EVM (Local). Participant keys are securely pre-configured for this simulation environment.
            </p>
          </div>
        </div>

        {/* Right Role / Access Panel */}
        <div style={{ padding: "44px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h3 className="font-display" style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF" }}>
                Demo Role-Based Workspace Selection
              </h3>
              <p style={{ fontSize: "13px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
                Select a simulated participant role to inspect dedicated workspace capabilities
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="circle-arrow-btn"
                title="Back to Portal"
                style={{ width: "32px", height: "32px", background: "#1F2026" }}
              >
                <Icons.X size={15} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    border: isSelected ? "2px solid var(--dash-blue-accent)" : "1px solid var(--dash-border)",
                    background: isSelected ? "#1E222D" : "#18191E",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-sm)",
                      background: isSelected ? "var(--dash-blue-accent)" : "#222329",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isSelected ? "#FFFFFF" : "var(--dash-text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>
                        {r.name}
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: "700",
                          padding: "1px 6px",
                          borderRadius: "var(--radius-full)",
                          background: isSelected ? "rgba(79, 128, 248, 0.25)" : "#2B2C33",
                          color: isSelected ? "var(--dash-blue-accent)" : "var(--dash-text-muted)",
                        }}
                      >
                        {r.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--dash-text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {r.permissions}
                    </div>
                    <div className="font-mono" style={{ fontSize: "10px", color: isSelected ? "var(--dash-blue-accent)" : "var(--dash-text-muted)", marginTop: "2px" }}>
                      {r.address}
                    </div>
                  </div>

                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => setSelectedRole(r.id)}
                    style={{ accentColor: "var(--dash-blue-accent)", width: "16px", height: "16px" }}
                  />
                </div>
              );
            })}

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                type="submit"
                className="dash-pill-btn white-action"
                style={{ flex: 1, padding: "12px", fontSize: "13px", justifyContent: "center" }}
              >
                <span>Enter Workspace</span>
                <Icons.ChevronRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
