/**
 * API Client for Backend REST Endpoints.
 * CBS3002 Information Security Project - Kaviselvaram & Aniesh S
 */

const API_BASE = "/api/v1";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Batches
  getBatches: () => request("/batches"),
  createBatch: (data) => request("/batches", { method: "POST", body: JSON.stringify(data) }),
  getBatchDetail: (batchId) => request(`/batches/${batchId}`),
  linkReplacement: (batchId, data) => request(`/batches/${batchId}/link-replacement`, { method: "POST", body: JSON.stringify(data) }),
  autonomousRecovery: (batchId, data = {}) => request(`/batches/${batchId}/autonomous-recovery`, { method: "POST", body: JSON.stringify(data) }),
  triggerDemoQuarantine: () => request("/batches/trigger-demo-quarantine", { method: "POST" }),

  // Custody Handover
  initiateHandover: (data) => request("/handover/initiate", { method: "POST", body: JSON.stringify(data) }),
  confirmHandover: (data) => request("/handover/confirm", { method: "POST", body: JSON.stringify(data) }),

  // Simulation & Chaos Studio
  startSimulation: (batchId) => request(`/simulation/start?batch_id=${batchId}`, { method: "POST" }),
  pauseSimulation: (batchId) => request(`/simulation/pause?batch_id=${batchId}`, { method: "POST" }),
  injectAttack: (data) => request("/simulation/attack", { method: "POST", body: JSON.stringify(data) }),
  resetAttacks: (batchId) => request(`/simulation/reset-attacks?batch_id=${batchId}`, { method: "POST" }),

  // Blockchain Ledger
  getBlockchainStatus: () => request("/blockchain/status"),
  getRecentBlocks: (limit = 10) => request(`/blockchain/blocks?limit=${limit}`),

  // Consumer Verification & Audit
  verifyBatch: (batchId) => request(`/verify/${encodeURIComponent(batchId)}`),
  getAuditReport: (batchId) => request(`/audit/${encodeURIComponent(batchId)}/report`),
};
