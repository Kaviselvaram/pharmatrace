import React, { useState } from "react";
import { X, PlusCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "../../services/api";

export default function CreateBatchModal({ isOpen, onClose, onCreated }) {
  const [productName, setProductName] = useState("Covaxin mRNA Booster (Lot #B74)");
  const [minTemp, setMinTemp] = useState(2.00);
  const [maxTemp, setMaxTemp] = useState(8.00);
  const [nodeId, setNodeId] = useState("REEFER-FLEET-04");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        product_name: productName,
        min_temp_celsius: parseFloat(minTemp),
        max_temp_celsius: parseFloat(maxTemp),
        node_id: nodeId,
      };
      const res = await api.createBatch(payload);
      onCreated(res);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to mint batch on EVM ledger.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(3, 5, 8, 0.8)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "520px",
        padding: "24px",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
      }}>
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <PlusCircle size={20} color="var(--cyan-primary)" />
            <h3 className="font-display" style={{ fontSize: "17px", fontWeight: "700", color: "#FFFFFF" }}>
              Mint New Pharmaceutical Batch
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: "rgba(255, 0, 85, 0.1)",
            border: "1px solid var(--crimson-alert)",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--crimson-alert)",
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "6px" }}>
              PRODUCT NAME & LOT SPECIFICATION
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                color: "#FFFFFF",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "6px" }}>
                MIN TEMPERATURE (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={minTemp}
                onChange={(e) => setMinTemp(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-sm)",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "6px" }}>
                MAX TEMPERATURE (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={maxTemp}
                onChange={(e) => setMaxTemp(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-sm)",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "6px" }}>
              SIMULATED EDGE SIGNER NODE ID
            </label>
            <input
              type="text"
              required
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="font-mono"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                color: "var(--cyan-primary)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          <div style={{
            background: "rgba(0, 240, 255, 0.05)",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            fontSize: "11px",
            color: "#94A3B8",
            marginTop: "6px",
          }}>
            ℹ️ This operation invokes the <code>createBatch(...)</code> smart contract transaction using the authorized Manufacturer private key on the local EVM.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Minting on EVM..." : "Confirm & Mint Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
