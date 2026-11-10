import React, { useState } from "react";
import { Icons } from "../ui/Icons";
import { api } from "../../services/api";

export default function HandoverModal({ isOpen, onClose, batch, onHandoverComplete }) {
  if (!isOpen || !batch) return null;

  const actors = [
    { label: "ColdLogix Fleet (Carrier)", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
    { label: "Apollo Specialty Hospital (Pharmacy)", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
  ];

  const currentCust = (batch?.current_custodian || "").toLowerCase();
  const eligibleActors = actors.filter((a) => a.address.toLowerCase() !== currentCust);
  const defaultRecipient = eligibleActors[0]?.address || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  React.useEffect(() => {
    if (batch) {
      const cur = (batch.current_custodian || "").toLowerCase();
      const valid = actors.filter((a) => a.address.toLowerCase() !== cur);
      if (valid.length > 0) {
        setRecipient(valid[0].address);
      }
      setStep(1);
      setError(null);
    }
  }, [batch?.batch_id, batch?.current_custodian]);

  async function handleInitiate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.initiateHandover({
        batch_id: batch.batch_id,
        recipient_address: recipient,
      });
      setTxHash(res.tx_hash);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to initiate custody handover on-chain.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.confirmHandover({
        batch_id: batch.batch_id,
        sender_address: batch.current_custodian,
      });
      setTxHash(res.tx_hash);
      onHandoverComplete();
      setTimeout(() => {
        onClose();
        setStep(1);
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to confirm custody handover.");
    } finally {
      setLoading(false);
    }
  }

  function formatAddress(addr) {
    if (!addr) return "0x000...000";
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}`;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ padding: "28px" }}>
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icons.ArrowRightLeft size={20} color="var(--dash-blue-accent)" />
            <h3 className="font-display" style={{ fontSize: "18px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
              2-of-2 Dual-Custody Handover
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

        {/* Multi-Sig Step Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            background: "#18191E",
            borderRadius: "var(--radius-sm)",
            marginBottom: "20px",
            border: "1px solid var(--dash-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step === 1 ? "var(--dash-blue-accent)" : "var(--dash-green-pill-text)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              1
            </span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: step === 1 ? "var(--dash-text-primary)" : "var(--dash-text-muted)" }}>
              Initiate Release
            </span>
          </div>

          <div style={{ width: "32px", height: "1px", background: "var(--dash-border)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step === 2 ? "var(--dash-blue-accent)" : "#2B2C33",
                color: step === 2 ? "#FFFFFF" : "var(--dash-text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              2
            </span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: step === 2 ? "var(--dash-text-primary)" : "var(--dash-text-muted)" }}>
              Confirm Receipt
            </span>
          </div>
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

        {/* Step 1: Current Custodian Initiates */}
        {step === 1 && (
          <form onSubmit={handleInitiate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "#18191E", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--dash-border)", fontSize: "12px" }}>
              <div style={{ color: "var(--dash-text-muted)", marginBottom: "2px" }}>Lot Specification:</div>
              <div style={{ fontWeight: "700", color: "var(--dash-text-primary)", fontSize: "13px" }}>{batch.product_name}</div>
              <div className="font-mono" style={{ fontSize: "11px", color: "var(--dash-blue-accent)", marginTop: "4px" }}>
                {formatAddress(batch.batch_id)}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px" }}>
                DESIGNATE RECIPIENT CUSTODIAN
              </label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
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
              >
                {eligibleActors.map((a, i) => (
                  <option key={i} value={a.address}>
                    {a.label} ({formatAddress(a.address)})
                  </option>
                ))}
              </select>
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
                <span>{loading ? "Signing on EVM..." : "Sign & Initiate Transfer"}</span>
                <Icons.ChevronRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Recipient Confirms */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                background: "var(--dash-green-pill-bg)",
                border: "1px solid rgba(52, 211, 153, 0.4)",
                padding: "14px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--dash-green-pill-text)", fontWeight: "700", marginBottom: "4px" }}>
                <Icons.CheckCircle2 size={16} />
                <span>Initiation Signature Verified On-Chain</span>
              </div>
              <p style={{ color: "var(--dash-text-secondary)", margin: 0 }}>
                Transaction Hash: <span className="font-mono">{formatAddress(txHash)}</span>
              </p>
            </div>

            <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", lineHeight: "1.6" }}>
              The releasing custodian’s signature has been registered on the blockchain. The receiving custodian must now co-sign with their authorized private key to complete atomic custody transfer.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                className="dash-pill-btn white-action"
                onClick={handleConfirm}
                disabled={loading}
                style={{ padding: "8px 18px" }}
              >
                <span>{loading ? "Confirming On-Chain..." : "Confirm & Settle Custody"}</span>
                <Icons.CheckCircle2 size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
