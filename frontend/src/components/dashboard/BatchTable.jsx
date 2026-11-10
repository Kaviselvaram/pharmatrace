import React, { useState } from "react";
import { Icons } from "../ui/Icons";

export default function BatchTable({
  batches = [],
  activeBatchId,
  isSimulationRunning,
  lastPacket,
  onSelectBatch,
  onStartSimulation,
  onPauseSimulation,
  onOpenHandoverModal,
  onOpenQRModal,
  onViewDetails,
  onOpenCreateModal,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLots, setSelectedLots] = useState(new Set());
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortMode, setSortMode] = useState("default"); // default, date_desc, product_asc, status
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Real status counts for category cards
  const newLotsCount = batches.filter((b) => b.status === "CREATED").length;
  const awaitCustodyCount = batches.filter((b) => b.status === "CREATED" || b.status === "IN_TRANSIT").length;
  const onWayCount = batches.filter((b) => b.status === "IN_TRANSIT").length;
  const deliveredCount = batches.filter((b) => b.status === "DELIVERED").length;

  function formatAddress(addr) {
    if (!addr) return "0x000...000";
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 4)}`;
  }

  function formatDate(isoStr) {
    if (!isoStr) return "Just now";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr.substring(0, 10);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "26.07.2026";
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case "IN_TRANSIT":
        return <span className="dash-status-badge in-transit">on way</span>;
      case "DELIVERED":
        return <span className="dash-status-badge delivered">delivered</span>;
      case "QUARANTINED":
        return <span className="dash-status-badge await">quarantine</span>;
      case "CREATED":
        return <span className="dash-status-badge created">created</span>;
      case "REPLENISHED":
        return <span className="dash-status-badge replenished">replenished</span>;
      default:
        return <span className="dash-status-badge">{status.toLowerCase()}</span>;
    }
  }

  // Handle category card filter click
  const handleCategoryClick = (targetStatus) => {
    if (statusFilter === targetStatus) {
      setStatusFilter("ALL");
      setActiveFilters([]);
    } else {
      setStatusFilter(targetStatus);
      setActiveFilters([targetStatus]);
    }
    setCurrentPage(1);
  };

  // Filter batches
  let filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.batch_id.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = false;
    if (statusFilter === "ALL") {
      matchesFilter = true;
    } else if (statusFilter === "AWAIT_HANDOVER") {
      matchesFilter = b.status === "CREATED" || b.status === "IN_TRANSIT";
    } else {
      matchesFilter = b.status === statusFilter;
    }
    return matchesSearch && matchesFilter;
  });

  // Sort batches
  if (sortMode === "product_asc") {
    filteredBatches = [...filteredBatches].sort((a, b) => a.product_name.localeCompare(b.product_name));
  } else if (sortMode === "date_desc") {
    filteredBatches = [...filteredBatches].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  } else if (sortMode === "status") {
    filteredBatches = [...filteredBatches].sort((a, b) => a.status.localeCompare(b.status));
  }

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedBatches = filteredBatches.slice(startIndex, startIndex + pageSize);

  const toggleSelectAll = () => {
    if (selectedLots.size === paginatedBatches.length) {
      setSelectedLots(new Set());
    } else {
      setSelectedLots(new Set(paginatedBatches.map((b) => b.batch_id)));
    }
  };

  const toggleSelectLot = (batchId) => {
    const next = new Set(selectedLots);
    if (next.has(batchId)) {
      next.delete(batchId);
    } else {
      next.add(batchId);
    }
    setSelectedLots(next);
  };

  const removeFilterTag = (tag) => {
    setActiveFilters(activeFilters.filter((f) => f !== tag));
    if (statusFilter === tag) {
      setStatusFilter("ALL");
    }
    setCurrentPage(1);
  };

  // Export functionality
  const handleExport = () => {
    const dataToExport = selectedLots.size > 0
      ? batches.filter((b) => selectedLots.has(b.batch_id))
      : filteredBatches;

    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmatrace_lots_manifest_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cycle sort modes
  const handleCycleSort = () => {
    const modes = ["default", "product_asc", "date_desc", "status"];
    const nextIdx = (modes.indexOf(sortMode) + 1) % modes.length;
    setSortMode(modes[nextIdx]);
  };

  const getSortLabel = () => {
    switch (sortMode) {
      case "product_asc": return "Sort: Product (A-Z)";
      case "date_desc": return "Sort: Date (Newest)";
      case "status": return "Sort: Status";
      default: return "Sort: default";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Category Metric Cards (Clickable Filter Cards) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
        }}
      >
        {/* Card 1: New lots (Pastel Blue) */}
        <div
          className="dash-cat-card"
          onClick={() => handleCategoryClick("CREATED")}
          style={{
            cursor: "pointer",
            border: statusFilter === "CREATED" ? "1px solid var(--dash-blue-accent)" : undefined,
            boxShadow: statusFilter === "CREATED" ? "0 0 10px rgba(79, 128, 248, 0.2)" : undefined,
          }}
          title="Click to filter by CREATED lots"
        >
          <div className="dash-cat-header blue">
            New lots
          </div>
          <div className="dash-cat-body">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="font-display" style={{ fontSize: "24px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                {newLotsCount}
              </span>
              <span className="dash-change-pill positive">
                {batches.length > 0 ? Math.round((newLotsCount / batches.length) * 100) : 0}% fleet
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              Awaiting dispatch
            </span>
          </div>
        </div>

        {/* Card 2: Await handover (Pastel Peach) */}
        <div
          className="dash-cat-card"
          onClick={() => handleCategoryClick("AWAIT_HANDOVER")}
          style={{
            cursor: "pointer",
            border: statusFilter === "AWAIT_HANDOVER" ? "1px solid var(--dash-cat-peach-bg)" : undefined,
            boxShadow: statusFilter === "AWAIT_HANDOVER" ? "0 0 10px rgba(251, 146, 60, 0.2)" : undefined,
          }}
          title="Click to filter by lots pending custody handover"
        >
          <div className="dash-cat-header peach">
            Await handover
          </div>
          <div className="dash-cat-body">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="font-display" style={{ fontSize: "24px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                {awaitCustodyCount}
              </span>
              <span className="dash-change-pill positive">
                {batches.length > 0 ? Math.round((awaitCustodyCount / batches.length) * 100) : 0}% fleet
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              2-of-2 custody pending
            </span>
          </div>
        </div>

        {/* Card 3: On way lots (Pastel Yellow) */}
        <div
          className="dash-cat-card"
          onClick={() => handleCategoryClick("IN_TRANSIT")}
          style={{
            cursor: "pointer",
            border: statusFilter === "IN_TRANSIT" ? "1px solid var(--dash-cat-yellow-bg)" : undefined,
            boxShadow: statusFilter === "IN_TRANSIT" ? "0 0 10px rgba(245, 158, 11, 0.2)" : undefined,
          }}
          title="Click to filter by IN_TRANSIT lots"
        >
          <div className="dash-cat-header yellow">
            On way lots
          </div>
          <div className="dash-cat-body">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="font-display" style={{ fontSize: "24px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                {onWayCount}
              </span>
              <span className="dash-change-pill positive">
                {batches.length > 0 ? Math.round((onWayCount / batches.length) * 100) : 0}% fleet
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              Active reefer telemetry
            </span>
          </div>
        </div>

        {/* Card 4: Delivered lots (Pastel Green) */}
        <div
          className="dash-cat-card"
          onClick={() => handleCategoryClick("DELIVERED")}
          style={{
            cursor: "pointer",
            border: statusFilter === "DELIVERED" ? "1px solid var(--dash-green-pill-text)" : undefined,
            boxShadow: statusFilter === "DELIVERED" ? "0 0 10px rgba(16, 185, 129, 0.2)" : undefined,
          }}
          title="Click to filter by DELIVERED lots"
        >
          <div className="dash-cat-header green">
            Delivered lots
          </div>
          <div className="dash-cat-body">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="font-display" style={{ fontSize: "24px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
                {deliveredCount}
              </span>
              <span className="dash-change-pill positive">
                {batches.length > 0 ? Math.round((deliveredCount / batches.length) * 100) : 0}% fleet
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              Verified receipt
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar (Search, Filter tags, Export, Sort, + Add batch, Pagination) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* Left: Search pill + count & filter tag pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div className="dash-search-input" style={{ width: "240px", padding: "6px 14px" }}>
            <Icons.Search size={14} color="var(--dash-text-muted)" />
            <input
              type="text"
              placeholder="Search lot, batch ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)", whiteSpace: "nowrap" }}>
              {filteredBatches.length} lots
            </span>
          </div>

          {/* Filter Pills with funnel icon */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#1E1F24",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: statusFilter !== "ALL" ? "var(--dash-blue-accent)" : "var(--dash-text-muted)",
                cursor: "pointer",
              }}
              onClick={() => {
                const nextStatus = statusFilter === "ALL" ? "IN_TRANSIT" : "ALL";
                setStatusFilter(nextStatus);
                setActiveFilters(nextStatus === "ALL" ? [] : [nextStatus]);
                setCurrentPage(1);
              }}
              title="Toggle filter"
            >
              <Icons.Filter size={13} />
            </div>

            {activeFilters.map((tag, idx) => (
              <span key={idx} className="dash-filter-pill">
                <span>{tag}</span>
                <button onClick={() => removeFilterTag(tag)}>
                  <Icons.X size={12} />
                </button>
              </span>
            ))}

            {activeFilters.length > 0 && (
              <button
                onClick={() => {
                  setActiveFilters([]);
                  setStatusFilter("ALL");
                  setCurrentPage(1);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--dash-text-muted)",
                  fontSize: "11px",
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                Clear all ({activeFilters.length})
              </button>
            )}
          </div>
        </div>

        {/* Right: Export, Sort, + Add batch, Pagination */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="dash-pill-btn"
            onClick={handleExport}
            title={selectedLots.size > 0 ? `Export ${selectedLots.size} selected lots` : "Export all displayed lots to JSON"}
          >
            <Icons.Download size={13} />
            <span>Export {selectedLots.size > 0 ? `(${selectedLots.size})` : ""}</span>
          </button>

          <button
            className="dash-pill-btn"
            onClick={handleCycleSort}
            title="Click to change sort order"
          >
            <Icons.SlidersHorizontal size={13} />
            <span>{getSortLabel()}</span>
          </button>

          {onOpenCreateModal && (
            <button
              className="dash-pill-btn white-action"
              onClick={onOpenCreateModal}
            >
              <Icons.PlusCircle size={14} />
              <span>+ Add batch</span>
            </button>
          )}

          {/* Pagination controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>
              {validCurrentPage} of {totalPages}
            </span>
            <button
              className="circle-arrow-btn"
              style={{
                width: "26px",
                height: "26px",
                background: "#1A1B20",
                opacity: validCurrentPage <= 1 ? 0.4 : 1,
                cursor: validCurrentPage <= 1 ? "not-allowed" : "pointer",
              }}
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous page"
            >
              <Icons.ChevronLeft size={13} />
            </button>
            <button
              className="circle-arrow-btn"
              style={{
                width: "26px",
                height: "26px",
                background: "#1A1B20",
                opacity: validCurrentPage >= totalPages ? 0.4 : 1,
                cursor: validCurrentPage >= totalPages ? "not-allowed" : "pointer",
              }}
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next page"
            >
              <Icons.ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Table */}
      <div
        className="dash-card"
        style={{
          overflow: "hidden",
          border: "1px solid var(--dash-border)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--dash-border)",
                  color: "var(--dash-text-muted)",
                  fontSize: "11px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <th style={{ padding: "14px 16px", width: "36px" }}>
                  <div
                    className={`dash-checkbox ${selectedLots.size > 0 && selectedLots.size === paginatedBatches.length ? "checked" : ""}`}
                    onClick={toggleSelectAll}
                  >
                    {selectedLots.size > 0 && <Icons.Check size={11} strokeWidth={3} />}
                  </div>
                </th>
                <th style={{ padding: "14px 16px" }}>ORDER / LOT NUMBER</th>
                <th style={{ padding: "14px 16px" }}>PRODUCT SPECIFICATION</th>
                <th style={{ padding: "14px 16px" }}>CUSTODIAN</th>
                <th style={{ padding: "14px 16px" }}>TEMP</th>
                <th style={{ padding: "14px 16px" }}>DATE</th>
                <th style={{ padding: "14px 16px" }}>ENVELOPE</th>
                <th style={{ padding: "14px 16px" }}>STATUS</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--dash-text-muted)" }}>
                    No pharmaceutical lots match current filters.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((batch) => {
                  const isSelected = activeBatchId === batch.batch_id;
                  const isChecked = selectedLots.has(batch.batch_id);

                  return (
                    <tr
                      key={batch.batch_id}
                      onClick={() => onSelectBatch(batch.batch_id)}
                      style={{
                        borderBottom: "1px solid var(--dash-border-subtle)",
                        background: isSelected ? "var(--dash-surface-hover)" : "transparent",
                        cursor: "pointer",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#18191F";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: "14px 16px" }} onClick={(e) => e.stopPropagation()}>
                        <div
                          className={`dash-checkbox ${isChecked ? "checked" : ""}`}
                          onClick={() => toggleSelectLot(batch.batch_id)}
                        >
                          {isChecked && <Icons.Check size={11} strokeWidth={3} />}
                        </div>
                      </td>

                      {/* Lot Number */}
                      <td className="font-mono" style={{ padding: "14px 16px", fontSize: "12px", color: "var(--dash-text-primary)", fontWeight: "600" }}>
                        № {formatAddress(batch.batch_id)}
                      </td>

                      {/* Product Name */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: "600", color: "var(--dash-text-primary)" }}>
                          {batch.product_name}
                        </div>
                        {batch.replacement_batch_id && (
                          <div style={{ fontSize: "10px", color: "var(--dash-blue-accent)", marginTop: "2px" }}>
                            ↪ Repl: {formatAddress(batch.replacement_batch_id)}
                          </div>
                        )}
                      </td>

                      {/* Current Custodian */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "12px", color: "var(--dash-text-primary)" }}>
                          {batch.current_custodian?.toLowerCase().includes("0xf39f") ? "BioVax Pharma" : "ColdLogix Reefer"}
                        </div>
                        <div className="font-mono" style={{ fontSize: "10px", color: "var(--dash-text-muted)" }}>
                          {formatAddress(batch.current_custodian)}
                        </div>
                      </td>

                      {/* Current Temp */}
                      <td className="font-mono" style={{ padding: "14px 16px", fontSize: "12px", color: "var(--dash-text-primary)" }}>
                        {lastPacket && (lastPacket.batch_id === batch.batch_id || lastPacket.batch_id?.toLowerCase() === batch.batch_id?.toLowerCase()) ? (
                          <span style={{ color: (lastPacket.temperature_celsius > batch.max_temp_celsius || lastPacket.temperature_celsius < batch.min_temp_celsius) ? "var(--dash-red-pill-text)" : "var(--dash-green-pill-text)", fontWeight: "700" }}>
                            {lastPacket.temperature_celsius.toFixed(2)}°C
                          </span>
                        ) : batch.status === "QUARANTINED" ? (
                          <span style={{ color: "var(--dash-red-pill-text)" }}>&gt; 8.00°C (Breach)</span>
                        ) : batch.status === "DELIVERED" ? (
                          <span style={{ color: "var(--dash-text-muted)" }}>Delivered</span>
                        ) : batch.status === "REPLENISHED" ? (
                          <span style={{ color: "var(--dash-blue-accent)" }}>Superseded</span>
                        ) : batch.status === "IN_TRANSIT" ? (
                          <span>4.50°C (Nominal)</span>
                        ) : (
                          <span style={{ color: "var(--dash-text-muted)" }}>Awaiting dispatch</span>
                        )}
                      </td>

                      {/* Timestamp / Date */}
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--dash-text-muted)" }}>
                        {formatDate(batch.created_at)}
                      </td>

                      {/* Safe Envelope */}
                      <td className="font-mono" style={{ padding: "14px 16px", fontSize: "12px", color: "var(--dash-text-secondary)" }}>
                        {batch.min_temp_celsius}°C – {batch.max_temp_celsius}°C
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: "14px 16px" }}>
                        {getStatusBadge(batch.status)}
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {batch.status === "IN_TRANSIT" && (
                            <button
                              className="dash-pill-btn"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              onClick={() => {
                                onSelectBatch(batch.batch_id);
                                if (isSelected && isSimulationRunning) {
                                  onPauseSimulation(batch.batch_id);
                                } else {
                                  onStartSimulation(batch.batch_id);
                                }
                              }}
                              title={isSelected && isSimulationRunning ? "Pause Telemetry" : "Run Telemetry Simulation"}
                            >
                              {isSelected && isSimulationRunning ? <Icons.Pause size={11} /> : <Icons.Play size={11} />}
                              <span>{isSelected && isSimulationRunning ? "Pause" : "Simulate"}</span>
                            </button>
                          )}

                          {(batch.status === "CREATED" || batch.status === "IN_TRANSIT") && (
                            <button
                              className="dash-pill-btn"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              onClick={() => onOpenHandoverModal(batch)}
                              title="Handover 2-of-2"
                            >
                              <Icons.ArrowRightLeft size={11} />
                              <span>Handover</span>
                            </button>
                          )}

                          <button
                            className="dash-pill-btn"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => onOpenQRModal(batch.batch_id)}
                            title="Verify QR"
                          >
                            <Icons.QrCode size={11} />
                          </button>

                          {onViewDetails && (
                            <button
                              className="dash-pill-btn"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              onClick={() => onViewDetails(batch.batch_id)}
                              title="Lot Dossier"
                            >
                              <Icons.MoreHorizontal size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
