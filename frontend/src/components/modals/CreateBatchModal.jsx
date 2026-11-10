import React, { useState } from "react";
import { Icons } from "../ui/Icons";
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
    const minVal = parseFloat(minTemp);
    const maxVal = parseFloat(maxTemp);
    if (isNaN(minVal) || isNaN(maxVal) || minVal >= maxVal) {
      setError(`Invalid temperature envelope: Min temperature (${minTemp}°C) must be strictly less than Max temperature (${maxTemp}°C).`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        product_name: productName,
        min_temp_celsius: minVal,
        max_temp_celsius: maxVal,
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
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ padding: "28px" }}>
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icons.PlusCircle size={20} color="var(--dash-blue-accent)" />
            <h3 className="font-display" style={{ fontSize: "18px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
              Mint New Pharmaceutical Lot
            </h3>
          </div>
          <button
            onClick={onClose}
            className="circle-arrow-btn"
            style={{ width: "30px", height: "30px", background: "#1F2026" }}
          >
            <Icons.X size={15} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "var(--dash-red-pill-bg)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--dash-red-pill-text)",
            }}
          >
            <Icons.AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px" }}>
              PRODUCT SPECIFICATION & LOT IDENTIFIER
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{
                width: "100%",
                background: "#18191E",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text-primary)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px" }}>
                MIN TEMPERATURE (°C)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={minTemp}
                onChange={(e) => setMinTemp(e.target.value)}
                style={{
                  width: "100%",
                  background: "#18191E",
                  border: "1px solid var(--dash-border)",
                  color: "var(--dash-text-primary)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px" }}>
                MAX TEMPERATURE (°C)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={maxTemp}
                onChange={(e) => setMaxTemp(e.target.value)}
                style={{
                  width: "100%",
                  background: "#18191E",
                  border: "1px solid var(--dash-border)",
                  color: "var(--dash-text-primary)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px" }}>
              EDGE REEFER SENSOR IDENTIFIER
            </label>
            <input
              type="text"
              required
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              style={{
                width: "100%",
                background: "#18191E",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text-primary)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              background: "#18191E",
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--dash-border)",
              fontSize: "11px",
              color: "var(--dash-text-muted)",
            }}
          >
            Mints lot on <code>PharmaSupplyChain.sol</code> via Hardhat test account #1 (Manufacturer: <code>0x7099...79C8</code>).
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              className="dash-pill-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dash-pill-btn white-action"
              disabled={loading}
              style={{ padding: "8px 18px" }}
            >
              <Icons.PlusCircle size={14} />
              <span>{loading ? "Minting On-Chain..." : "Mint Batch Lot"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
