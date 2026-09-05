import React, { useState, useEffect } from "react";
import { QrCode, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Search, Copy, Check, ExternalLink } from "lucide-react";
import { api } from "../../services/api";

export default function QRVerifyPortal({ batches = [], defaultBatchId = "" }) {
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId || (batches[0]?.batch_id || ""));
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (defaultBatchId) {
      setSelectedBatchId(defaultBatchId);
      performVerification(defaultBatchId);
    } else if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].batch_id);
      performVerification(batches[0].batch_id);
    }
  }, [defaultBatchId, batches]);

  async function performVerification(idToVerify) {
    if (!idToVerify) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.verifyBatch(idToVerify);
      setVerificationData(data);
    } catch (err) {
      setError(err.message || "Failed to verify batch authenticity.");
      setVerificationData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isSafe = verificationData?.is_safe_to_administer;
  const isQuarantined = verificationData?.status === "QUARANTINED";
  const isTampered = verificationData?.tamper_detected;

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "10px 0" }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: "24px", marginBottom: "20px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(0, 240, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--cyan-primary)"
          }}>
            <QrCode size={20} color="var(--cyan-primary)" />
          </div>
          <h2 className="font-display" style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF" }}>
            Public Consumer & Clinical Verification Portal
          </h2>
        </div>
        <p style={{ fontSize: "13px", color: "#94A3B8", maxWidth: "600px", margin: "0 auto" }}>
          Instant cryptographic provenance verification. Patients and pharmacists scan the serialized package 2D DataMatrix to prove unbroken cold-chain compliance before injection.
        </p>

        {/* Verification Selector / Input */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "320px" }}>
            <input
              type="text"
              placeholder="Enter or select 32-byte Batch Hash..."
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="font-mono"
              style={{
                width: "100%",
                padding: "10px 14px 10px 36px",
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                color: "#FFFFFF",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "12px" }} />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => performVerification(selectedBatchId)}
            disabled={loading || !selectedBatchId}
          >
            {loading ? "Verifying On-Chain..." : "Verify Package"}
          </button>

          {/* Quick Select Buttons from Current Registry */}
          {batches.length > 0 && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center", width: "100%", justifyContent: "center", marginTop: "8px" }}>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Quick Test:</span>
              {batches.slice(0, 3).map((b, idx) => (
                <button
                  key={b.batch_id}
                  onClick={() => {
                    setSelectedBatchId(b.batch_id);
                    performVerification(b.batch_id);
                  }}
                  style={{
                    background: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: b.batch_id === selectedBatchId ? "var(--cyan-primary)" : "#CBD5E1",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  Lot #{idx + 1} ({b.status})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-panel" style={{ padding: "16px", marginBottom: "20px", borderColor: "var(--crimson-alert)", background: "rgba(255, 0, 85, 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={20} color="var(--crimson-alert)" />
            <span style={{ color: "var(--crimson-alert)", fontSize: "13px", fontWeight: "600" }}>{error}</span>
          </div>
        </div>
      )}

      {/* Verification Card */}
      {verificationData && (
        <div className="glass-panel" style={{
          padding: "24px",
          borderColor: isSafe ? "var(--emerald-success)" : "var(--crimson-alert)",
          boxShadow: isSafe ? "0 0 24px rgba(0, 255, 136, 0.1)" : "0 0 24px rgba(255, 0, 85, 0.15)",
        }}>
          {/* Top Verdict Banner */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "20px",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: isSafe ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 0, 85, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${isSafe ? "var(--emerald-success)" : "var(--crimson-alert)"}`,
              }}>
                {isSafe ? (
                  <ShieldCheck size={32} color="var(--emerald-success)" />
                ) : (
                  <ShieldAlert size={32} color="var(--crimson-alert)" />
                )}
              </div>
              <div>
                <div style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: isSafe ? "var(--emerald-success)" : "var(--crimson-alert)",
                  letterSpacing: "0.5px",
                }}>
                  {isSafe ? "AUTHENTIC & SAFE TO ADMINISTER" : (
                    isQuarantined ? "BATCH QUARANTINED — DO NOT ADMINISTER" : "INTEGRITY COMPROMISED"
                  )}
                </div>
                <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                  {isSafe
                    ? "Cryptographic telemetry confirms unbroken cold-chain storage within 2°C – 8°C limits."
                    : "Thermal threshold excursion or data manipulation detected on immutable ledger."}
                </div>
              </div>
            </div>

            <span className={`badge ${isSafe ? "badge-delivered" : "badge-quarantined"}`} style={{ fontSize: "12px", padding: "6px 12px" }}>
              LEDGER: {verificationData.status}
            </span>
          </div>

          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <h4 style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.5px" }}>
                Pharmaceutical Identity
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>PRODUCT NAME</div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#FFFFFF" }}>{verificationData.product_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>BATCH HASH (ID)</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="font-mono" style={{ fontSize: "12px", color: "var(--cyan-primary)" }}>
                      {verificationData.batch_id}
                    </span>
                    <button
                      onClick={() => handleCopy(verificationData.batch_id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: "2px" }}
                    >
                      {copied ? <Check size={14} color="var(--emerald-success)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>STORAGE SPECIFICATION</div>
                  <div className="font-mono" style={{ fontSize: "13px", color: "#CBD5E1" }}>
                    {verificationData.temperature_range_allowed}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.5px" }}>
                Custodial & Cryptographic Lineage
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>AUTHORIZED MANUFACTURER</div>
                  <div className="font-mono" style={{ fontSize: "12px", color: "#CBD5E1" }}>
                    {verificationData.manufacturer}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>CURRENT CUSTODIAN</div>
                  <div className="font-mono" style={{ fontSize: "12px", color: "#CBD5E1" }}>
                    {verificationData.current_custodian}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>TELEMETRY CHECKPOINTS</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={14} color="var(--emerald-success)" />
                    <span style={{ fontSize: "13px", color: "#FFFFFF" }}>
                      <b>{verificationData.total_checkpoints_recorded}</b> secp256k1 Signed Observations
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous Digital Recovery Notice if Quarantined */}
          {isQuarantined && (
            <div style={{
              background: "rgba(255, 0, 85, 0.08)",
              border: "1px solid rgba(255, 0, 85, 0.3)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              marginTop: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <AlertTriangle size={18} color="var(--crimson-alert)" />
                <span className="font-display" style={{ fontSize: "14px", fontWeight: "700", color: "var(--crimson-alert)" }}>
                  Autonomous Digital Recovery Activated
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#CBD5E1", margin: 0 }}>
                This package experienced a verified thermal excursion. The smart contract automatically permanently locked this batch into <code>QUARANTINED</code> status. A replenishment order has been automatically dispatched to prevent hospital supply stockouts.
              </p>
              {verificationData.replacement_batch_id && (
                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>Replacement Dispatch Batch:</span>
                  <span className="font-mono" style={{ fontSize: "12px", color: "var(--cyan-primary)", fontWeight: "600" }}>
                    {verificationData.replacement_batch_id}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Security Alert Log */}
          {verificationData.alerts && verificationData.alerts.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", marginBottom: "8px" }}>
                Incident Event Log
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {verificationData.alerts.map((a, i) => (
                  <div key={i} style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    background: "var(--bg-surface-elevated)",
                    borderLeft: `3px solid ${a.severity === "CRITICAL" ? "var(--crimson-alert)" : "var(--amber-warning)"}`,
                    fontSize: "12px",
                    color: "#CBD5E1",
                  }}>
                    <strong style={{ color: a.severity === "CRITICAL" ? "var(--crimson-alert)" : "var(--amber-warning)" }}>
                      [{a.type}]
                    </strong> {a.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
