import React, { useState, useEffect } from "react";
import { Layers, CheckCircle2, Box, Cpu, Hash } from "lucide-react";
import { api } from "../../services/api";

export default function BlockExplorer() {
  const [status, setStatus] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const [statusResp, blocksResp] = await Promise.all([
        api.getBlockchainStatus(),
        api.getRecentBlocks(8),
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

  return (
    <div>
      {/* Network Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div className="glass-panel" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>EVM Network</span>
            <Cpu size={16} color="var(--cyan-primary)" />
          </div>
          <div className="font-display" style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF" }}>
            Hardhat Local Node
          </div>
          <span style={{ fontSize: "11px", color: "var(--emerald-success)" }}>Chain ID: {status?.chain_id || 31337}</span>
        </div>

        <div className="glass-panel" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>PharmaSupplyChain Address</span>
            <Hash size={16} color="var(--purple-accent)" />
          </div>
          <div className="font-mono" style={{ fontSize: "13px", fontWeight: "600", color: "var(--purple-accent)", wordBreak: "break-all" }}>
            {status?.supply_chain_address || "Loading..."}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>SupplyChainRegistry Address</span>
            <CheckCircle2 size={16} color="var(--emerald-success)" />
          </div>
          <div className="font-mono" style={{ fontSize: "13px", fontWeight: "600", color: "var(--emerald-success)", wordBreak: "break-all" }}>
            {status?.registry_address || "Loading..."}
          </div>
        </div>
      </div>

      {/* Live Block Stream */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Layers size={18} color="var(--cyan-primary)" />
          <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}>
            Recent On-Chain Blocks
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8" }}>Querying local EVM node...</div>
        ) : blocks.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8" }}>No transactions mined yet. Start batch transit to mine blocks!</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {blocks.map((b) => (
              <div
                key={b.number}
                style={{
                  background: "var(--bg-surface-elevated)",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span className="badge" style={{ background: "var(--cyan-dim)", color: "var(--cyan-primary)" }}>
                      BLOCK #{b.number}
                    </span>
                    <span className="font-mono" style={{ fontSize: "12px", color: "#94A3B8" }}>
                      Hash: {b.hash.substring(0, 16)}...{b.hash.substring(b.hash.length - 8)}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Txs: {b.transaction_count} | Gas Used: {b.gas_used}
                  </div>
                </div>

                <div className="font-mono" style={{ fontSize: "11px", color: "var(--emerald-success)", textAlign: "right" }}>
                  IMMUTABLE ON-CHAIN
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
