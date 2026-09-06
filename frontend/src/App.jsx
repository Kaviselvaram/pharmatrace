import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import MetricCards from "./components/dashboard/MetricCards";
import TelemetryWaveform from "./components/dashboard/TelemetryWaveform";
import TransitMap from "./components/dashboard/TransitMap";
import BatchTable from "./components/dashboard/BatchTable";
import ChaosStudio from "./components/chaos/ChaosStudio";
import BlockExplorer from "./components/explorer/BlockExplorer";
import QRVerifyPortal from "./components/portal/QRVerifyPortal";
import AuditorWorkspace from "./components/auditor/AuditorWorkspace";
import CreateBatchModal from "./components/modals/CreateBatchModal";
import HandoverModal from "./components/modals/HandoverModal";

import { useWebSocket } from "./hooks/useWebSocket";
import { api } from "./services/api";

export default function App() {
  const getInitialTab = () => {
    const hash = window.location.hash.replace("#", "");
    const validTabs = ["dashboard", "map", "chaos", "explorer", "verify", "auditor"];
    return validTabs.includes(hash) ? hash : "dashboard";
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const validTabs = ["dashboard", "map", "chaos", "explorer", "verify", "auditor"];
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const [activeRole, setActiveRole] = useState("MANUFACTURER");
  const [batches, setBatches] = useState([]);
  const [activeBatchId, setActiveBatchId] = useState("");
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [lastPacket, setLastPacket] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [blockchainStatus, setBlockchainStatus] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverBatch, setHandoverBatch] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch Batches
  const loadBatches = useCallback(async () => {
    try {
      const data = await api.getBatches();
      setBatches(data);
      if (data.length > 0 && !activeBatchId) {
        setActiveBatchId(data[0].batch_id);
      }
    } catch (err) {
      console.error("Failed to load batches", err);
    }
  }, [activeBatchId]);

  // Fetch Blockchain Status
  const loadBlockchainStatus = useCallback(async () => {
    try {
      const status = await api.getBlockchainStatus();
      setBlockchainStatus(status);
    } catch (err) {
      console.error("Failed to load blockchain status", err);
    }
  }, []);

  useEffect(() => {
    loadBatches();
    loadBlockchainStatus();
    const interval = setInterval(loadBlockchainStatus, 6000);
    return () => clearInterval(interval);
  }, [loadBatches, loadBlockchainStatus]);

  function showToast(msg, type = "info") {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 5000);
  }

  // WebSocket event listener
  const handleWebSocketMessage = useCallback((msg) => {
    if (msg.type === "TELEMETRY_PACKET" || msg.type === "TELEMETRY_STREAM") {
      const packet = msg.data;
      setLastPacket(packet);
      setTelemetryHistory((prev) => {
        const updated = [...prev, packet];
        return updated.length > 40 ? updated.slice(updated.length - 40) : updated;
      });
    } else if (msg.type === "COLD_CHAIN_EXCURSION") {
      showToast(`CRITICAL: Cold-Chain Excursion detected for batch ${msg.data.batch_id?.substring(0, 10)}! Status: QUARANTINED`, "error");
      loadBatches();
    } else if (msg.type === "AUTONOMOUS_RECOVERY") {
      showToast(`AUTONOMOUS RECOVERY: Replacement dispatch order placed for lot ${msg.data.original_batch_id?.substring(0, 10)}!`, "warning");
      loadBatches();
    } else if (msg.type === "MITM_TAMPER_ATTACK") {
      showToast(`SECURITY ALERT: Cryptographic signature mismatch! Reverted on EVM: ${msg.data.batch_id?.substring(0, 10)}`, "error");
    } else if (msg.type === "CUSTODY_TRANSFERRED") {
      showToast(`CUSTODY HANDOVER: Custody transferred on-chain to ${msg.data.new_custodian?.substring(0, 10)}...`, "success");
      loadBatches();
    } else if (msg.type === "CHAOS_ATTACK_TRIGGERED") {
      showToast(`CHAOS STUDIO: ${msg.data.attack_type} injected into vehicle telemetry!`, "warning");
    } else if (msg.type === "CHAOS_ATTACK_RESET") {
      showToast("CHAOS STUDIO: Adversarial attacks cleared. Restored nominal physics.", "info");
    }
  }, [loadBatches]);

  const { isConnected } = useWebSocket("/ws/telemetry", handleWebSocketMessage);

  // Simulation Controls
  async function handleStartSimulation(batchId) {
    try {
      await api.startSimulation(batchId);
      setIsSimulationRunning(true);
      setActiveBatchId(batchId);
      showToast(`Simulation started for batch ${batchId.substring(0, 10)}...`, "info");
    } catch (err) {
      showToast(`Failed to start simulation: ${err.message}`, "error");
    }
  }

  async function handlePauseSimulation(batchId) {
    try {
      await api.pauseSimulation(batchId);
      setIsSimulationRunning(false);
      showToast("Simulation paused.", "info");
    } catch (err) {
      showToast(`Failed to pause simulation: ${err.message}`, "error");
    }
  }

  function handleOpenHandover(batch) {
    setHandoverBatch(batch);
    setIsHandoverModalOpen(true);
  }

  function handleOpenQR(batchId) {
    setActiveBatchId(batchId);
    setActiveTab("verify");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
      {/* Top Navbar */}
      <Navbar
        blockNumber={blockchainStatus?.block_number}
        connected={isConnected}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          background: toastMessage.type === "error" ? "rgba(255, 0, 85, 0.95)" : (toastMessage.type === "warning" ? "rgba(255, 170, 0, 0.95)" : "rgba(0, 240, 255, 0.95)"),
          color: "#07090E",
          padding: "12px 20px",
          borderRadius: "var(--radius-md)",
          fontWeight: "700",
          fontSize: "13px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "fadeIn 0.2s ease",
        }}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div style={{ display: "flex", flex: 1, padding: "0 16px 16px 16px", gap: "16px" }}>
        {/* Left Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Center Stage */}
        <main style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          {activeTab === "dashboard" && (
            <div>
              <MetricCards batches={batches} lastPacket={lastPacket} />

              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <TelemetryWaveform
                  history={telemetryHistory}
                  lastPacket={lastPacket}
                  minThreshold={2.0}
                  maxThreshold={8.0}
                />
                <TransitMap lastPacket={lastPacket} />
              </div>

              <BatchTable
                batches={batches}
                activeBatchId={activeBatchId}
                isSimulationRunning={isSimulationRunning}
                onSelectBatch={setActiveBatchId}
                onStartSimulation={handleStartSimulation}
                onPauseSimulation={handlePauseSimulation}
                onOpenHandoverModal={handleOpenHandover}
                onOpenQRModal={handleOpenQR}
              />
            </div>
          )}

          {activeTab === "map" && (
            <div>
              <TransitMap lastPacket={lastPacket} />
              <div className="glass-panel" style={{ padding: "20px", marginTop: "16px" }}>
                <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", marginBottom: "8px" }}>
                  Interstate Cold-Chain Route Telemetry Log
                </h3>
                <p style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Active Highway Corridor: NH44 (Hyderabad Pharma City → Bangalore Hub → Chennai Apollo Specialty Hospital). Every GPS coordinate packet is digitally signed on an edge virtualized reefer node.
                </p>
              </div>
            </div>
          )}

          {activeTab === "chaos" && (
            <ChaosStudio
              activeBatchId={activeBatchId}
              batches={batches}
              onSelectBatch={setActiveBatchId}
              isSimulationRunning={isSimulationRunning}
              onStartSimulation={handleStartSimulation}
              lastPacket={lastPacket}
              onAttackInjected={(type) => {
                showToast(`Chaos Triggered: ${type}`, "warning");
              }}
            />
          )}

          {activeTab === "explorer" && (
            <BlockExplorer />
          )}

          {activeTab === "verify" && (
            <QRVerifyPortal
              batches={batches}
              defaultBatchId={activeBatchId}
            />
          )}

          {activeTab === "auditor" && (
            <AuditorWorkspace
              batches={batches}
              activeBatchId={activeBatchId}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CreateBatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newBatch) => {
          showToast(`Minted batch ${newBatch.batch_id.substring(0, 10)} on EVM!`, "success");
          loadBatches();
        }}
      />

      <HandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        batch={handoverBatch}
        onHandoverComplete={() => {
          loadBatches();
        }}
      />
    </div>
  );
}
