import React, { useState, useEffect } from "react";
import { Icons } from "../ui/Icons";
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
      title: "System Validation & Mathematical Integrity",
      desc: "Deterministic telemetry validation via canonical 78-byte packing and ECDSA secp256k1 recovery.",
      status: "COMPLIANT",
    },
    {
      code: "FDA 21 CFR § 11.10(e)",
      title: "Immutable Event Audit Trails",
      desc: "Computer-generated, timestamped on-chain event logs (BatchCreated, TelemetryVerified, CustodyTransferred).",
      status: "COMPLIANT",
    },
    {
      code: "FDA 21 CFR § 11.50",
      title: "Signature Manifestation & Binding",
      desc: "EIP-191 standardized electronic signatures cryptographically binding signer address, timestamp, and coordinates.",
      status: "COMPLIANT",
    },
    {
      code: "CDSCO / WHO GDP",
      title: "Automated Cold-Chain Quarantine Control",
      desc: "Algorithmic enforcement of 2.00°C – 8.00°C limits triggering automated transition to QUARANTINED.",
      status: report?.cold_chain_compliant ? "COMPLIANT" : "BREACH DETECTED",
    },
  ];

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Banner */}
      <div className="dash-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Icons.FileText size={22} color="var(--dash-blue-accent)" />
              <h2 className="font-display" style={{ fontSize: "20px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                Regulatory Compliance & Forensic Audit Inspector
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", marginTop: "4px" }}>
              Engineered to align with FDA 21 CFR Part 11 electronic records, CDSCO, and WHO Good Distribution Practices (GDP).
            </p>
          </div>

          {/* Batch Selector dropdown & refresh */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>Target lot:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                loadReport(e.target.value);
              }}
              style={{
                background: "#18191E",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text-primary)",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "12px",
                maxWidth: "200px",
                outline: "none",
              }}
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.product_name} ({b.status})
                </option>
              ))}
            </select>

            <button
              className="circle-arrow-btn"
              onClick={() => loadReport(selectedBatchId)}
              title="Refresh Audit Data"
            >
              <Icons.RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Regulatory Standards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {complianceStandards.map((std, idx) => (
          <div key={idx} className="dash-card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="font-mono" style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-blue-accent)" }}>
                {std.code}
              </span>
              <span className={`dash-status-badge ${std.status === "COMPLIANT" ? "delivered" : "await"}`}>
                {std.status.toLowerCase()}
              </span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "4px" }}>
              {std.title}
            </div>
            <p style={{ fontSize: "11px", color: "var(--dash-text-muted)", lineHeight: "1.4", margin: 0 }}>
              {std.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Generated Markdown Report Preview */}
      <div className="dash-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
              Deterministic Audit Report Artifact
            </h3>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              Cryptographically verified offline forensic export
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="dash-pill-btn"
              onClick={handleCopy}
              disabled={!report?.markdown_report}
            >
              {copied ? <Icons.Check size={13} color="var(--dash-green-pill-text)" /> : <Icons.Copy size={13} />}
              <span>{copied ? "Copied" : "Copy Markdown"}</span>
            </button>
            <button
              className="dash-pill-btn white-action"
              onClick={handleDownload}
              disabled={!report?.markdown_report}
            >
              <Icons.Download size={13} />
              <span>Download Report (.md)</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--dash-text-muted)" }}>
            Synthesizing cryptographic evidence and verifying on-chain event receipts...
          </div>
        ) : !report?.markdown_report ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--dash-text-muted)" }}>
            Select a batch lot above to inspect its forensic audit trail.
          </div>
        ) : (
          <pre
            style={{
              background: "#101115",
              padding: "20px",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              overflowX: "auto",
              color: "#34D399",
              border: "1px solid var(--dash-border)",
              maxHeight: "440px",
              lineHeight: "1.5",
            }}
          >
            {report.markdown_report}
          </pre>
        )}
      </div>
    </div>
  );
}
