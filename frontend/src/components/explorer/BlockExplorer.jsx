import React, { useState, useEffect } from "react";
import { Icons } from "../ui/Icons";
import { api } from "../../services/api";

export default function BlockExplorer() {
  const [status, setStatus] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function fetchData() {
    try {
      const [statusResp, blocksResp] = await Promise.all([
        api.getBlockchainStatus(),
        api.getRecentBlocks(10),
      ]);
      setStatus(statusResp);
      setBlocks(blocksResp.blocks || []);
    } catch (e) {
      console.error("Failed to fetch blockchain data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  function handleCopy(text, key) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function formatHash(h) {
    if (!h) return "0x...";
    if (h.length <= 16) return h;
    return `${h.substring(0, 10)}...${h.substring(h.length - 8)}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "32px" }}>
      {/* Network Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <div className="dash-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600" }}>EVM CONSENSUS</span>
            <button className="circle-arrow-btn">
              <Icons.Cpu size={14} color="var(--dash-blue-accent)" />
            </button>
          </div>
          <div className="font-display" style={{ fontSize: "18px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            Hardhat EVM Node
          </div>
          <div style={{ fontSize: "11px", color: "var(--dash-green-pill-text)", marginTop: "6px" }}>
            Chain ID: {status?.chain_id || 31337} • Height: #{status?.block_number || blocks[0]?.number || 0}
          </div>
        </div>

        <div className="dash-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600" }}>SUPPLY CHAIN CONTRACT</span>
            <button className="circle-arrow-btn">
              <Icons.Hash size={14} color="var(--dash-cat-peach-bg)" />
            </button>
          </div>
          <div className="font-mono" style={{ fontSize: "13px", fontWeight: "600", color: "var(--dash-blue-accent)", wordBreak: "break-all" }}>
            {status?.supply_chain_address ? formatHash(status.supply_chain_address) : "Loading..."}
          </div>
          <div style={{ fontSize: "11px", color: "var(--dash-text-muted)", marginTop: "6px" }}>
            PharmaSupplyChain.sol
          </div>
        </div>

        <div className="dash-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600" }}>REGISTRY CONTRACT</span>
            <button className="circle-arrow-btn">
              <Icons.CheckCircle2 size={14} color="var(--dash-green-pill-text)" />
            </button>
          </div>
          <div className="font-mono" style={{ fontSize: "13px", fontWeight: "600", color: "var(--dash-green-pill-text)", wordBreak: "break-all" }}>
            {status?.registry_address ? formatHash(status.registry_address) : "Loading..."}
          </div>
          <div style={{ fontSize: "11px", color: "var(--dash-text-muted)", marginTop: "6px" }}>
            SupplyChainRegistry.sol
          </div>
        </div>
      </div>

      {/* Live Block Stream */}
      <div className="dash-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Icons.Layers size={18} color="var(--dash-blue-accent)" />
            <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
              Recent On-Chain Blocks & Ledger Activity
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="dash-pill-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                borderColor: showAdvanced ? "var(--dash-blue-accent)" : undefined,
                background: showAdvanced ? "rgba(79, 128, 248, 0.15)" : undefined,
              }}
            >
              <Icons.Sliders size={12} />
              <span>{showAdvanced ? "Simple View" : "Advanced Details"}</span>
            </button>
            <button
              className="circle-arrow-btn"
              onClick={fetchData}
              title="Refresh blocks"
            >
              <Icons.RotateCcw size={13} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--dash-text-muted)" }}>
            Querying local EVM JSON-RPC provider (Port 8546)...
          </div>
        ) : blocks.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--dash-text-muted)" }}>
            No transactions mined yet. Start batch transit simulation or mint a batch to mine blocks!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {blocks.map((b) => {
              const targetVerifyHash = b.batch_id || b.hash;
              const hasLot = Boolean(b.batch_id || b.product_name);

              return (
                <div
                  key={b.number}
                  style={{
                    background: "#18191E",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--dash-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {/* Top Bar of Block Item */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            background: "rgba(79, 128, 248, 0.15)",
                            color: "var(--dash-blue-accent)",
                            padding: "3px 10px",
                            borderRadius: "var(--radius-full)",
                            letterSpacing: "0.5px",
                          }}
                        >
                          BLOCK #{b.number}
                        </span>

                        <span className="font-mono" style={{ fontSize: "12px", color: "var(--dash-text-secondary)" }}>
                          {formatHash(b.hash)}
                        </span>

                        {hasLot && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              background: b.batch_status === "QUARANTINED"
                                ? "rgba(239, 68, 68, 0.15)"
                                : b.batch_status === "REPLENISHED"
                                ? "rgba(56, 189, 248, 0.15)"
                                : "rgba(16, 185, 129, 0.15)",
                              color: b.batch_status === "QUARANTINED"
                                ? "var(--dash-red-pill-text)"
                                : b.batch_status === "REPLENISHED"
                                ? "var(--dash-blue-accent)"
                                : "var(--dash-green-pill-text)",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            {b.product_name || "Pharmaceutical Lot"} ({b.batch_status || "VERIFIED"})
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: "11px", color: "var(--dash-text-muted)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <span>{b.transaction_count || 1} transaction(s) mined</span>
                        <span>•</span>
                        <span>Gas: {b.gas_used ? Number(b.gas_used).toLocaleString() : "21,000"}</span>
                        {b.batch_id && (
                          <>
                            <span>•</span>
                            <span className="font-mono" style={{ color: "var(--dash-blue-accent)" }}>
                              Lot: {formatHash(b.batch_id)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions on Block Item */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", color: "var(--dash-green-pill-text)", fontWeight: "600", marginRight: "4px" }}>
                        ✓ Confirmed
                      </span>

                      {/* Verify Lot Button */}
                      <button
                        className="dash-pill-btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: "11px",
                          background: "rgba(79, 128, 248, 0.15)",
                          borderColor: "rgba(79, 128, 248, 0.35)",
                          color: "var(--dash-text-primary)",
                        }}
                        onClick={() => {
                          window.location.hash = `verify/${targetVerifyHash}`;
                        }}
                        title="Verify this pharmaceutical block/lot in Consumer QR Portal"
                      >
                        <Icons.QrCode size={13} color="var(--dash-blue-accent)" />
                        <span>Verify Lot</span>
                      </button>

                      {/* Copy Hash Button (Copies Block or Lot Hash) */}
                      <button
                        className="dash-pill-btn"
                        style={{ padding: "6px 12px", fontSize: "11px" }}
                        onClick={() => handleCopy(b.hash, `block-${b.number}`)}
                        title="Copy 32-byte EVM Block Hash to clipboard"
                      >
                        {copiedKey === `block-${b.number}` ? (
                          <Icons.Check size={12} color="var(--dash-green-pill-text)" />
                        ) : (
                          <Icons.Copy size={12} />
                        )}
                        <span>{copiedKey === `block-${b.number}` ? "Copied Block Hash" : "Copy Hash"}</span>
                      </button>

                      {/* Copy Lot ID Button if lot is linked */}
                      {b.batch_id && (
                        <button
                          className="dash-pill-btn"
                          style={{ padding: "6px 10px", fontSize: "11px", borderColor: "rgba(255,255,255,0.08)" }}
                          onClick={() => handleCopy(b.batch_id, `lot-${b.number}`)}
                          title="Copy Pharmaceutical Batch Lot ID"
                        >
                          {copiedKey === `lot-${b.number}` ? (
                            <Icons.Check size={12} color="var(--dash-green-pill-text)" />
                          ) : (
                            <Icons.Hash size={12} color="var(--dash-cat-peach-bg)" />
                          )}
                          <span>{copiedKey === `lot-${b.number}` ? "Copied Lot ID" : "Lot ID"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Advanced Block Details Dropdown */}
                  {showAdvanced && (
                    <div
                      style={{
                        paddingTop: "12px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                        fontSize: "11px",
                        color: "var(--dash-text-secondary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                        <span style={{ color: "var(--dash-text-muted)" }}>Full Block Hash:</span>
                        <span className="font-mono" style={{ color: "var(--dash-text-primary)", wordBreak: "break-all" }}>
                          {b.hash}
                        </span>
                      </div>

                      {b.batch_id && (
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                          <span style={{ color: "var(--dash-text-muted)" }}>Target Batch Lot ID:</span>
                          <span className="font-mono" style={{ color: "var(--dash-blue-accent)", wordBreak: "break-all" }}>
                            {b.batch_id}
                          </span>
                        </div>
                      )}

                      {b.transactions && b.transactions.length > 0 && (
                        <div style={{ marginTop: "4px" }}>
                          <span style={{ color: "var(--dash-text-muted)", fontWeight: "600" }}>Transactions in Block:</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                            {b.transactions.map((tx, idx) => (
                              <div
                                key={idx}
                                style={{
                                  background: "#131418",
                                  padding: "8px 12px",
                                  borderRadius: "var(--radius-sm)",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: "8px",
                                }}
                              >
                                <span className="font-mono" style={{ fontSize: "11px", color: "var(--dash-text-secondary)" }}>
                                  Tx: {formatHash(tx.hash)}
                                </span>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <button
                                    className="dash-pill-btn"
                                    style={{ padding: "3px 8px", fontSize: "10px" }}
                                    onClick={() => handleCopy(tx.hash, `tx-${tx.hash}`)}
                                  >
                                    {copiedKey === `tx-${tx.hash}` ? "Copied" : "Copy Tx"}
                                  </button>
                                  <button
                                    className="dash-pill-btn"
                                    style={{ padding: "3px 8px", fontSize: "10px", background: "rgba(79, 128, 248, 0.15)" }}
                                    onClick={() => {
                                      window.location.hash = `verify/${tx.batch_id || tx.hash}`;
                                    }}
                                  >
                                    Verify
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
