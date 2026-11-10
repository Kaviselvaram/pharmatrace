import React from "react";
import { Icons } from "../ui/Icons";

export default function Navbar({
  blockNumber,
  connected,
  activeRole,
  onRoleChange,
  onOpenCreateModal,
  onOpenPortal,
  onNavigateTab,
}) {
  const [navSearch, setNavSearch] = React.useState("");

  // Format current date matching Reference 2: "Today, Mon 22 Nov"
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  const roleLabels = {
    MANUFACTURER: "BioVax (Manufacturer)",
    CARRIER: "ColdLogix (Carrier)",
    HOSPITAL: "Apollo (Hospital)",
    AUDITOR: "CDSCO (Auditor)",
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && onNavigateTab) {
      onNavigateTab("batches");
    }
  };

  return (
    <header
      style={{
        padding: "16px 24px 8px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "14px",
      }}
    >
      {/* Left: Reference 2 Search Pill with Embedded Date Tag */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, maxWidth: "520px" }}>
        <div
          className="dash-search-input"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <Icons.Search size={15} color="var(--dash-text-muted)" />
            <input
              type="text"
              placeholder="Search lot ID, hash, custodian, EVM address... (Enter)"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--dash-text-muted)",
              background: "#222329",
              padding: "3px 8px",
              borderRadius: "var(--radius-full)",
              whiteSpace: "nowrap",
            }}
          >
            Today, {todayFormatted}
          </div>
        </div>
      </div>

      {/* Right Controls: EVM Badge, WebSocket Live, Role Picker, Settings, Bell, Avatar, + Mint Batch */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        {/* EVM Block Height Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#18191E",
            border: "1px solid var(--dash-border)",
            padding: "6px 12px",
            borderRadius: "var(--radius-full)",
            fontSize: "12px",
            cursor: onNavigateTab ? "pointer" : "default",
          }}
          onClick={() => onNavigateTab && onNavigateTab("explorer")}
          title="Click to view Blockchain Ledger"
        >
          <Icons.Cpu size={13} color="var(--dash-blue-accent)" />
          <span style={{ color: "var(--dash-text-muted)" }}>EVM:</span>
          <span className="font-mono" style={{ fontWeight: "700", color: "var(--dash-text-primary)" }}>
            #{blockNumber || "..."}
          </span>
        </div>

        {/* WebSocket Stream Liveness Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: connected ? "var(--dash-green-pill-bg)" : "var(--dash-red-pill-bg)",
            border: `1px solid ${connected ? "rgba(52, 211, 153, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            padding: "6px 12px",
            borderRadius: "var(--radius-full)",
            fontSize: "11px",
            fontWeight: "600",
            color: connected ? "var(--dash-green-pill-text)" : "var(--dash-red-pill-text)",
            cursor: onNavigateTab ? "pointer" : "default",
          }}
          onClick={() => onNavigateTab && onNavigateTab("monitoring")}
          title="Click to view Live Telemetry Stream"
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: connected ? "var(--dash-green-pill-text)" : "var(--dash-red-pill-text)",
              boxShadow: connected ? "0 0 8px var(--dash-green-pill-text)" : "none",
            }}
          />
          <span>{connected ? "LIVE HEARTBEAT" : "RECONNECTING"}</span>
        </div>

        {/* Role Selector Pill */}
        <select
          value={activeRole}
          onChange={(e) => onRoleChange(e.target.value)}
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
          }}
        >
          <option value="MANUFACTURER">BioVax Pharma (Manufacturer)</option>
          <option value="CARRIER">ColdLogix Fleet (Carrier)</option>
          <option value="HOSPITAL">Apollo Hospital (Pharmacy)</option>
          <option value="AUDITOR">CDSCO Inspector (Auditor)</option>
        </select>

        {/* Reference 2 Settings Icon Button */}
        <button
          className="circle-arrow-btn"
          title="Security & Chain Settings"
          style={{ width: "34px", height: "34px", background: "#18191E", border: "1px solid var(--dash-border)", cursor: "pointer" }}
          onClick={() => onNavigateTab && onNavigateTab("security")}
        >
          <Icons.Settings size={15} color="var(--dash-text-muted)" />
        </button>

        {/* Reference 2 Bell Icon Button */}
        <button
          className="circle-arrow-btn"
          title="Notifications & Excursions"
          style={{ width: "34px", height: "34px", background: "#18191E", border: "1px solid var(--dash-border)", position: "relative", cursor: "pointer" }}
          onClick={() => onNavigateTab && onNavigateTab("security")}
        >
          <Icons.Bell size={15} color="var(--dash-text-muted)" />
          <span
            style={{
              position: "absolute",
              top: "7px",
              right: "7px",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--dash-blue-accent)",
            }}
          />
        </button>

        {/* Reference 2 User Avatar Pill */}
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4F80F8 0%, #8B5CF6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontWeight: "700",
            fontSize: "12px",
            cursor: "pointer",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
          title={`${roleLabels[activeRole]} - Click to switch role`}
          onClick={() => {
            const roles = ["MANUFACTURER", "CARRIER", "HOSPITAL", "AUDITOR"];
            const nextIdx = (roles.indexOf(activeRole) + 1) % roles.length;
            onRoleChange(roles[nextIdx]);
          }}
        >
          {activeRole.charAt(0)}
        </div>

        {/* Reference 2 Solid White Action Button (+ Add Order -> + Mint Batch) */}
        <button
          className="dash-pill-btn white-action"
          onClick={onOpenCreateModal}
          style={{ padding: "8px 16px" }}
        >
          <Icons.PlusCircle size={14} />
          <span>+ Mint Batch</span>
        </button>
      </div>
    </header>
  );
}
