import React, { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { Icons } from "../ui/Icons";
import { api } from "../../services/api";

export function cleanHashInput(text) {
  if (!text) return "";
  let clean = String(text).trim();

  // Strip error prefixes / recursive error messages
  if (clean.includes("not found in registry") || clean.includes("Batch lot")) {
    const hexMatch = clean.match(/(?:0x)?([a-fA-F0-9]{64})/);
    if (hexMatch) {
      clean = hexMatch[1];
    } else {
      const quoteMatch = clean.match(/['"](0x[a-fA-F0-9]+|[a-fA-F0-9]+)['"]/);
      if (quoteMatch) clean = quoteMatch[1];
    }
  }

  // Strip surrounding quotes
  clean = clean.replace(/^['"]+|['"]+$/g, "");
  // Strip UI prefixes like № or #
  clean = clean.replace(/^[№#\s]+/, "");

  // If URL with hash verify was pasted, e.g. http://localhost:5174/#verify/0x...
  if (clean.includes("#verify/")) {
    clean = clean.split("#verify/")[1].split("?")[0];
  } else if (clean.includes("?batch=")) {
    clean = clean.split("?batch=")[1].split("&")[0];
  } else if (clean.includes("?id=")) {
    clean = clean.split("?id=")[1].split("&")[0];
  }

  // If copied from explorer like: "BLOCK #168  0x2f7acd140c6ba80156792fd7d45802124c7b50dc330b7caa49a16e76d8ac091e"
  const explorerMatch = clean.match(/(?:BLOCK\s+#?\d+|Tx\s+Hash:?|Lot:?)\s*(0x[a-fA-F0-9]{64})/i);
  if (explorerMatch) {
    clean = explorerMatch[1];
  } else {
    // If copied text contains an isolated 64-char hex hash
    const singleHashMatch = clean.match(/\b(0x[a-fA-F0-9]{64})\b/);
    if (singleHashMatch) {
      clean = singleHashMatch[1];
    }
  }

  // Deduplicate repeated 64-hex string (128 characters)
  const hexOnly = clean.replace(/^0x/i, "");
  if (hexOnly.length === 128 && hexOnly.slice(0, 64).toLowerCase() === hexOnly.slice(64).toLowerCase()) {
    clean = "0x" + hexOnly.slice(0, 64);
  } else if (clean.length === 64 && !clean.startsWith("0x")) {
    clean = "0x" + clean;
  }

  return clean.trim();
}

export default function QRVerifyPortal({
  batches = [],
  defaultBatchId = "",
  onSelectBatch,
  onViewBatchDetails,
}) {
  const [selectedBatchId, setSelectedBatchId] = useState(() => cleanHashInput(defaultBatchId) || batches[0]?.batch_id || "");
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [lastVerifiedId, setLastVerifiedId] = useState("");

  const canvasRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Core verification function
  const performVerification = useCallback(async (idToVerify) => {
    const cleanId = cleanHashInput(idToVerify);
    if (!cleanId) return;

    setSelectedBatchId(cleanId);
    setLoading(true);
    setError(null);
    try {
      const data = await api.verifyBatch(cleanId);
      setVerificationData(data);
      setLastVerifiedId(data.batch_id || cleanId);
      // Sync URL hash without triggering extra page reloads
      if (window.location.hash !== `#verify/${data.batch_id}`) {
        window.history.replaceState(null, "", `#verify/${data.batch_id}`);
      }
    } catch (err) {
      let msg = err.message || "Failed to verify batch authenticity.";
      if (msg.includes("not found in registry")) {
        msg = "Lot identifier not found in registry or on-chain EVM storage. Check hash format or select an active test lot.";
      }
      setError(msg);
      setVerificationData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update when defaultBatchId prop changes
  useEffect(() => {
    if (defaultBatchId) {
      const clean = cleanHashInput(defaultBatchId);
      setSelectedBatchId(clean);
      performVerification(clean);
    } else if (batches.length > 0 && !selectedBatchId) {
      const initial = batches[0].batch_id;
      setSelectedBatchId(initial);
      performVerification(initial);
    }
  }, [defaultBatchId]); // DO NOT depend on batches array to avoid overwriting user typing

  // Generate QR Code when verificationData changes
  useEffect(() => {
    if (!verificationData?.batch_id) {
      setQrDataUrl("");
      return;
    }

    const publicUrl = `${window.location.origin}${window.location.pathname}#verify/${verificationData.batch_id}`;

    // Render on canvas
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        publicUrl,
        {
          width: 180,
          margin: 2,
          color: {
            dark: "#0F1117",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
        },
        (err) => {
          if (err) console.error("QR Canvas Error:", err);
        }
      );
    }

    // Generate DataURL for download
    QRCode.toDataURL(
      publicUrl,
      {
        width: 400,
        margin: 2,
        color: {
          dark: "#0F1117",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      },
      (err, url) => {
        if (!err && url) setQrDataUrl(url);
      }
    );
  }, [verificationData]);

  // Instant onPaste handler
  const handlePaste = (e) => {
    const pastedText = e.clipboardData ? e.clipboardData.getData("text") : "";
    if (pastedText) {
      const clean = cleanHashInput(pastedText);
      setSelectedBatchId(clean);
      performVerification(clean);
    }
  };

  // Clipboard read button handler
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const clean = cleanHashInput(text);
          setSelectedBatchId(clean);
          performVerification(clean);
        }
      } else {
        inputRef.current?.focus();
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  // Debounced input change handler
  const handleInputChange = (val) => {
    setSelectedBatchId(val);
    const clean = cleanHashInput(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Auto-verify if 64 or 66 character hex string or >= 8 chars with debounce
    if (clean.length === 64 || clean.length === 66) {
      performVerification(clean);
    } else if (clean.length >= 8) {
      debounceTimerRef.current = setTimeout(() => {
        performVerification(clean);
      }, 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      performVerification(selectedBatchId);
    }
  };

  const handleCopyHash = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#verify/${verificationData?.batch_id || selectedBatchId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `pharmatrace_lot_${verificationData?.batch_id?.substring(0, 10)}_qr.png`;
    a.click();
  };

  function formatAddress(addr) {
    if (!addr) return "0x000...000";
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 8)}`;
  }

  const isSafe = verificationData?.is_safe_to_administer;
  const isQuarantined = verificationData?.status === "QUARANTINED" || verificationData?.cold_chain_breached;
  const isReplenished = verificationData?.status === "REPLENISHED";
  const isTampered = verificationData?.tamper_detected;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Top Search & Paste Header Card */}
      <div className="dash-card" style={{ padding: "32px 24px", textAlign: "center", marginBottom: "20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(79, 128, 248, 0.15)",
            border: "1px solid rgba(79, 128, 248, 0.3)",
            padding: "4px 14px",
            borderRadius: "var(--radius-full)",
            marginBottom: "14px",
          }}
        >
          <Icons.QrCode size={15} color="var(--dash-blue-accent)" />
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-blue-accent)", letterSpacing: "0.5px" }}>
            CLINICAL 2D DATAMATRIX & CRYPTOGRAPHIC PROVENANCE
          </span>
        </div>

        <h1 className="font-display" style={{ fontSize: "26px", fontWeight: "800", color: "var(--dash-text-primary)", margin: "0 0 8px 0" }}>
          Verify Pharmaceutical Lot Authenticity
        </h1>

        <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", maxWidth: "600px", margin: "0 auto 22px auto", lineHeight: "1.6" }}>
          Paste any 32-byte lot hash, replacement ID, or transaction hash. The cryptographic engine verifies unbroken cold-chain compliance and on-chain ECDSA signatures in real time.
        </p>

        {/* Input & Action Controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
            <Icons.Search size={16} color="var(--dash-text-muted)" style={{ position: "absolute", left: "14px", top: "12px" }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Paste or enter lot hash ID (e.g. 0x080067...)"
              value={selectedBatchId}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                background: "#14151A",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text-primary)",
                padding: "9px 14px 9px 38px",
                borderRadius: "var(--radius-full)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                outline: "none",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
                transition: "border-color 0.15s ease",
              }}
            />
            {selectedBatchId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBatchId("");
                  inputRef.current?.focus();
                }}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "10px",
                  background: "none",
                  border: "none",
                  color: "var(--dash-text-muted)",
                  cursor: "pointer",
                  padding: 0,
                }}
                title="Clear input"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            className="dash-pill-btn"
            onClick={handlePasteFromClipboard}
            style={{ padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Read hash from clipboard and verify"
          >
            <Icons.Copy size={13} />
            <span>Paste Hash</span>
          </button>

          <button
            type="button"
            className="dash-pill-btn white-action"
            onClick={() => performVerification(selectedBatchId)}
            disabled={loading || !selectedBatchId}
            style={{ padding: "8px 22px" }}
          >
            {loading ? "Verifying..." : "Verify Package"}
          </button>
        </div>

        {/* Quick Batch Lot Selector */}
        {batches.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "18px", flexWrap: "wrap", fontSize: "12px", color: "var(--dash-text-muted)" }}>
            <span style={{ fontWeight: "600" }}>Quick Test Lots:</span>
            {batches.slice(0, 4).map((b) => (
              <button
                key={b.batch_id}
                type="button"
                onClick={() => {
                  setSelectedBatchId(b.batch_id);
                  performVerification(b.batch_id);
                  if (onSelectBatch) onSelectBatch(b.batch_id);
                }}
                className="dash-pill-btn"
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderColor: selectedBatchId === b.batch_id ? "var(--dash-blue-accent)" : undefined,
                  background: selectedBatchId === b.batch_id ? "rgba(79, 128, 248, 0.15)" : undefined,
                }}
              >
                {b.product_name}
                <span className="font-mono" style={{ opacity: 0.6, marginLeft: "4px" }}>
                  ({b.batch_id.substring(0, 6)}...)
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Message Card */}
      {error && (
        <div
          className="dash-card"
          style={{
            padding: "16px 20px",
            marginBottom: "20px",
            background: "rgba(239, 68, 68, 0.12)",
            borderColor: "rgba(239, 68, 68, 0.4)",
            color: "var(--dash-text-primary)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "260px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icons.AlertTriangle size={18} color="var(--dash-red-pill-text)" />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-red-pill-text)", marginBottom: "2px" }}>
                Verification Failed
              </div>
              <div style={{ fontSize: "12px", color: "var(--dash-text-secondary)", lineHeight: "1.4" }}>
                {error}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {batches.length > 0 && (
              <button
                type="button"
                className="dash-pill-btn"
                onClick={() => {
                  const fallback = batches[0].batch_id;
                  setSelectedBatchId(fallback);
                  performVerification(fallback);
                }}
                style={{
                  background: "rgba(79, 128, 248, 0.2)",
                  borderColor: "rgba(79, 128, 248, 0.4)",
                  color: "var(--dash-text-primary)",
                  padding: "6px 14px",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
                title="Demo shortcut: loads first active registered batch for demonstration"
              >
                <Icons.CheckCircle2 size={12} color="var(--dash-blue-accent)" />
                <span>Demo Shortcut: Try Active Lot ({batches[0].batch_id.slice(0, 8)}...)</span>
              </button>
            )}
            <button
              type="button"
              className="dash-pill-btn"
              onClick={() => {
                setError(null);
                setSelectedBatchId("");
                inputRef.current?.focus();
              }}
              style={{ padding: "6px 12px", fontSize: "11px" }}
            >
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Verification Dossier & QR Display */}
      {verificationData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main Status Headline Card */}
          <div
            className="dash-card"
            style={{
              padding: "24px",
              background: isReplenished
                ? "linear-gradient(180deg, rgba(56, 189, 248, 0.12) 0%, rgba(24, 25, 30, 0.9) 100%)"
                : isSafe
                ? "linear-gradient(180deg, rgba(52, 211, 153, 0.12) 0%, rgba(24, 25, 30, 0.9) 100%)"
                : "linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, rgba(24, 25, 30, 0.9) 100%)",
              border: `1px solid ${
                isReplenished
                  ? "rgba(56, 189, 248, 0.5)"
                  : isSafe
                  ? "rgba(52, 211, 153, 0.5)"
                  : "rgba(239, 68, 68, 0.5)"
              }`,
              textAlign: "center",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              {isReplenished ? (
                <Icons.RotateCcw size={28} color="var(--dash-status-replenished-text)" />
              ) : isSafe ? (
                <Icons.CheckCircle2 size={28} color="var(--dash-green-pill-text)" />
              ) : (
                <Icons.AlertTriangle size={28} color="var(--dash-red-pill-text)" />
              )}
              <h2
                className="font-display"
                style={{
                  fontSize: "21px",
                  fontWeight: "800",
                  letterSpacing: "-0.3px",
                  margin: 0,
                  color: isReplenished
                    ? "var(--dash-status-replenished-text)"
                    : isSafe
                    ? "var(--dash-green-pill-text)"
                    : "var(--dash-red-pill-text)",
                }}
              >
                {isReplenished
                  ? "LOT REPLENISHED: SUPERSEDED BY ON-CHAIN REPLACEMENT"
                  : isSafe
                  ? "VERIFIED: SAFE FOR CLINICAL ADMINISTRATION"
                  : "CRITICAL WARNING: DO NOT ADMINISTER"}
              </h2>
            </div>

            <p style={{ fontSize: "14px", color: "var(--dash-text-secondary)", margin: "0 auto", maxWidth: "640px", lineHeight: "1.5" }}>
              {isReplenished
                ? `Thermal excursion flagged on original lot. Smart contract autonomously linked replacement lot ${formatAddress(verificationData.replacement_batch_id)}.`
                : isSafe
                ? `Cryptographic ECDSA signatures intact, 0 unauthorized modifications detected, and cold-chain maintained within ${verificationData.temperature_range_allowed}.`
                : isTampered
                ? "Severe cryptographic anomaly: sensor signature mismatch indicates unauthorized payload tampering or man-in-the-middle alteration."
                : "Temperature excursion recorded beyond safe limits. Administering this lot is strictly prohibited."}
            </p>

            {/* Cryptographic Provenance Evidence Banner */}
            {verificationData.resolved_identifier_type && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(79, 128, 248, 0.08)",
                  border: "1px solid rgba(79, 128, 248, 0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: "var(--dash-text-secondary)",
                  maxWidth: "720px",
                  margin: "16px auto 0 auto",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Icons.CheckCircle2 size={15} color="var(--dash-blue-accent)" />
                <span>
                  <strong style={{ color: "var(--dash-text-primary)" }}>Verification Evidence:</strong>{" "}
                  {verificationData.resolved_identifier_type === "BLOCK_HASH" && (
                    <>Resolved from EVM Block Hash <code className="font-mono" style={{ color: "var(--dash-blue-accent)" }}>{formatAddress(verificationData.resolution_evidence)}</code> (verified on-chain block receipt)</>
                  )}
                  {verificationData.resolved_identifier_type === "TRANSACTION_HASH" && (
                    <>Resolved from On-Chain Transaction Hash <code className="font-mono" style={{ color: "var(--dash-blue-accent)" }}>{formatAddress(verificationData.resolution_evidence)}</code> (mined on EVM)</>
                  )}
                  {verificationData.resolved_identifier_type === "TELEMETRY_TX_HASH" && (
                    <>Resolved from Telemetry Commit Transaction <code className="font-mono" style={{ color: "var(--dash-blue-accent)" }}>{formatAddress(verificationData.resolution_evidence)}</code></>
                  )}
                  {verificationData.resolved_identifier_type === "BATCH_ID" && (
                    <>Verified by Exact 32-Byte Canonical Batch ID <code className="font-mono" style={{ color: "var(--dash-blue-accent)" }}>{formatAddress(verificationData.batch_id)}</code></>
                  )}
                  {verificationData.resolved_identifier_type === "PREFIX_MATCH" && (
                    <>Verified by Unambiguous Lot Prefix Match <code className="font-mono" style={{ color: "var(--dash-blue-accent)" }}>{formatAddress(verificationData.batch_id)}</code></>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Grid Layout: Left Column QR Datamatrix, Right Column Dossier & Checkpoints */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Left: 2D Datamatrix QR Badge Card */}
            <div className="dash-card" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "var(--dash-blue-accent)",
                  background: "rgba(79, 128, 248, 0.12)",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  marginBottom: "14px",
                }}
              >
                <Icons.QrCode size={13} />
                <span>CLINICAL 2D DATAMATRIX CODE</span>
              </div>

              {/* QR Code Canvas Frame */}
              <div
                style={{
                  background: "#FFFFFF",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                  marginBottom: "14px",
                  display: "inline-block",
                }}
              >
                <canvas ref={canvasRef} style={{ display: "block" }} />
              </div>

              <span className="font-mono" style={{ fontSize: "12px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "4px" }}>
                № {formatAddress(verificationData.batch_id)}
              </span>

              <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", margin: "0 0 16px 0", maxWidth: "260px" }}>
                Scan this 2D DataMatrix with any mobile camera to load instant regulatory verification.
              </p>

              {/* QR Action Buttons */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  className="dash-pill-btn"
                  onClick={handleCopyLink}
                  style={{ fontSize: "11px", padding: "6px 12px" }}
                >
                  <Icons.ExternalLink size={12} />
                  <span>{copiedLink ? "Link Copied!" : "Copy URL"}</span>
                </button>

                <button
                  type="button"
                  className="dash-pill-btn white-action"
                  onClick={handleDownloadQR}
                  style={{ fontSize: "11px", padding: "6px 12px" }}
                >
                  <Icons.Download size={12} />
                  <span>Download Badge</span>
                </button>
              </div>
            </div>

            {/* Right: Technical Provenance Dossier */}
            <div className="dash-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "var(--dash-text-primary)", marginBottom: "16px" }}>
                  Cryptographic Provenance Dossier
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--dash-border)" }}>
                    <span style={{ color: "var(--dash-text-muted)" }}>Product Identity</span>
                    <span style={{ fontWeight: "700", color: "var(--dash-text-primary)" }}>{verificationData.product_name}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid var(--dash-border)" }}>
                    <span style={{ color: "var(--dash-text-muted)" }}>Batch Lot Hash</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="font-mono" style={{ fontWeight: "600", color: "var(--dash-blue-accent)" }}>
                        {formatAddress(verificationData.batch_id)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(verificationData.batch_id)}
                        style={{ background: "none", border: "none", color: "var(--dash-text-muted)", cursor: "pointer", padding: "2px" }}
                        title="Copy full 32-byte hash"
                      >
                        <Icons.Copy size={12} />
                      </button>
                      {copiedHash && <span style={{ fontSize: "10px", color: "var(--dash-green-pill-text)" }}>✓</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--dash-border)" }}>
                    <span style={{ color: "var(--dash-text-muted)" }}>Current Custodian</span>
                    <span className="font-mono" style={{ fontWeight: "600", color: "var(--dash-text-primary)" }}>
                      {formatAddress(verificationData.current_custodian)}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--dash-border)" }}>
                    <span style={{ color: "var(--dash-text-muted)" }}>Authorized Manufacturer</span>
                    <span className="font-mono" style={{ fontWeight: "600", color: "var(--dash-text-primary)" }}>
                      {formatAddress(verificationData.manufacturer)}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--dash-border)" }}>
                    <span style={{ color: "var(--dash-text-muted)" }}>Safe Thermal Policy</span>
                    <span className="font-mono" style={{ fontWeight: "700", color: "var(--dash-text-primary)" }}>
                      {verificationData.temperature_range_allowed}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--dash-text-muted)" }}>Signed Edge Telemetry</span>
                    <span style={{ fontWeight: "700", color: "var(--dash-green-pill-text)" }}>
                      {verificationData.total_checkpoints_recorded} verified checkpoints
                    </span>
                  </div>
                </div>
              </div>

              {/* View Full Dossier Link */}
              {onViewBatchDetails && (
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--dash-border)" }}>
                  <button
                    type="button"
                    className="dash-pill-btn"
                    onClick={() => onViewBatchDetails(verificationData.batch_id)}
                    style={{ width: "100%", justifyContent: "center", fontSize: "12px" }}
                  >
                    <Icons.FileText size={13} />
                    <span>Open Comprehensive Lot Dossier</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4 Pillars Verification Checklist */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <div style={{ background: "#14151A", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--dash-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--dash-text-muted)", display: "block" }}>ON-CHAIN EVM INTEGRITY</span>
              <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "4px", color: "var(--dash-green-pill-text)" }}>
                ✓ Confirmed On Hardhat EVM
              </div>
            </div>

            <div style={{ background: "#14151A", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--dash-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--dash-text-muted)", display: "block" }}>COLD-CHAIN COMPLIANCE</span>
              <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "4px", color: isQuarantined ? "var(--dash-red-pill-text)" : "var(--dash-green-pill-text)" }}>
                {isQuarantined ? "✗ Excursion Flagged" : "✓ 2°C – 8°C Maintained"}
              </div>
            </div>

            <div style={{ background: "#14151A", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--dash-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--dash-text-muted)", display: "block" }}>ECDSA CRYPTOGRAPHY</span>
              <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "4px", color: isTampered ? "var(--dash-red-pill-text)" : "var(--dash-green-pill-text)" }}>
                {isTampered ? "✗ Tamper Detected" : "✓ EIP-191 Signatures Valid"}
              </div>
            </div>

            <div style={{ background: "#14151A", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--dash-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--dash-text-muted)", display: "block" }}>LEDGER LIFECYCLE</span>
              <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "4px", color: "var(--dash-text-primary)" }}>
                {verificationData.status || "CREATED"}
              </div>
            </div>
          </div>

          {/* Replacement Lot Lineage Banner (if quarantined or replenished) */}
          {verificationData.replacement_batch_id && (
            <div
              className="dash-card"
              style={{
                padding: "16px 20px",
                background: "var(--dash-status-replenished-bg)",
                borderColor: "rgba(56, 189, 248, 0.4)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--dash-status-replenished-text)", display: "block" }}>
                  Autonomous Digital Recovery: Linked Replacement Lot
                </span>
                <span className="font-mono" style={{ fontSize: "12px", color: "var(--dash-text-secondary)" }}>
                  {verificationData.replacement_batch_id}
                </span>
              </div>

              <button
                type="button"
                className="dash-pill-btn white-action"
                onClick={() => {
                  setSelectedBatchId(verificationData.replacement_batch_id);
                  performVerification(verificationData.replacement_batch_id);
                }}
                style={{ fontSize: "11px", padding: "6px 14px" }}
              >
                <Icons.RotateCcw size={13} />
                <span>Verify Replacement Lot</span>
              </button>
            </div>
          )}

          {/* Alerts Timeline (if any incidents recorded) */}
          {verificationData.alerts?.length > 0 && (
            <div className="dash-card" style={{ padding: "20px" }}>
              <h4 className="font-display" style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-red-pill-text)", margin: "0 0 12px 0" }}>
                Recorded Thermal & Security Alerts ({verificationData.alerts.length})
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {verificationData.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#14151A",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icons.AlertTriangle size={14} color="var(--dash-red-pill-text)" />
                      <span style={{ color: "var(--dash-text-primary)", fontWeight: "600" }}>{alert.message}</span>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "var(--dash-red-pill-text)",
                        background: "var(--dash-red-pill-bg)",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-xs)",
                      }}
                    >
                      {alert.severity}
                    </span>
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
