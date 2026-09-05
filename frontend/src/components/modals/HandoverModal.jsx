import React, { useState } from "react";
import { X, ArrowRightLeft, ShieldCheck, CheckCircle2, AlertTriangle, UserCheck } from "lucide-react";
import { api } from "../../services/api";

export default function HandoverModal({ isOpen, onClose, batch, onHandoverComplete }) {
  if (!isOpen || !batch) return null;

  const [step, setStep] = useState(1); // 1: Initiate, 2: Confirm
  const [recipient, setRecipient] = useState("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"); // Default: Carrier
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const actors = [
    { label: "ColdLogix Fleet (Carrier)", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
    { label: "Apollo Specialty Hospital (Pharmacy)", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
  ];

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
        maxWidth: "540px",
        padding: "24px",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
      }}>
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ArrowRightLeft size={20} color="var(--cyan-primary)" />
            <h3 className="font-display" style={{ fontSize: "17px", fontWeight: "700", color: "#FFFFFF" }}>
              2-of-2 Multi-Sig Custody Handover
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Multi-Sig Step Indicator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-surface-elevated)",
          padding: "10px 16px",
          borderRadius: "var(--radius-sm)",
          marginBottom: "16px",
          border: "1px solid var(--border-subtle)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: step === 1 ? "var(--cyan-primary)" : "var(--emerald-success)",
              color: "#07090E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "700",
            }}>
              1
            </span>
            <span style={{ fontSize: "12px", color: step === 1 ? "var(--cyan-primary)" : "#CBD5E1", fontWeight: "600" }}>
              Signer A (Custodian)
            </span>
          </div>
          <span style={{ color: "var(--border-medium)" }}>→</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: step === 2 ? "var(--cyan-primary)" : "var(--bg-surface)",
              color: step === 2 ? "#07090E" : "#94A3B8",
              border: "1px solid var(--border-medium)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "700",
            }}>
              2
            </span>
            <span style={{ fontSize: "12px", color: step === 2 ? "var(--cyan-primary)" : "#64748B", fontWeight: "600" }}>
              Signer B (Recipient)
            </span>
          </div>
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

        {/* Current Batch Info */}
        <div style={{
          background: "rgba(0, 240, 255, 0.04)",
          border: "1px solid var(--border-subtle)",
          padding: "12px",
          borderRadius: "var(--radius-sm)",
          marginBottom: "16px",
        }}>
          <div style={{ fontSize: "11px", color: "#64748B" }}>TRANSFER TARGET BATCH</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#FFFFFF", marginTop: "2px" }}>
            {batch.product_name}
          </div>
          <div className="font-mono" style={{ fontSize: "11px", color: "var(--cyan-primary)", marginTop: "4px" }}>
            {batch.batch_id}
          </div>
          <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
            Current Custodian: <code className="font-mono">{batch.current_custodian.substring(0, 12)}...</code>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleInitiate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "6px" }}>
                DESIGNATED TRANSFER RECIPIENT
              </label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-sm)",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                {actors.map((a) => (
                  <option key={a.address} value={a.address}>
                    {a.label} ({a.address.substring(0, 10)}...)
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              fontSize: "11px",
              color: "#94A3B8",
              lineHeight: "1.4",
            }}>
              Notice: The smart contract will record a pending transfer. Custody remains with the current custodian until the recipient counter-signs the acceptance.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
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
                {loading ? "Signing on-chain..." : "Sign & Initiate Transfer"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{
              background: "rgba(0, 255, 136, 0.08)",
              border: "1px solid var(--emerald-success)",
              borderRadius: "var(--radius-sm)",
              padding: "12px",
              fontSize: "12px",
              color: "#CBD5E1",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--emerald-success)", fontWeight: "600", marginBottom: "4px" }}>
                <CheckCircle2 size={16} /> Handover Initiated On-Chain
              </div>
              <div>Transaction Hash: <span className="font-mono" style={{ color: "var(--cyan-primary)" }}>{txHash?.substring(0, 18)}...</span></div>
              <div style={{ marginTop: "6px" }}>Recipient must now counter-sign to accept physical & legal custody of the cargo.</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Counter-Signing on EVM..." : "Counter-Sign & Finalize Custody"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
