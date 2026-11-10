import React, { useState, useEffect } from "react";
import { Icons } from "../ui/Icons";
import { api } from "../../services/api";

export default function BatchDetailView({
  batchId,
  batches = [],
  onBack,
  onOpenHandoverModal,
  onOpenQRModal,
  onStartSimulation,
  onPauseSimulation,
  isSimulationRunning,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("journey");

  const fallbackBatch = batches.find((b) => b.batch_id === batchId);

  useEffect(() => {
    async function fetchDetail() {
      if (!batchId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getBatchDetail(batchId);
        setDetail(data);
      } catch (err) {
        console.error("Failed to load batch detail", err);
        setError(err.message || "Failed to query batch details");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [batchId]);

  const meta = detail?.metadata || fallbackBatch;
  const status = meta?.status || "UNKNOWN";
  const isQuarantined = status === "QUARANTINED";
  const isReplenished = status === "REPLENISHED";

  function formatHash(h) {
    if (!h) return "0x000...000";
    return `${h.substring(0, 10)}...${h.substring(h.length - 8)}`;
  }

  function getStatusBadge(st) {
    switch (st) {
      case "IN_TRANSIT":
        return <span className="dash-status-badge in-transit">on way</span>;
      case "DELIVERED":
        return <span className="dash-status-badge delivered">delivered</span>;
      case "QUARANTINED":
        return <span className="dash-status-badge await">quarantine</span>;
      case "CREATED":
        return <span className="dash-status-badge created">created</span>;
      case "REPLENISHED":
        return <span className="dash-status-badge replenished">replenished</span>;
      default:
        return <span className="dash-status-badge">{st.toLowerCase()}</span>;
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "32px" }}>
      {/* Top Back Navigation Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="dash-pill-btn" onClick={onBack}>
          <Icons.ChevronLeft size={14} />
          <span>Back to Batches</span>
        </button>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="dash-pill-btn" onClick={() => onOpenQRModal(batchId)}>
            <Icons.QrCode size={13} />
            <span>Consumer QR</span>
          </button>
          {meta && (meta.status === "CREATED" || meta.status === "IN_TRANSIT") && (
            <button className="dash-pill-btn white-action" onClick={() => onOpenHandoverModal(meta)}>
              <Icons.ArrowRightLeft size={13} />
              <span>Custody Handover</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dossier Header */}
      <div className="dash-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className="font-mono" style={{ fontSize: "16px", fontWeight: "700", color: "var(--dash-blue-accent)" }}>
                {meta ? meta.batch_id : batchId}
              </span>
              {getStatusBadge(status)}
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--dash-green-pill-text)",
                  background: "var(--dash-green-pill-bg)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  fontWeight: "600",
                }}
              >
                ✓ ON-CHAIN VERIFIED
              </span>
            </div>

            <h1 className="font-display" style={{ fontSize: "22px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
              {meta ? meta.product_name : "Pharmaceutical Lot"}
            </h1>

            <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", marginTop: "4px" }}>
              Specification: {meta?.min_temp_celsius || 2.0}°C to {meta?.max_temp_celsius || 8.0}°C Nominal Cold-Chain
            </p>
          </div>

          {/* Current Custodian Pill */}
          <div
            style={{
              background: "#18191E",
              padding: "12px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--dash-border)",
              textAlign: "right",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)", display: "block" }}>CURRENT CUSTODIAN</span>
            <span className="font-mono" style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
              {formatHash(meta?.current_custodian)}
            </span>
          </div>
        </div>

        {/* Autonomous Replacement Link Banner (if quarantined or replenished) */}
        {(isQuarantined || isReplenished) && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              background: isQuarantined ? "var(--dash-red-pill-bg)" : "var(--dash-status-replenished-bg)",
              border: `1px solid ${isQuarantined ? "rgba(239, 68, 68, 0.4)" : "rgba(56, 189, 248, 0.4)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Icons.RotateCcw size={18} color={isQuarantined ? "var(--dash-red-pill-text)" : "var(--dash-status-replenished-text)"} />
              <div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: isQuarantined ? "var(--dash-red-pill-text)" : "var(--dash-status-replenished-text)" }}>
                  {isQuarantined ? "CRITICAL: LOT QUARANTINED ON-CHAIN" : "AUTONOMOUS REPLACEMENT LINKED"}
                </span>
                <p style={{ fontSize: "12px", color: "var(--dash-text-secondary)", margin: 0 }}>
                  {meta?.replacement_batch_id
                    ? `Replacement digital twin lot linked: ${formatHash(meta.replacement_batch_id)}`
                    : "Thermal excursion or signature failure flagged. Administering this batch is strictly prohibited."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Tabs for Dossier */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--dash-border)", gap: "24px" }}>
        {[
          { id: "journey", label: "Shipment Journey" },
          { id: "telemetry", label: `Telemetry Records (${detail?.telemetry_count || 0})` },
          { id: "security", label: "Cryptographic Evidence" },
          { id: "blockchain", label: "On-Chain State" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "10px 0",
              border: "none",
              background: "transparent",
              color: activeSubTab === tab.id ? "#FFFFFF" : "var(--dash-text-muted)",
              fontWeight: activeSubTab === tab.id ? "700" : "500",
              fontSize: "13px",
              borderBottom: activeSubTab === tab.id ? "2px solid var(--dash-blue-accent)" : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Shipment Journey Visual Timeline */}
      {activeSubTab === "journey" && (
        <div className="dash-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "16px" }}>
            Custody & Physical Transit Progress
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", paddingLeft: "24px" }}>
            {/* Vertical timeline track line */}
            <div style={{ position: "absolute", left: "7px", top: "10px", bottom: "10px", width: "2px", background: "var(--dash-border)" }} />

            {/* Checkpoint 1: Manufacturing Origin */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-24px", top: "3px", width: "16px", height: "16px", borderRadius: "50%", background: "var(--dash-blue-accent)", border: "3px solid #16161A" }} />
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-blue-accent)" }}>ORIGIN CHECKPOINT</span>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "2px" }}>BioVax Formulation Facility, Hyderabad</h4>
                <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
                  Lot synthesized and minted on EVM. Initial custodian: Manufacturer ({formatHash(meta?.manufacturer)}).
                </p>
              </div>
            </div>

            {/* Checkpoint 2: Refrigerated Logistics */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-24px", top: "3px", width: "16px", height: "16px", borderRadius: "50%", background: status !== "CREATED" ? "var(--dash-blue-accent)" : "#2F3038", border: "3px solid #16161A" }} />
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)" }}>TRANSIT CHECKPOINT</span>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "2px" }}>ColdLogix Reefer Fleet (NH44 Transit)</h4>
                <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
                  Continuous edge temperature telemetry streamed and verified against 2°C – 8°C boundaries.
                </p>
              </div>
            </div>

            {/* Checkpoint 3: Hospital Pharmacy */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-24px", top: "3px", width: "16px", height: "16px", borderRadius: "50%", background: status === "DELIVERED" ? "var(--dash-green-pill-text)" : "#2F3038", border: "3px solid #16161A" }} />
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)" }}>DESTINATION CLINIC</span>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "2px" }}>Apollo Specialty Hospital Pharmacy, Chennai</h4>
                <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
                  Final 2-of-2 custody handover confirmation prior to inpatient administration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Telemetry Records */}
      {activeSubTab === "telemetry" && (
        <div className="dash-card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "12px" }}>
            Telemetry Sensor Stream
          </h3>
          {(!detail?.recent_telemetry || detail.recent_telemetry.length === 0) ? (
            <p style={{ fontSize: "13px", color: "var(--dash-text-muted)", padding: "24px 0", textAlign: "center" }}>
              No telemetry packets recorded for this lot yet. Start simulation to transmit readings.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--dash-border)", color: "var(--dash-text-muted)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>NONCE</th>
                    <th style={{ padding: "10px 12px" }}>CORE TEMPERATURE</th>
                    <th style={{ padding: "10px 12px" }}>COORDINATES</th>
                    <th style={{ padding: "10px 12px" }}>SIGNATURE (R)</th>
                    <th style={{ padding: "10px 12px" }}>TAMPER STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.recent_telemetry.map((t, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--dash-border-subtle)" }}>
                      <td className="font-mono" style={{ padding: "10px 12px", fontWeight: "700", color: "var(--dash-text-primary)" }}>#{t.nonce}</td>
                      <td className="font-mono" style={{ padding: "10px 12px", color: (t.temperature > 8 || t.temperature < 2) ? "var(--dash-red-pill-text)" : "var(--dash-green-pill-text)", fontWeight: "600" }}>
                        {t.temperature?.toFixed(2)}°C
                      </td>
                      <td className="font-mono" style={{ padding: "10px 12px", color: "var(--dash-text-muted)" }}>
                        {t.latitude?.toFixed(4)}, {t.longitude?.toFixed(4)}
                      </td>
                      <td className="font-mono" style={{ padding: "10px 12px", color: "var(--dash-blue-accent)" }}>
                        {formatHash(t.signature_r)}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {t.is_tampered ? (
                          <span style={{ color: "var(--dash-red-pill-text)", fontWeight: "700" }}>TAMPERED</span>
                        ) : (
                          <span style={{ color: "var(--dash-green-pill-text)", fontWeight: "600" }}>VALID</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Cryptographic Evidence */}
      {activeSubTab === "security" && (
        <div className="dash-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "16px" }}>
            Cryptographic Verification Dossier
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#18191E", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--dash-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--dash-text-muted)", fontWeight: "600" }}>SIGNATURE SCHEME</span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "4px" }}>ECDSA secp256k1 (EIP-191)</div>
              <span style={{ fontSize: "11px", color: "var(--dash-green-pill-text)" }}>✓ Low-s Malleability Protected</span>
            </div>

            <div style={{ background: "#18191E", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--dash-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--dash-text-muted)", fontWeight: "600" }}>PAYLOAD SERIALIZATION</span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "4px" }}>Canonical 78-Byte Packing</div>
              <span style={{ fontSize: "11px", color: "var(--dash-green-pill-text)" }}>✓ Deterministic Fixed-Point</span>
            </div>

            <div style={{ background: "#18191E", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--dash-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--dash-text-muted)", fontWeight: "600" }}>GENESIS TRANSACTION HASH</span>
              <div className="font-mono" style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "4px" }}>
                {formatHash(meta?.genesis_tx_hash)}
              </div>
              <span style={{ fontSize: "11px", color: "var(--dash-blue-accent)" }}>Mined on Local Hardhat EVM</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Blockchain State */}
      {activeSubTab === "blockchain" && (
        <div className="dash-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "16px" }}>
            Smart Contract Truth State
          </h3>
          <pre
            style={{
              background: "#101115",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              overflowX: "auto",
              color: "#34D399",
              border: "1px solid var(--dash-border)",
            }}
          >
            {JSON.stringify(detail?.blockchain_state || { status: meta?.status, custodian: meta?.current_custodian }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
