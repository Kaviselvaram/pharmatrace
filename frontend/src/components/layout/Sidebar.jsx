import React, { useState } from "react";
import { Icons, SwirlLogo } from "../ui/Icons";

export default function Sidebar({ activeTab, onTabChange, onExitToPortal }) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: "overview", label: "Overview", icon: Icons.Clock },
    { id: "batches", label: "Batches", icon: Icons.Box },
    { id: "monitoring", label: "Live Telemetry", icon: Icons.Activity },
    { id: "map", label: "Fleet Transit Map", icon: Icons.Navigation },
    { id: "custody", label: "Custody Handover", icon: Icons.ArrowRightLeft },
    { id: "security", label: "Security Center", icon: Icons.ShieldCheck },
    { id: "recovery", label: "Quarantine & Recovery", icon: Icons.RotateCcw },
    { id: "explorer", label: "Blockchain Ledger", icon: Icons.Layers },
    { id: "verify", label: "Consumer QR", icon: Icons.QrCode },
    { id: "auditor", label: "Regulatory Auditor", icon: Icons.FileText },
    { id: "chaos", label: "Chaos Studio", icon: Icons.Zap, badge: "LAB" },
  ];

  return (
    <aside
      style={{
        width: collapsed ? "74px" : "210px",
        minWidth: collapsed ? "74px" : "210px",
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: "var(--radius-lg)",
        margin: "16px 0 16px 16px",
        padding: "16px 10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "calc(100vh - 32px)",
        position: "sticky",
        top: "16px",
        zIndex: "var(--z-nav)",
        transition: "width 0.2s ease, min-width 0.2s ease",
        boxShadow: "var(--shadow-obsidian-sm)",
      }}
    >
      {/* Top Brand Swirl Logo & Collapse Toggle */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: "0 6px",
          }}
        >
          <div
            onClick={onExitToPortal}
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
            title="Return to Public Portal"
          >
            <SwirlLogo size={32} />
            {!collapsed && (
              <div>
                <span
                  className="font-display"
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "var(--dash-text-primary)",
                    letterSpacing: "-0.3px",
                  }}
                >
                  PharmaTrace
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none",
              border: "none",
              color: "var(--dash-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              borderRadius: "var(--radius-xs)",
              transition: "color 0.15s ease",
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icons.ChevronRight
              size={14}
              style={{
                transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>
        </div>

        {/* Navigation Item Stack (Reference 2 pill buttons) */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (activeTab.startsWith("batches") && item.id === "batches");

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: "10px",
                  padding: collapsed ? "10px 0" : "9px 12px",
                  width: "100%",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  /* Active item in Reference 2 has solid white background and black icon */
                  background: isActive ? "#FFFFFF" : "transparent",
                  color: isActive ? "#0C0D11" : "var(--dash-text-muted)",
                  transition: "all 0.15s ease",
                  position: "relative",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--dash-surface-hover)";
                    e.currentTarget.style.color = "var(--dash-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--dash-text-muted)";
                  }
                }}
              >
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.3 : 1.8}
                  color={isActive ? "#0C0D11" : "currentColor"}
                />

                {!collapsed && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: isActive ? "700" : "500",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </span>
                )}

                {!collapsed && item.badge && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "9px",
                      fontWeight: "700",
                      background: isActive ? "#0C0D11" : "var(--dash-red-pill-bg)",
                      color: isActive ? "#FFFFFF" : "var(--dash-red-pill-text)",
                      padding: "2px 5px",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Exit to Portal Button */}
      <div style={{ paddingTop: "12px", borderTop: "1px solid var(--dash-border)" }}>
        <button
          onClick={onExitToPortal}
          title={collapsed ? "Exit to Public Website" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "10px",
            padding: collapsed ? "10px 0" : "9px 12px",
            width: "100%",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: "var(--dash-text-muted)",
            transition: "all 0.15s ease",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--dash-surface-hover)";
            e.currentTarget.style.color = "var(--dash-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--dash-text-muted)";
          }}
        >
          <Icons.LogOut size={16} />
          {!collapsed && (
            <span style={{ fontSize: "12px", fontWeight: "500" }}>Public Portal</span>
          )}
        </button>
      </div>
    </aside>
  );
}
