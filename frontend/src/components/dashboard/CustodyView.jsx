import React from "react";
import { Icons } from "../ui/Icons";

export default function CustodyView({
  batches = [],
  onOpenHandoverModal,
}) {
  function formatAddress(addr) {
    if (!addr) return "0x000...000";
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 4)}`;
  }

  const eligibleBatches = batches.filter(
    (b) => b.status === "CREATED" || b.status === "IN_TRANSIT"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "32px" }}>
      {/* Top Banner */}
      <div className="dash-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Icons.ArrowRightLeft size={22} color="var(--dash-blue-accent)" />
          <h2 className="font-display" style={{ fontSize: "20px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            2-of-2 Dual-Custody Handover Manager
          </h2>
        </div>
        <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", maxWidth: "720px", lineHeight: "1.6" }}>
          In pharmaceutical supply chains, neither carrier nor hospital can unilaterally claim or transfer custody. The smart contract requires two independent cryptographic ECDSA signatures: the current custodian initiates release, and the receiving custodian confirms receipt on-chain.
        </p>

        {/* 2-of-2 Handover Flow Architecture Visual */}
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            background: "#18191E",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--dash-border)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-blue-accent)" }}>STEP 01</span>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "2px" }}>Releasing Custodian</div>
            <p style={{ fontSize: "11px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
              Signs transfer intent tuple with private key.
            </p>
          </div>

          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-blue-accent)" }}>STEP 02</span>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "2px" }}>Smart Contract Lock</div>
            <p style={{ fontSize: "11px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
              Verifies releasing signature & logs pending recipient.
            </p>
          </div>

          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-blue-accent)" }}>STEP 03</span>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "2px" }}>Receiving Custodian</div>
            <p style={{ fontSize: "11px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
              Confirms physical receipt with second signature.
            </p>
          </div>

          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-green-pill-text)" }}>STEP 04</span>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-primary)", marginTop: "2px" }}>Custody Settled</div>
            <p style={{ fontSize: "11px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
              On-chain truth transfers atomically to new entity.
            </p>
          </div>
        </div>
      </div>

      {/* Eligible Batches for Handover */}
      <div className="dash-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
              Lots Eligible for Custody Handover ({eligibleBatches.length})
            </h3>
            <p style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>
              Lots in CREATED or IN_TRANSIT status ready for transfer.
            </p>
          </div>
        </div>

        {eligibleBatches.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--dash-text-muted)" }}>
            <Icons.Box size={32} style={{ margin: "0 auto 12px auto", opacity: 0.4 }} />
            <p style={{ fontSize: "14px" }}>No lots currently eligible for custody transfer.</p>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>Mint a new lot or resume transit to execute handovers.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {eligibleBatches.map((batch) => (
              <div
                key={batch.batch_id}
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--dash-border)",
                  background: "#18191E",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <span className="font-mono" style={{ fontSize: "12px", fontWeight: "700", color: "var(--dash-blue-accent)" }}>
                      {formatAddress(batch.batch_id)}
                    </span>
                    <span className={`dash-status-badge ${batch.status === "CREATED" ? "created" : "in-transit"}`}>
                      {batch.status === "CREATED" ? "created" : "on way"}
                    </span>
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                    {batch.product_name}
                  </h4>
                  <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", marginTop: "4px" }}>
                    Current Custodian: <span className="font-mono" style={{ color: "var(--dash-text-secondary)", fontWeight: "600" }}>{formatAddress(batch.current_custodian)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--dash-border)", paddingTop: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
                    Limits: {batch.min_temp_celsius}°C – {batch.max_temp_celsius}°C
                  </span>
                  <button
                    className="dash-pill-btn white-action"
                    onClick={() => onOpenHandoverModal(batch)}
                  >
                    <Icons.ArrowRightLeft size={13} />
                    <span>Execute Handover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
