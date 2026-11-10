import React, { useState } from "react";
import { Icons } from "../ui/Icons";
import TelemetryWaveform from "./TelemetryWaveform";
import TransitMap from "./TransitMap";
import BatchTable from "./BatchTable";

export default function OverviewView({
  batches = [],
  activeBatchId,
  isSimulationRunning,
  lastPacket,
  telemetryHistory = [],
  onSelectBatch,
  onStartSimulation,
  onPauseSimulation,
  onOpenHandoverModal,
  onOpenQRModal,
  onViewBatchDetails,
  onNavigateTab,
}) {
  const [selectedPeriod, setSelectedPeriod] = useState("This month");
  const [hoveredBarIndex, setHoveredBarIndex] = useState(4);

  const periods = ["This month", "This week", "Today", "This quarter"];
  const handleCyclePeriod = () => {
    const nextIdx = (periods.indexOf(selectedPeriod) + 1) % periods.length;
    setSelectedPeriod(periods[nextIdx]);
  };

  const totalBatches = batches.length;
  const inTransitCount = batches.filter((b) => b.status === "IN_TRANSIT").length;
  const deliveredCount = batches.filter((b) => b.status === "DELIVERED").length;
  const quarantinedCount = batches.filter((b) => b.status === "QUARANTINED").length;
  const createdCount = batches.filter((b) => b.status === "CREATED").length;
  const replenishedCount = batches.filter((b) => b.status === "REPLENISHED").length;

  const currentTemp = lastPacket?.temperature_celsius ?? 4.5;
  const currentNonce = lastPacket?.nonce ?? 1042;

  // Bar Chart Data (Reference 2 style vertical bars)
  const barChartData = [
    { label: "1 AUG", temp: 4.1, height: 45 },
    { label: "2 AUG", temp: 4.3, height: 65 },
    { label: "3 AUG", temp: 3.9, height: 50 },
    { label: "4 AUG", temp: 4.8, height: 75 },
    { label: "5 AUG", temp: currentTemp, height: Math.min(95, Math.max(30, currentTemp * 15)) },
    { label: "6 AUG", temp: 4.2, height: 90 },
    { label: "7 AUG", temp: 4.5, height: 98 },
    { label: "8 AUG", temp: 4.4, height: 78 },
  ];

  // Donut chart status segments derived from canonical batch counts
  const statusSegments = [
    { name: "In Transit", count: inTransitCount, color: "var(--donut-c1)" },
    { name: "Delivered", count: deliveredCount, color: "var(--donut-c2)" },
    { name: "Created (Genesis)", count: createdCount, color: "var(--donut-c3)" },
    { name: "Quarantined", count: quarantinedCount, color: "var(--donut-c4)" },
    { name: "Replenished", count: replenishedCount, color: "var(--donut-c5)" },
  ];

  const circumference = 2 * Math.PI * 38;
  let cumulativeOffset = 0;
  const svgSegments = statusSegments.map((seg) => {
    const fraction = totalBatches > 0 ? seg.count / totalBatches : 0;
    const dashLength = fraction * circumference;
    const strokeDasharray = `${dashLength.toFixed(1)} ${(circumference - dashLength).toFixed(1)}`;
    const strokeDashoffset = (-cumulativeOffset).toFixed(1);
    cumulativeOffset += dashLength;
    return {
      ...seg,
      dashLength,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "32px" }}>
      {/* 1. Reference 2 Greeting Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            className="font-display"
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "var(--dash-text-primary)",
              letterSpacing: "-0.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Hello, BioVax! 👋
          </h1>
          <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", marginTop: "4px" }}>
            This is what's happening across your cold-chain network this month.
          </p>
        </div>

        {/* Right Period Selector Pill & Calendar Box */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            onClick={handleCyclePeriod}
            title="Click to cycle time window"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#18191E",
              border: "1px solid var(--dash-border)",
              padding: "7px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--dash-text-primary)",
              cursor: "pointer",
            }}
          >
            <span>{selectedPeriod}</span>
            <Icons.ChevronDown size={14} color="var(--dash-text-muted)" />
          </div>

          <button
            className="circle-arrow-btn"
            onClick={handleCyclePeriod}
            title={`Filter date range (current: ${selectedPeriod})`}
            style={{ width: "34px", height: "34px", background: "#18191E", border: "1px solid var(--dash-border)", cursor: "pointer" }}
          >
            <Icons.Calendar size={15} color="var(--dash-text-muted)" />
          </button>
        </div>
      </div>

      {/* 2. Reference 2 Asymmetric Metrics & Revenue/Telemetry Bar Chart Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "18px",
        }}
      >
        {/* Left: 4 Stat Cards in 2x2 layout (7 columns on desktop) */}
        <div
          style={{
            gridColumn: "span 7",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {/* Card 1: Active Shipments (Top Left - blue circle button in Reference 2) */}
          <div className="dash-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--dash-text-secondary)", fontWeight: "500" }}>
                Active shipments
              </span>
              <button className="circle-arrow-btn primary" onClick={() => onNavigateTab("batches")}>
                <Icons.ArrowUpRight size={16} />
              </button>
            </div>
            <div
              className="font-display"
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "var(--dash-text-primary)",
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              }}
            >
              <span>{inTransitCount}</span>
              <span className="dash-change-pill positive">
                {totalBatches > 0 ? Math.round((inTransitCount / totalBatches) * 100) : 0}% fleet
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              Active reefer corridor
            </span>
          </div>

          {/* Card 2: Delivered Lots */}
          <div className="dash-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--dash-text-secondary)", fontWeight: "500" }}>
                Delivered lots
              </span>
              <button className="circle-arrow-btn" onClick={() => onNavigateTab("batches")}>
                <Icons.ArrowUpRight size={16} />
              </button>
            </div>
            <div
              className="font-display"
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "var(--dash-text-primary)",
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              }}
            >
              <span>{deliveredCount}</span>
              <span className="dash-change-pill positive">
                {totalBatches > 0 ? Math.round((deliveredCount / totalBatches) * 100) : 0}% fleet
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              Verified clinic receipt
            </span>
          </div>

          {/* Card 3: Telemetry Nonces */}
          <div className="dash-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--dash-text-secondary)", fontWeight: "500" }}>
                Edge telemetry nonces
              </span>
              <button className="circle-arrow-btn" onClick={() => onNavigateTab("monitoring")}>
                <Icons.ArrowUpRight size={16} />
              </button>
            </div>
            <div
              className="font-display"
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "var(--dash-text-primary)",
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              }}
            >
              <span>#{currentNonce}</span>
              <span className="dash-change-pill negative">
                - 2.67%
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              Monotonic EIP-191 counters
            </span>
          </div>

          {/* Card 4: EVM Verified Transactions */}
          <div className="dash-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--dash-text-secondary)", fontWeight: "500" }}>
                EVM verified proofs
              </span>
              <button className="circle-arrow-btn" onClick={() => onNavigateTab("explorer")}>
                <Icons.ArrowUpRight size={16} />
              </button>
            </div>
            <div
              className="font-display"
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "var(--dash-text-primary)",
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              }}
            >
              <span>{quarantinedCount === 0 ? "100%" : "98.4%"}</span>
              <span className="dash-change-pill positive">
                + 5.67%
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              Secp256k1 on-chain recovery
            </span>
          </div>
        </div>

        {/* Right: Reference 2 Revenue / Telemetry Bar Chart (5 columns on desktop) */}
        <div
          className="dash-card"
          style={{
            gridColumn: "span 5",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Chart Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 className="font-display" style={{ fontSize: "15px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                Thermal Stability & Telemetry
              </h3>
              <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
                Sensor readings vs safe envelope
              </span>
            </div>
            <button className="circle-arrow-btn white" onClick={() => onNavigateTab("monitoring")}>
              <Icons.ArrowUpRight size={16} />
            </button>
          </div>

          {/* Bar Chart Area (Reference 2 soft blue rounded bars) */}
          <div style={{ position: "relative", marginTop: "24px" }}>
            {/* Tooltip Pill (matching $14,342 pill in Reference 2) */}
            <div
              style={{
                position: "absolute",
                top: "-24px",
                left: `${hoveredBarIndex * 12 + 10}%`,
                background: "#24252B",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: "600",
                padding: "3px 8px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--dash-border)",
                whiteSpace: "nowrap",
                transform: "translateX(-50%)",
                transition: "left 0.15s ease",
                zIndex: 2,
              }}
            >
              {barChartData[hoveredBarIndex]?.temp.toFixed(2)}°C Nominal
            </div>

            {/* Grid & Bars */}
            <div style={{ display: "flex", alignItems: "flex-end", height: "130px", gap: "10px", paddingBottom: "24px", borderBottom: "1px solid var(--dash-border)" }}>
              {/* Y Axis Guide */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", fontSize: "9px", color: "var(--dash-text-muted)", paddingRight: "8px" }}>
                <span>8°C</span>
                <span>5°C</span>
                <span>2°C</span>
                <span>0°C</span>
              </div>

              {/* Bars */}
              <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "space-between", height: "100%" }}>
                {barChartData.map((bar, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      flex: 1,
                      height: "100%",
                      justifyContent: "flex-end",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: `${bar.height}%`,
                        background: idx === hoveredBarIndex ? "var(--dash-blue-accent)" : "var(--dash-blue-bar)",
                        borderRadius: "8px 8px 3px 3px",
                        transition: "height 0.25s ease, background 0.15s ease",
                      }}
                    />
                    <span style={{ fontSize: "9px", color: "var(--dash-text-muted)", whiteSpace: "nowrap" }}>
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Reference 2 Bottom Operational Row (Orders Card + Customers Card + Donut Chart) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "18px",
        }}
      >
        {/* Bottom Left Card: 98 orders awaiting confirmation */}
        <div
          className="dash-card"
          style={{
            gridColumn: "span 3",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#24252B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <Icons.Check size={14} />
            </div>
            <button className="circle-arrow-btn white" onClick={() => onNavigateTab("batches")}>
              <Icons.ArrowUpRight size={16} />
            </button>
          </div>
          <div>
            <div
              className="font-display"
              style={{ fontSize: "28px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "4px" }}
            >
              {telemetryHistory.length > 0 ? telemetryHistory.length : (lastPacket ? 1 : 0)} <span style={{ fontSize: "16px", fontWeight: "500", color: "var(--dash-text-secondary)" }}>packets</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", margin: 0 }}>
              {telemetryHistory.length > 0 ? `${telemetryHistory.length} cryptographic sensor frames streamed` : "Awaiting sensor telemetry transmission"}
            </p>
          </div>
        </div>

        {/* Bottom Middle Card: 17 customers waiting for response (with subtle background wave) */}
        <div
          className="dash-card"
          style={{
            gridColumn: "span 4",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Subtle decorative mesh in background */}
          <div
            style={{
              position: "absolute",
              right: "-20px",
              bottom: "-20px",
              opacity: 0.15,
              pointerEvents: "none",
            }}
          >
            <svg width="180" height="120" viewBox="0 0 180 120" fill="none">
              <path d="M0 60C40 20 80 100 120 40C150 -10 170 80 180 60" stroke="#FFFFFF" strokeWidth="1.5" />
              <path d="M0 80C40 40 80 120 120 60C150 10 170 100 180 80" stroke="#FFFFFF" strokeWidth="1" />
            </svg>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#24252B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <Icons.User size={14} />
            </div>
            <button className="circle-arrow-btn white" onClick={() => onNavigateTab("custody")}>
              <Icons.ArrowUpRight size={16} />
            </button>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              className="font-display"
              style={{ fontSize: "28px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "4px" }}
            >
              4 <span style={{ fontSize: "16px", fontWeight: "500", color: "var(--dash-text-secondary)" }}>custodians</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", margin: 0 }}>
              All network signers synchronized on Hardhat EVM.
            </p>
          </div>
        </div>

        {/* Bottom Right Card: Reference 2 Donut Chart (Sales by Category -> Shipment Status Breakdown) */}
        <div
          className="dash-card"
          style={{
            gridColumn: "span 5",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 className="font-display" style={{ fontSize: "15px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                Shipment Status Breakdown
              </h3>
              <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
                Active batch lifecycle states
              </span>
            </div>
            <button className="circle-arrow-btn white" onClick={() => onNavigateTab("batches")}>
              <Icons.ArrowUpRight size={16} />
            </button>
          </div>

          {/* Donut Chart & Legend Split */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginTop: "14px" }}>
            {/* SVG Donut Chart */}
            <div style={{ position: "relative", width: "110px", height: "110px", flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                {totalBatches === 0 ? (
                  <circle cx="50" cy="50" r="38" stroke="var(--dash-border)" strokeWidth="18" fill="none" />
                ) : (
                  svgSegments.filter((s) => s.count > 0).map((s, idx) => (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="38"
                      stroke={s.color}
                      strokeWidth="18"
                      fill="none"
                      strokeDasharray={s.strokeDasharray}
                      strokeDashoffset={s.strokeDashoffset}
                    />
                  ))
                )}
              </svg>
            </div>

            {/* Colored Dots Legend matching Reference 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
              {statusSegments.map((seg, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: seg.color }} />
                    <span style={{ color: "var(--dash-text-secondary)" }}>{seg.name}</span>
                  </div>
                  <span className="font-mono" style={{ fontWeight: "700", color: "var(--dash-text-primary)" }}>
                    {seg.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Corridor Waveform & Map Split Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "18px" }}>
        <TelemetryWaveform
          history={telemetryHistory}
          lastPacket={lastPacket}
          minThreshold={2.0}
          maxThreshold={8.0}
        />
        <TransitMap lastPacket={lastPacket} height="240px" />
      </div>

      {/* 5. Live Batch Registry Table (Matching Reference 2 Order List) */}
      <BatchTable
        batches={batches}
        activeBatchId={activeBatchId}
        isSimulationRunning={isSimulationRunning}
        lastPacket={lastPacket}
        onSelectBatch={onSelectBatch}
        onStartSimulation={onStartSimulation}
        onPauseSimulation={onPauseSimulation}
        onOpenHandoverModal={onOpenHandoverModal}
        onOpenQRModal={onOpenQRModal}
        onViewDetails={onViewBatchDetails}
      />
    </div>
  );
}
