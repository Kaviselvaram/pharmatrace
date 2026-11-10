import React from "react";
import BatchTable from "./BatchTable";
import { Icons } from "../ui/Icons";

export default function BatchesView({
  batches = [],
  activeBatchId,
  isSimulationRunning,
  lastPacket,
  onSelectBatch,
  onStartSimulation,
  onPauseSimulation,
  onOpenHandoverModal,
  onOpenQRModal,
  onOpenCreateModal,
  onViewBatchDetails,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "32px" }}>
      {/* Reference 2 Title Header: "Order list" */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <h1
            className="font-display"
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "var(--dash-text-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            Batch Registry
          </h1>
          <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", marginTop: "4px" }}>
            Immutable digital twin lots verified by Solidity smart contracts on EVM.
          </p>
        </div>

        {onOpenCreateModal && (
          <button
            className="dash-pill-btn white-action"
            onClick={onOpenCreateModal}
            style={{ padding: "8px 18px" }}
          >
            <Icons.PlusCircle size={15} />
            <span>+ Add Batch</span>
          </button>
        )}
      </div>

      {/* Main Batch Table (Matching Reference 2 Order list screen) */}
      <BatchTable
        batches={batches}
        activeBatchId={activeBatchId}
        isSimulationRunning={isSimulationRunning}
        lastPacket={lastPacket}
        onSelectBatch={onSelectBatch}
        onStartSimulation={onStartSimulation}
        onPauseSimulation={onPauseSimulation}
        onOpenHandoverModal={onOpenHandoverModal}
        onOpenQRModal={onOpenQRModal}
        onViewDetails={onViewBatchDetails}
        onOpenCreateModal={onOpenCreateModal}
      />
    </div>
  );
}
