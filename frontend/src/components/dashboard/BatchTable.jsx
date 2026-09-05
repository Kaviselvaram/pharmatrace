import React from "react";
import { Play, Pause, ArrowRightLeft, QrCode, ShieldAlert } from "lucide-react";

export default function BatchTable({
  batches,
  activeBatchId,
  isSimulationRunning,
  onSelectBatch,
  onStartSimulation,
  onPauseSimulation,
  onOpenHandoverModal,
  onOpenQRModal,
}) {
  function getBadgeClass(status) {
    switch (status) {
      case "CREATED": return "badge badge-created";
      case "IN_TRANSIT": return "badge badge-transit";
      case "DELIVERED": return "badge badge-delivered";
      case "QUARANTINED": return "badge badge-quarantined";
      case "REPLENISHED": return "badge badge-replenished";
      default: return "badge";
    }
  }

  function formatAddress(addr) {
    if (!addr) return "Unknown";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }

  return (
    <div className="glass-panel" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}>
            Pharmaceutical Batch Registry
          </h3>
          <p style={{ fontSize: "12px", color: "#94A3B8" }}>
            Immutable digital twin lots verified by Solidity smart contracts
          </p>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-medium)", color: "#94A3B8", fontSize: "12px" }}>
              <th style={{ padding: "10px 12px" }}>BATCH ID</th>
              <th style={{ padding: "10px 12px" }}>PRODUCT NAME</th>
              <th style={{ padding: "10px 12px" }}>STATUS</th>
              <th style={{ padding: "10px 12px" }}>THRESHOLD</th>
              <th style={{ padding: "10px 12px" }}>CURRENT CUSTODIAN</th>
              <th style={{ padding: "10px 12px", textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const isSelected = activeBatchId === batch.batch_id;

              return (
                <tr
                  key={batch.batch_id}
                  onClick={() => onSelectBatch(batch.batch_id)}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    background: isSelected ? "rgba(0, 240, 255, 0.08)" : "transparent",
                    borderLeft: isSelected ? "3px solid var(--cyan-primary)" : "3px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <td className="font-mono" style={{ padding: "12px", fontSize: "12px", color: isSelected ? "#FFFFFF" : "var(--cyan-primary)", fontWeight: isSelected ? "700" : "500" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {isSelected && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--cyan-primary)", display: "inline-block", boxShadow: "0 0 6px var(--cyan-primary)" }}></span>}
                      {formatAddress(batch.batch_id)}
                    </div>
                  </td>
                  <td style={{ padding: "12px", fontWeight: "600", color: "#FFFFFF" }}>
                    {batch.product_name}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span className={getBadgeClass(batch.status)}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="font-mono" style={{ padding: "12px", fontSize: "12px", color: "#CBD5E1" }}>
                    {batch.min_temp_celsius}°C – {batch.max_temp_celsius}°C
                  </td>
                  <td className="font-mono" style={{ padding: "12px", fontSize: "12px", color: "#94A3B8" }}>
                    {formatAddress(batch.current_custodian)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                      {/* Simulation Play / Pause Button */}
                      {batch.status === "IN_TRANSIT" && (
                        <button
                          className={`btn ${isSelected && isSimulationRunning ? "btn-secondary" : "btn-primary"}`}
                          style={{ padding: "5px 10px", fontSize: "11px" }}
                          onClick={() => {
                            onSelectBatch(batch.batch_id);
                            if (isSelected && isSimulationRunning) {
                              onPauseSimulation(batch.batch_id);
                            } else {
                              onStartSimulation(batch.batch_id);
                            }
                          }}
                        >
                          {isSelected && isSimulationRunning ? <Pause size={13} /> : <Play size={13} />}
                          <span>{isSelected && isSimulationRunning ? "Pause" : "Simulate"}</span>
                        </button>
                      )}

                      {/* Handover Button */}
                      {(batch.status === "CREATED" || batch.status === "IN_TRANSIT") && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "5px 10px", fontSize: "11px" }}
                          onClick={() => onOpenHandoverModal(batch)}
                        >
                          <ArrowRightLeft size={13} />
                          <span>Handover</span>
                        </button>
                      )}

                      {/* QR Button */}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "5px 10px", fontSize: "11px" }}
                        onClick={() => onOpenQRModal(batch.batch_id)}
                      >
                        <QrCode size={13} />
                        <span>QR</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
