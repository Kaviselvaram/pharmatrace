import React, { useState, useEffect } from "react";
import { Icons } from "../ui/Icons";
import { api } from "../../services/api";

export default function RecoveryView({
  batches = [],
  onRefreshBatches,
}) {
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [replacementId, setReplacementId] = useState("");
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const quarantinedBatches = batches.filter((b) => b.status === "QUARANTINED");
  const replenishedBatches = batches.filter((b) => b.status === "REPLENISHED");

  // Eligible replacements are active lots from manufacturer that are not quarantined or replenished
  const eligibleReplacements = batches.filter(
    (b) => (b.status === "CREATED" || b.status === "IN_TRANSIT") && b.batch_id !== selectedBatchId
  );

  // Auto-select first quarantined lot if none selected
  useEffect(() => {
    if (quarantinedBatches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(quarantinedBatches[0].batch_id);
    }
  }, [quarantinedBatches, selectedBatchId]);

  function formatAddress(addr) {
    if (!addr) return "0x000...000";
    if (addr.length <= 16) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 4)}`;
  }

  // 1-Click Autonomous End-to-End Recovery: Mints AND Links on-chain in one atomic action
  async function handleAutonomousRecovery(targetBatch) {
    setSelectedBatchId(targetBatch.batch_id);
    setLoading(true);
    setFeedback({
      type: "info",
      text: `Executing autonomous recovery on-chain for lot ${formatAddress(targetBatch.batch_id)}...`,
    });

    try {
      const res = await api.autonomousRecovery(targetBatch.batch_id);
      setFeedback({
        type: "success",
        text: `✓ Autonomous recovery successful! Quarantined lot superseded on-chain by replacement ${formatAddress(res.replacement_batch_id)} (Tx: ${formatAddress(res.tx_hash || "")}). Status transitioned to REPLENISHED.`,
      });
      setReplacementId("");

      if (onRefreshBatches) {
        await onRefreshBatches();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: `Autonomous recovery failed: ${err.message || err}`,
      });
    } finally {
      setLoading(false);
    }
  }

  // Prepare replenishment: mints replacement and fills the form below
  async function handlePrepareReplenishment(targetBatch) {
    setSelectedBatchId(targetBatch.batch_id);
    setMinting(true);
    setFeedback({
      type: "info",
      text: `Minting authentic expedited replacement lot on-chain for ${formatAddress(targetBatch.batch_id)}...`,
    });

    try {
      const repLot = await api.createBatch({
        product_name: `EXPEDITED REPLACEMENT - ${targetBatch.product_name}`,
        min_temp_celsius: targetBatch.min_temp_celsius ?? 2.0,
        max_temp_celsius: targetBatch.max_temp_celsius ?? 8.0,
      });

      setReplacementId(repLot.batch_id);
      setFeedback({
        type: "success",
        text: `Expedited replacement lot ${formatAddress(repLot.batch_id)} minted on-chain. Form populated below — click "Authorize Replacement Lot" to bind.`,
      });
      if (onRefreshBatches) {
        await onRefreshBatches();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: `Failed to mint replacement lot on-chain: ${err.message}`,
      });
    } finally {
      setMinting(false);
    }
  }

  // Manually authorize replacement linkage
  async function handleLinkReplacement(e) {
    if (e) e.preventDefault();
    if (!selectedBatchId || !replacementId) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.linkReplacement(selectedBatchId, {
        replacement_batch_id: replacementId,
      });
      setFeedback({
        type: "success",
        text: `Successfully linked replacement lot ${formatAddress(replacementId)} on-chain! Status transitioned to REPLENISHED (Tx: ${formatAddress(res.tx_hash || "")}).`,
      });
      setReplacementId("");
      if (onRefreshBatches) {
        await onRefreshBatches();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to link replacement lot on-chain.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Trigger demo thermal excursion breach to test quarantine flow
  async function handleTriggerDemoBreach() {
    setMinting(true);
    setFeedback({
      type: "info",
      text: "Simulating severe cold-chain breach (+14.5°C) on-chain to trigger autonomous smart contract quarantine...",
    });

    try {
      const res = await api.triggerDemoQuarantine();
      setFeedback({
        type: "error",
        text: `⚡ Cold-Chain Excursion (+14.5°C) triggered! Smart contract autonomously quarantined lot ${formatAddress(res.batch_id)} on-chain. Ready for replenishment.`,
      });
      setSelectedBatchId(res.batch_id);
      if (onRefreshBatches) {
        await onRefreshBatches();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: `Failed to trigger demo excursion: ${err.message}`,
      });
    } finally {
      setMinting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "32px" }}>
      {/* Top Banner */}
      <div className="dash-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icons.RotateCcw size={22} color="var(--dash-blue-accent)" />
            <h2 className="font-display" style={{ fontSize: "20px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
              Quarantine & Autonomous Recovery Workflow
            </h2>
          </div>

          <button
            type="button"
            className="dash-pill-btn"
            disabled={minting || loading}
            onClick={handleTriggerDemoBreach}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              background: "rgba(239, 68, 68, 0.15)",
              borderColor: "rgba(239, 68, 68, 0.4)",
              color: "var(--dash-red-pill-text)",
            }}
            title="Inject an authentic +14.5°C temperature spike to demonstrate EVM quarantine"
          >
            <Icons.Zap size={13} color="var(--dash-red-pill-text)" />
            <span>{minting ? "Simulating Breach..." : "⚡ Trigger Demo Excursion Breach"}</span>
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", maxWidth: "720px", lineHeight: "1.6" }}>
          When a pharmaceutical lot experiences an unrecoverable thermal excursion (outside 2.00°C – 8.00°C) or cryptographic tampering, the smart contract immediately freezes the lot into QUARANTINED state. The autonomous replenishment protocol mints and links an expedited replacement lot on-chain to ensure unbroken clinical supply.
        </p>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className="dash-card"
          style={{
            padding: "12px 18px",
            background: feedback.type === "success"
              ? "rgba(16, 185, 129, 0.15)"
              : feedback.type === "info"
              ? "rgba(79, 128, 248, 0.15)"
              : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${
              feedback.type === "success"
                ? "rgba(16, 185, 129, 0.4)"
                : feedback.type === "info"
                ? "rgba(79, 128, 248, 0.4)"
                : "rgba(239, 68, 68, 0.4)"
            }`,
            color: "var(--dash-text-primary)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {feedback.type === "success" ? (
              <Icons.CheckCircle2 size={16} color="var(--dash-green-pill-text)" />
            ) : feedback.type === "info" ? (
              <Icons.RotateCcw size={16} color="var(--dash-blue-accent)" />
            ) : (
              <Icons.AlertTriangle size={16} color="var(--dash-red-pill-text)" />
            )}
            <span>{feedback.text}</span>
          </div>

          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: "none", border: "none", color: "var(--dash-text-muted)", cursor: "pointer", fontSize: "13px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Quarantined Lots Center */}
      <div className="dash-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            Active Quarantined Lots ({quarantinedBatches.length})
          </h3>
        </div>

        {quarantinedBatches.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center", color: "var(--dash-text-muted)" }}>
            <Icons.CheckCircle2 size={32} color="var(--dash-green-pill-text)" style={{ margin: "0 auto 8px auto" }} />
            <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--dash-text-primary)" }}>
              Zero Active Quarantines
            </p>
            <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", marginTop: "4px", marginBottom: "16px" }}>
              All registered lots are operating safely within the nominal cold-chain envelope.
            </p>
            <button
              type="button"
              className="dash-pill-btn"
              onClick={handleTriggerDemoBreach}
              disabled={minting}
              style={{
                fontSize: "12px",
                padding: "8px 16px",
                background: "rgba(239, 68, 68, 0.15)",
                borderColor: "rgba(239, 68, 68, 0.4)",
                color: "var(--dash-red-pill-text)",
              }}
            >
              <Icons.Zap size={13} color="var(--dash-red-pill-text)" />
              <span>⚡ Simulate Cold-Chain Breach (Quarantine a Lot)</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {quarantinedBatches.map((batch) => (
              <div
                key={batch.batch_id}
                style={{
                  padding: "16px 20px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  background: "rgba(239, 68, 68, 0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className="font-mono" style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-red-pill-text)" }}>
                      {formatAddress(batch.batch_id)}
                    </span>
                    <span className="dash-status-badge await" style={{ background: "rgba(239, 68, 68, 0.2)", color: "var(--dash-red-pill-text)" }}>
                      quarantine
                    </span>
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                    {batch.product_name}
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
                    Reason: Thermal Excursion / Cold-chain boundary breach detected on EVM
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {/* 1-Click Autonomous End-to-End Recovery */}
                  <button
                    className="dash-pill-btn white-action"
                    disabled={loading || minting}
                    onClick={() => handleAutonomousRecovery(batch)}
                    style={{
                      padding: "8px 14px",
                      fontSize: "12px",
                      background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                      color: "#FFFFFF",
                      borderColor: "rgba(59, 130, 246, 0.6)",
                    }}
                    title="Mints genuine replacement on-chain and binds lineage in 1 click"
                  >
                    <Icons.RotateCcw size={13} color="#FFFFFF" />
                    <span>{loading && selectedBatchId === batch.batch_id ? "Recovering On-Chain..." : "⚡ 1-Click Autonomous Recovery"}</span>
                  </button>

                  {/* Prepare Replenishment (Populate form) */}
                  <button
                    className="dash-pill-btn"
                    disabled={minting || loading}
                    onClick={() => handlePrepareReplenishment(batch)}
                    style={{ padding: "8px 12px", fontSize: "12px" }}
                    title="Mint replacement lot and fill manual authorization form"
                  >
                    <Icons.Sliders size={13} />
                    <span>{minting && selectedBatchId === batch.batch_id ? "Minting..." : "Prepare Form"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Autonomous Replacement Link Form */}
      <div className="dash-card" style={{ padding: "24px" }}>
        <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "6px" }}>
          Link Expedited Replacement Lot On-Chain
        </h3>
        <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", marginBottom: "16px" }}>
          Invokes <code>linkReplacementBatch()</code> on the PharmaSupplyChain contract to bind the genuine replacement digital twin to the spoiled lot’s lineage.
        </p>

        <form onSubmit={handleLinkReplacement} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "680px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px" }}>
              TARGET QUARANTINED LOT
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              style={{
                width: "100%",
                background: "#18191E",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text-primary)",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                outline: "none",
              }}
              required
            >
              <option value="">Select Quarantined Lot...</option>
              {quarantinedBatches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.product_name} ({formatAddress(b.batch_id)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)" }}>
                SELECT ELIGIBLE REPLACEMENT LOT (EXISTS ON-CHAIN)
              </label>
              {selectedBatchId && (
                <button
                  type="button"
                  className="dash-pill-btn"
                  style={{ fontSize: "11px", padding: "3px 10px", background: "rgba(79, 128, 248, 0.15)" }}
                  disabled={minting || loading}
                  onClick={() => {
                    const target = batches.find((b) => b.batch_id === selectedBatchId) || quarantinedBatches[0];
                    if (target) handlePrepareReplenishment(target);
                  }}
                >
                  <Icons.PlusCircle size={12} color="var(--dash-blue-accent)" />
                  <span>{minting ? "Minting..." : "⚡ Mint New Replacement Lot"}</span>
                </button>
              )}
            </div>
            <select
              value={replacementId}
              onChange={(e) => setReplacementId(e.target.value)}
              style={{
                width: "100%",
                background: "#18191E",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text-primary)",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                outline: "none",
              }}
            >
              <option value="">-- Choose from registered valid lots or enter hash below --</option>
              {replacementId && !eligibleReplacements.some((b) => b.batch_id === replacementId) && (
                <option value={replacementId}>
                  Newly Minted Replacement ({formatAddress(replacementId)})
                </option>
              )}
              {eligibleReplacements.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.product_name} ({formatAddress(b.batch_id)}) - Status: {b.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px" }}>
              EXPEDITED REPLACEMENT LOT HASH (bytes32)
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={replacementId}
              onChange={(e) => setReplacementId(e.target.value)}
              style={{
                width: "100%",
                background: "#18191E",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text-primary)",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                outline: "none",
              }}
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="dash-pill-btn white-action"
              disabled={loading || minting || !selectedBatchId || !replacementId}
              style={{ padding: "9px 22px", fontSize: "12px" }}
            >
              <Icons.RotateCcw size={14} />
              <span>{loading ? "Linking On-Chain..." : "Authorize Replacement Lot"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Replenished Lots Lineage */}
      {replenishedBatches.length > 0 && (
        <div className="dash-card" style={{ padding: "20px" }}>
          <h3 className="font-display" style={{ fontSize: "15px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "12px" }}>
            Replenished Lots Audit Lineage ({replenishedBatches.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {replenishedBatches.map((b) => (
              <div
                key={b.batch_id}
                style={{
                  padding: "14px 18px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(56, 189, 248, 0.08)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span className="font-mono" style={{ fontWeight: "700", color: "var(--dash-status-replenished-text)" }}>
                      Parent: {formatAddress(b.batch_id)}
                    </span>
                    <span style={{ color: "var(--dash-text-muted)" }}>➔</span>
                    <span className="font-mono" style={{ fontWeight: "700", color: "var(--dash-blue-accent)" }}>
                      Replacement: {formatAddress(b.replacement_batch_id)}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
                    {b.product_name}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="dash-pill-btn"
                    style={{ padding: "4px 10px", fontSize: "11px" }}
                    onClick={() => {
                      window.location.hash = `verify/${b.batch_id}`;
                    }}
                  >
                    <Icons.QrCode size={11} color="var(--dash-blue-accent)" />
                    <span>Verify Parent</span>
                  </button>
                  {b.replacement_batch_id && (
                    <button
                      type="button"
                      className="dash-pill-btn"
                      style={{ padding: "4px 10px", fontSize: "11px", background: "rgba(79, 128, 248, 0.15)" }}
                      onClick={() => {
                        window.location.hash = `verify/${b.replacement_batch_id}`;
                      }}
                    >
                      <Icons.QrCode size={11} color="var(--dash-blue-accent)" />
                      <span>Verify Replacement</span>
                    </button>
                  )}
                  <span className="dash-status-badge replenished">replenished</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
