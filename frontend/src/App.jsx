import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import LandingPage from "./components/portal/LandingPage";
import LoginPage from "./components/portal/LoginPage";
import OverviewView from "./components/dashboard/OverviewView";
import BatchesView from "./components/dashboard/BatchesView";
import BatchDetailView from "./components/dashboard/BatchDetailView";
import MonitoringView from "./components/dashboard/MonitoringView";
import TransitMap from "./components/dashboard/TransitMap";
import CustodyView from "./components/dashboard/CustodyView";
import SecurityCenterView from "./components/dashboard/SecurityCenterView";
import RecoveryView from "./components/dashboard/RecoveryView";
import ChaosStudio from "./components/chaos/ChaosStudio";
import BlockExplorer from "./components/explorer/BlockExplorer";
import QRVerifyPortal from "./components/portal/QRVerifyPortal";
import AuditorWorkspace from "./components/auditor/AuditorWorkspace";
import CreateBatchModal from "./components/modals/CreateBatchModal";
import HandoverModal from "./components/modals/HandoverModal";
import { Icons } from "./components/ui/Icons";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

import { useWebSocket } from "./hooks/useWebSocket";
import { api } from "./services/api";

export default function App() {
  const parseRoute = () => {
    const rawHash = window.location.hash.replace("#", "") || "portal";
    if (rawHash.startsWith("batches/")) {
      const id = rawHash.replace("batches/", "");
      return { tab: "batch-detail", param: id };
    }
    if (rawHash.startsWith("verify/") || rawHash.startsWith("verify?")) {
      const param = rawHash.includes("?")
        ? new URLSearchParams(rawHash.split("?")[1]).get("batch") || new URLSearchParams(rawHash.split("?")[1]).get("id")
        : rawHash.replace("verify/", "");
      return { tab: "verify", param: param ? decodeURIComponent(param).trim() : null };
    }
    const legacyMap = { dashboard: "overview" };
    return { tab: legacyMap[rawHash] || rawHash, param: null };
  };

  const [route, setRoute] = useState(parseRoute);
  const activeTab = route.tab;
  const activeParam = route.param;

  const navigate = (tab, param = null) => {
    if (tab === "batch-detail" && param) {
      window.location.hash = `batches/${param}`;
      setRoute({ tab: "batch-detail", param });
    } else if (tab === "verify" && param) {
      window.location.hash = `verify/${param}`;
      setRoute({ tab: "verify", param });
    } else {
      window.location.hash = tab;
      setRoute({ tab, param: null });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute());
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

  // Modals & Toast Notifications
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverBatch, setHandoverBatch] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch Batches from API
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

  // Fetch Blockchain Status from API
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
    } else if (msg.type === "BATCH_CREATED") {
      showToast(`BATCH CREATED: New pharmaceutical lot minted on-chain: ${msg.data.batch_id?.substring(0, 10)}...`, "success");
      loadBatches();
    } else if (msg.type === "BATCH_REPLENISHED") {
      showToast(`BATCH REPLENISHED: Linked replacement lot on-chain: ${msg.data.replacement_batch_id?.substring(0, 10)}...`, "success");
      loadBatches();
    } else if (msg.type === "HANDOVER_INITIATED") {
      showToast("HANDOVER INITIATED: 2-of-2 custody transfer initiated on-chain", "info");
      loadBatches();
    } else if (msg.type === "COLD_CHAIN_EXCURSION") {
      showToast(`CRITICAL: Cold-Chain Excursion for batch ${msg.data.batch_id?.substring(0, 10)}! Status: QUARANTINED`, "error");
      loadBatches();
    } else if (msg.type === "AUTONOMOUS_RECOVERY") {
      showToast(`AUTONOMOUS RECOVERY: Replacement lot dispatched for ${msg.data.original_batch_id?.substring(0, 10)}!`, "warning");
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
      showToast(`Telemetry simulation started for lot ${batchId.substring(0, 10)}...`, "info");
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
    navigate("verify", batchId);
  }

  function handleViewBatchDetails(batchId) {
    setActiveBatchId(batchId);
    navigate("batch-detail", batchId);
  }

  // If on public portal landing page
  if (activeTab === "portal" || activeTab === "home") {
    return (
      <>
        <LandingPage
          onEnterApp={(dest) => navigate(dest || "overview")}
          batches={batches}
          lastPacket={lastPacket}
        />
        {/* Toast Notification Container */}
        {toastMessage && (
          <div className="toast-container">
            <div className={`toast-item toast-${toastMessage.type}`}>
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // If on login/access selection page
  if (activeTab === "login") {
    return (
      <LoginPage
        activeRole={activeRole}
        onRoleSelect={setActiveRole}
        onEnterWorkspace={() => navigate("overview")}
        onCancel={() => navigate("portal")}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--dash-bg)" }}>
      {/* Top Application Header */}
      <Navbar
        blockNumber={blockchainStatus?.block_number}
        connected={isConnected}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenPortal={() => navigate("portal")}
        onNavigateTab={(t) => navigate(t)}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="toast-container">
          <div className={`toast-item toast-${toastMessage.type}`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar Navigation (Reference 2) */}
        <Sidebar
          activeTab={activeTab === "batch-detail" ? "batches" : activeTab}
          onTabChange={(tab) => navigate(tab)}
          onExitToPortal={() => navigate("portal")}
        />

        {/* Dynamic Center Stage Content */}
        <main style={{ flex: 1, minWidth: 0, padding: "20px 24px", overflowY: "auto" }}>
          <ErrorBoundary key={activeTab}>
          {activeTab === "overview" && (
            <OverviewView
              batches={batches}
              activeBatchId={activeBatchId}
              isSimulationRunning={isSimulationRunning}
              lastPacket={lastPacket}
              telemetryHistory={telemetryHistory}
              onSelectBatch={setActiveBatchId}
              onStartSimulation={handleStartSimulation}
              onPauseSimulation={handlePauseSimulation}
              onOpenHandoverModal={handleOpenHandover}
              onOpenQRModal={handleOpenQR}
              onViewBatchDetails={handleViewBatchDetails}
              onNavigateTab={(t) => navigate(t)}
            />
          )}

          {activeTab === "batches" && (
            <BatchesView
              batches={batches}
              activeBatchId={activeBatchId}
              isSimulationRunning={isSimulationRunning}
              lastPacket={lastPacket}
              onSelectBatch={setActiveBatchId}
              onStartSimulation={handleStartSimulation}
              onPauseSimulation={handlePauseSimulation}
              onOpenHandoverModal={handleOpenHandover}
              onOpenQRModal={handleOpenQR}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onViewBatchDetails={handleViewBatchDetails}
            />
          )}

          {activeTab === "batch-detail" && (
            <BatchDetailView
              batchId={activeParam || activeBatchId}
              batches={batches}
              onBack={() => navigate("batches")}
              onOpenHandoverModal={handleOpenHandover}
              onOpenQRModal={handleOpenQR}
              onStartSimulation={handleStartSimulation}
              onPauseSimulation={handlePauseSimulation}
              isSimulationRunning={isSimulationRunning}
            />
          )}

          {activeTab === "monitoring" && (
            <MonitoringView
              batches={batches}
              activeBatchId={activeBatchId}
              onSelectBatch={setActiveBatchId}
              isSimulationRunning={isSimulationRunning}
              onStartSimulation={handleStartSimulation}
              onPauseSimulation={handlePauseSimulation}
              lastPacket={lastPacket}
              telemetryHistory={telemetryHistory}
              isConnected={isConnected}
            />
          )}

          {activeTab === "map" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <TransitMap lastPacket={lastPacket} height="480px" />
              <div className="dash-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Icons.Navigation size={18} color="var(--dash-blue-accent)" />
                  <h3 className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                    National Highway 44 (NH44) Dedicated Pharma Corridor
                  </h3>
                </div>
                <p style={{ fontSize: "13px", color: "var(--dash-text-secondary)", margin: 0, lineHeight: "1.5" }}>
                  Route segment: Hyderabad Genome Valley (Genesis Lot) → Mahabubnagar → Kurnool → Anantapur → Bangalore Hub → Krishnagiri → Vellore → Chennai Apollo Specialty Hospital (Destination). Every waypoint update is verified by the reefer’s virtualized edge node.
                </p>
              </div>
            </div>
          )}

          {activeTab === "custody" && (
            <CustodyView
              batches={batches}
              onOpenHandoverModal={handleOpenHandover}
            />
          )}

          {activeTab === "security" && (
            <SecurityCenterView
              batches={batches}
              lastPacket={lastPacket}
              onNavigateTab={(t) => navigate(t)}
            />
          )}

          {activeTab === "recovery" && (
            <RecoveryView
              batches={batches}
              onRefreshBatches={loadBatches}
            />
          )}

          {activeTab === "explorer" && (
            <BlockExplorer />
          )}

          {activeTab === "verify" && (
            <QRVerifyPortal
              batches={batches}
              defaultBatchId={activeParam || activeBatchId}
              onSelectBatch={(id) => {
                setActiveBatchId(id);
                navigate("verify", id);
              }}
              onViewBatchDetails={handleViewBatchDetails}
            />
          )}

          {activeTab === "auditor" && (
            <AuditorWorkspace
              batches={batches}
              activeBatchId={activeBatchId}
            />
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
                showToast(`Chaos Fault Triggered: ${type}`, "warning");
              }}
            />
          )}
          </ErrorBoundary>
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
          showToast("Custody handover confirmed on-chain!", "success");
          loadBatches();
        }}
      />
    </div>
  );
}
