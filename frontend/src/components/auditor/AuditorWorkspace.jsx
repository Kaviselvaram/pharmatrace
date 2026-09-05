import React, { useState, useEffect } from "react";
import { FileText, Download, Copy, Check, ShieldCheck, AlertCircle, CheckCircle2, FileCheck } from "lucide-react";
import { api } from "../../services/api";

export default function AuditorWorkspace({ batches = [], activeBatchId = "" }) {
  const [selectedBatchId, setSelectedBatchId] = useState(activeBatchId || (batches[0]?.batch_id || ""));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeBatchId) {
      setSelectedBatchId(activeBatchId);
      loadReport(activeBatchId);
    } else if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].batch_id);
      loadReport(batches[0].batch_id);
    }
  }, [activeBatchId, batches]);

  async function loadReport(batchId) {
    if (!batchId) return;
    setLoading(true);
    try {
      const data = await api.getAuditReport(batchId);
      setReport(data);
    } catch (err) {
      console.error("Failed to load audit report", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!report?.markdown_report) return;
    navigator.clipboard.writeText(report.markdown_report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!report?.markdown_report) return;
    const blob = new Blob([report.markdown_report], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AUDIT_REPORT_${selectedBatchId.substring(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const complianceStandards = [
    {
      code: "FDA 21 CFR § 11.10(a)",
      title: "System Validation & Integrity",
      desc: "Mathematical certainty of telemetry validation via ECDSA secp256k1 & Keccak-256.",
      status: "COMPLIANT",
    },
    {
      code: "FDA 21 CFR § 11.10(e)",
      title: "Immutable Audit Trails",
      desc: "Computer-generated, timestamped on-chain event logs that cannot be altered or overwritten.",
      status: "COMPLIANT",
    },
    {
      code: "FDA 21 CFR § 11.50",
      title: "Signature Manifestation",
      desc: "EIP-191 standardized digital signatures binding signer identity, timestamp, and coordinates.",
      status: "COMPLIANT",
    },
    {
      code: "CDSCO / WHO GSP",
      title: "Automated Cold-Chain Quarantine",
      desc: "Algorithmic enforcement of 2.00°C – 8.00°C limits triggering autonomous replenishment.",
      status: report?.cold_chain_compliant ? "COMPLIANT" : "BREACH DETECTED",
    },
  ];

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "10px 0" }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: "20px 24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FileCheck size={22} color="var(--purple-accent)" />
              <h2 className="font-display" style={{ fontSize: "18px", fontWeight: "700", color: "#FFFFFF" }}>
                Regulatory Compliance & Audit Inspector
              </h2>
            </div>
            <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
              Designed to align with FDA 21 CFR Part 11, CDSCO, and WHO Good Storage and Distribution Practices.
            </p>
          </div>

          {/* Batch Selector dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Audit Target:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                loadReport(e.target.value);
              }}
              style={{
                background: "var(--bg-surface-elevated)",
                color: "var(--cyan-primary)",
                border: "1px solid var(--border-medium)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.product_name} ({b.batch_id.substring(0, 10)}...) - {b.status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Compliance Standards Checklist */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
        marginBottom: "20px",
      }}>
        {complianceStandards.map((std, i) => (
          <div key={i} className="glass-panel" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span className="font-mono" style={{ fontSize: "11px", color: "var(--purple-accent)", fontWeight: "600" }}>
                {std.code}
              </span>
              <span style={{
                fontSize: "10px",
                fontWeight: "700",
                color: std.status === "COMPLIANT" ? "var(--emerald-success)" : "var(--crimson-alert)",
                background: std.status === "COMPLIANT" ? "rgba(0, 255, 136, 0.1)" : "rgba(255, 0, 85, 0.1)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}>
                {std.status}
              </span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#FFFFFF", marginBottom: "4px" }}>
              {std.title}
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: "1.4" }}>
              {std.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Report Document Box */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={18} color="var(--cyan-primary)" />
            <span className="font-display" style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>
              Generated Regulatory Certificate (Markdown)
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn btn-secondary"
              onClick={handleCopy}
              disabled={!report || loading}
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              {copied ? <Check size={14} color="var(--emerald-success)" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy Markdown"}</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={!report || loading}
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              <Download size={14} />
              <span>Download .md</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            Generating verifiable on-chain audit report...
          </div>
        ) : report ? (
          <div style={{
            background: "var(--bg-surface-elevated)",
            padding: "20px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
          }}>
            <pre style={{
              margin: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "#CBD5E1",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: "1.6",
            }}>
              {report.markdown_report}
            </pre>
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            No batch selected for regulatory audit.
          </div>
        )}
      </div>
    </div>
  );
}
