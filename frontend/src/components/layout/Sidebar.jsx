import React from "react";
import { LayoutDashboard, MapPin, Zap, Layers, QrCode, FileText } from "lucide-react";

export default function Sidebar({ activeTab, onTabChange }) {
  const tabs = [
    { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
    { id: "map", label: "Transit Fleet Map", icon: MapPin },
    { id: "chaos", label: "Chaos Studio", icon: Zap, badge: "LAB" },
    { id: "explorer", label: "Ledger Explorer", icon: Layers },
    { id: "verify", label: "Consumer QR", icon: QrCode },
    { id: "auditor", label: "Audit Reports", icon: FileText },
  ];

  return (
    <aside style={{
      width: "220px",
      minWidth: "220px",
      padding: "16px 12px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: isActive ? "1px solid var(--border-active)" : "1px solid transparent",
              background: isActive ? "var(--bg-surface-elevated)" : "transparent",
              color: isActive ? "var(--cyan-primary)" : "#94A3B8",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
              outline: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Icon size={17} color={isActive ? "var(--cyan-primary)" : "#94A3B8"} />
              <span style={{ fontSize: "13px", fontWeight: isActive ? "600" : "500" }}>
                {tab.label}
              </span>
            </div>
            {tab.badge && (
              <span style={{
                fontSize: "10px",
                fontWeight: "700",
                background: "var(--crimson-dim)",
                color: "var(--crimson-alert)",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid rgba(255, 0, 85, 0.3)",
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
}
