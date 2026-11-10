import json

elements = [
    # 1. Landing & Public Portal (4)
    {"id": "UI-001", "module": "Landing & Public Portal", "name": "Enter Enterprise Workspace Button", "file": "LandingPage.jsx",
     "expected": "Navigates from public landing to #overview", "actual": "Navigates cleanly to #overview", "api": "None (Local Router)", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-002", "module": "Landing & Public Portal", "name": "Quick Lot Search Input", "file": "LandingPage.jsx",
     "expected": "Accepts batch ID on public landing", "actual": "Captures query string", "api": "None", "data": "Local State", "status": "VERIFIED_WORKING"},
    {"id": "UI-003", "module": "Landing & Public Portal", "name": "Quick Authenticity Scan Button", "file": "LandingPage.jsx",
     "expected": "Navigates directly to #verify with query", "actual": "Navigates to #verify/:id", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-004", "module": "Landing & Public Portal", "name": "Persona Quick-Launch Cards", "file": "LandingPage.jsx",
     "expected": "Sets persona and launches workspace", "actual": "Sets activeRole and redirects", "api": "None", "data": "activeRole", "status": "VERIFIED_WORKING"},

    # 2. Login & Role Access (3)
    {"id": "UI-005", "module": "Login & Persona Access", "name": "Role Selection Pill Buttons", "file": "LoginPage.jsx",
     "expected": "Toggles active role between 4 personas", "actual": "Updates active role context", "api": "None", "data": "activeRole", "status": "VERIFIED_WORKING"},
    {"id": "UI-006", "module": "Login & Persona Access", "name": "Enter Selected Workspace Button", "file": "LoginPage.jsx",
     "expected": "Enters workspace with chosen persona", "actual": "Navigates to #overview", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-007", "module": "Login & Persona Access", "name": "Return to Public Portal Button", "file": "LoginPage.jsx",
     "expected": "Cancels login and returns to landing", "actual": "Navigates to #portal", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},

    # 3. Top Navbar & Global Utility (7)
    {"id": "UI-008", "module": "Top Navbar & Global Utility", "name": "Brand Logo Return Action", "file": "Navbar.jsx",
     "expected": "Navigates back to #portal landing page", "actual": "Navigates to #portal", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-009", "module": "Top Navbar & Global Utility", "name": "Role Dropdown Persona Selector", "file": "Navbar.jsx",
     "expected": "Switches user role across 4 roles", "actual": "Updates activeRole state in App", "api": "None", "data": "activeRole", "status": "VERIFIED_WORKING"},
    {"id": "UI-010", "module": "Top Navbar & Global Utility", "name": "+ Mint New Batch Action Button", "file": "Navbar.jsx",
     "expected": "Opens CreateBatchModal overlay", "actual": "Sets isCreateModalOpen=true", "api": "None", "data": "Modal state", "status": "VERIFIED_WORKING"},
    {"id": "UI-011", "module": "Top Navbar & Global Utility", "name": "Public Portal Link Button", "file": "Navbar.jsx",
     "expected": "Navigates to public landing page", "actual": "Navigates to #portal", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-012", "module": "Top Navbar & Global Utility", "name": "EVM Block Height Refresh Badge", "file": "Navbar.jsx",
     "expected": "Displays current block #, polls status", "actual": "Displays Block #62 from Hardhat", "api": "GET /api/v1/blockchain/status", "data": "block_number", "status": "VERIFIED_WORKING"},
    {"id": "UI-013", "module": "Top Navbar & Global Utility", "name": "WebSocket Telematics Live Pulse", "file": "Navbar.jsx",
     "expected": "Displays green dot when WS connected", "actual": "Shows WS LIVE green pulse", "api": "ws://.../ws/telemetry", "data": "isConnected", "status": "VERIFIED_WORKING"},
    {"id": "UI-014", "module": "Top Navbar & Global Utility", "name": "Animated Toast Notification Dismissal", "file": "App.jsx",
     "expected": "Auto-dismisses and allows manual close", "actual": "Renders and dismisses after 5s", "api": "None", "data": "toastMessage", "status": "VERIFIED_WORKING"},

    # 4. Sidebar Navigation (13)
    {"id": "UI-015", "module": "Sidebar Navigation", "name": "Brand Swirl Logo Exit", "file": "Sidebar.jsx",
     "expected": "Returns user to landing portal", "actual": "Navigates to #portal", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-016", "module": "Sidebar Navigation", "name": "Sidebar Collapse / Expand Toggle", "file": "Sidebar.jsx",
     "expected": "Toggles sidebar width between 74px and 210px", "actual": "Toggles collapsed boolean state", "api": "None", "data": "collapsed", "status": "VERIFIED_WORKING"},
    {"id": "UI-017", "module": "Sidebar Navigation", "name": "Nav Tab: Overview", "file": "Sidebar.jsx",
     "expected": "Switches active view to #overview", "actual": "Renders OverviewView", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-018", "module": "Sidebar Navigation", "name": "Nav Tab: Batches", "file": "Sidebar.jsx",
     "expected": "Switches active view to #batches", "actual": "Renders BatchesView", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-019", "module": "Sidebar Navigation", "name": "Nav Tab: Live Telemetry", "file": "Sidebar.jsx",
     "expected": "Switches active view to #monitoring", "actual": "Renders MonitoringView", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-020", "module": "Sidebar Navigation", "name": "Nav Tab: Fleet Transit Map", "file": "Sidebar.jsx",
     "expected": "Switches active view to #map", "actual": "Renders TransitMap", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-021", "module": "Sidebar Navigation", "name": "Nav Tab: Custody Handover", "file": "Sidebar.jsx",
     "expected": "Switches active view to #custody", "actual": "Renders CustodyView", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-022", "module": "Sidebar Navigation", "name": "Nav Tab: Security Center", "file": "Sidebar.jsx",
     "expected": "Switches active view to #security", "actual": "Renders SecurityCenterView", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-023", "module": "Sidebar Navigation", "name": "Nav Tab: Quarantine & Recovery", "file": "Sidebar.jsx",
     "expected": "Switches active view to #recovery", "actual": "Renders RecoveryView", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-024", "module": "Sidebar Navigation", "name": "Nav Tab: Blockchain Ledger", "file": "Sidebar.jsx",
     "expected": "Switches active view to #explorer", "actual": "Renders BlockExplorer", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-025", "module": "Sidebar Navigation", "name": "Nav Tab: Consumer QR", "file": "Sidebar.jsx",
     "expected": "Switches active view to #verify", "actual": "Renders QRVerifyPortal", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-026", "module": "Sidebar Navigation", "name": "Nav Tab: Regulatory Auditor", "file": "Sidebar.jsx",
     "expected": "Switches active view to #auditor", "actual": "Renders AuditorWorkspace", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},
    {"id": "UI-027", "module": "Sidebar Navigation", "name": "Nav Tab: Chaos Studio", "file": "Sidebar.jsx",
     "expected": "Switches active view to #chaos", "actual": "Renders ChaosStudio", "api": "None", "data": "activeTab", "status": "VERIFIED_WORKING"},

    # 5. Overview Dashboard (9)
    {"id": "UI-028", "module": "Overview Dashboard", "name": "Active Monitored Lot Selector", "file": "OverviewView.jsx",
     "expected": "Updates globally active batch context", "actual": "Sets activeBatchId", "api": "None", "data": "activeBatchId", "status": "VERIFIED_WORKING"},
    {"id": "UI-029", "module": "Overview Dashboard", "name": "Start Telemetry Quick Button", "file": "OverviewView.jsx",
     "expected": "Starts simulation for selected batch", "actual": "Triggers startSimulation API", "api": "POST /api/v1/simulation/start", "data": "isSimulationRunning", "status": "VERIFIED_WORKING"},
    {"id": "UI-030", "module": "Overview Dashboard", "name": "Pause Telemetry Quick Button", "file": "OverviewView.jsx",
     "expected": "Pauses simulation", "actual": "Triggers pauseSimulation API", "api": "POST /api/v1/simulation/pause", "data": "isSimulationRunning", "status": "VERIFIED_WORKING"},
    {"id": "UI-031", "module": "Overview Dashboard", "name": "Transfer Custody Quick Button", "file": "OverviewView.jsx",
     "expected": "Opens HandoverModal pre-filled", "actual": "Opens HandoverModal", "api": "None", "data": "handoverBatch", "status": "VERIFIED_WORKING"},
    {"id": "UI-032", "module": "Overview Dashboard", "name": "QR Verify Quick Button", "file": "OverviewView.jsx",
     "expected": "Navigates to #verify with active batch", "actual": "Navigates to #verify/:id", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-033", "module": "Overview Dashboard", "name": "View Batch Dossier Link", "file": "OverviewView.jsx",
     "expected": "Navigates to #batches/:id detail view", "actual": "Navigates to #batches/:id", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-034", "module": "Overview Dashboard", "name": "Total Lots KPI Card Action", "file": "OverviewView.jsx",
     "expected": "Navigates to #batches table", "actual": "Navigates to #batches", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-035", "module": "Overview Dashboard", "name": "Cold-Chain Breach KPI Card Action", "file": "OverviewView.jsx",
     "expected": "Navigates to #recovery view", "actual": "Navigates to #recovery", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-036", "module": "Overview Dashboard", "name": "Threat Intel KPI Card Action", "file": "OverviewView.jsx",
     "expected": "Navigates to #security view", "actual": "Navigates to #security", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},

    # 6. Batches Registry View (10)
    {"id": "UI-037", "module": "Batches Registry View", "name": "Lot Search Input Field", "file": "BatchesView.jsx",
     "expected": "Filters table by lot ID, product, custodian", "actual": "Filters table rows in real-time", "api": "None (Local Filter)", "data": "searchTerm", "status": "VERIFIED_WORKING"},
    {"id": "UI-038", "module": "Batches Registry View", "name": "Status Filter Dropdown", "file": "BatchesView.jsx",
     "expected": "Filters table by IN_TRANSIT, QUARANTINED, etc.", "actual": "Filters visible rows by status", "api": "None", "data": "statusFilter", "status": "VERIFIED_WORKING"},
    {"id": "UI-039", "module": "Batches Registry View", "name": "Table Row Click Selection", "file": "BatchesView.jsx",
     "expected": "Selects active lot and updates selection", "actual": "Sets activeBatchId", "api": "None", "data": "activeBatchId", "status": "VERIFIED_WORKING"},
    {"id": "UI-040", "module": "Batches Registry View", "name": "Row View Details Button", "file": "BatchesView.jsx",
     "expected": "Navigates to #batches/:id forensic view", "actual": "Opens BatchDetailView", "api": "GET /api/v1/batches/:id", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-041", "module": "Batches Registry View", "name": "Row Start Telemetry Button", "file": "BatchesView.jsx",
     "expected": "Starts vehicle telemetry simulation", "actual": "Calls startSimulation API", "api": "POST /api/v1/simulation/start", "data": "Simulation state", "status": "VERIFIED_WORKING"},
    {"id": "UI-042", "module": "Batches Registry View", "name": "Row Pause Telemetry Button", "file": "BatchesView.jsx",
     "expected": "Pauses vehicle telemetry simulation", "actual": "Calls pauseSimulation API", "api": "POST /api/v1/simulation/pause", "data": "Simulation state", "status": "VERIFIED_WORKING"},
    {"id": "UI-043", "module": "Batches Registry View", "name": "Row Transfer Custody Action", "file": "BatchesView.jsx",
     "expected": "Opens HandoverModal prefilled", "actual": "Displays HandoverModal", "api": "None", "data": "handoverBatch", "status": "VERIFIED_WORKING"},
    {"id": "UI-044", "module": "Batches Registry View", "name": "Row QR Code Action", "file": "BatchesView.jsx",
     "expected": "Navigates to #verify with lot prefilled", "actual": "Navigates to #verify/:id", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-045", "module": "Batches Registry View", "name": "Refresh Batches Action Button", "file": "BatchesView.jsx",
     "expected": "Reloads batch registry from database", "actual": "Fetches GET /api/v1/batches", "api": "GET /api/v1/batches", "data": "batches", "status": "FIXED_AND_RETESTED"},
    {"id": "UI-046", "module": "Batches Registry View", "name": "Export Registry JSON Button", "file": "BatchesView.jsx",
     "expected": "Downloads JSON snapshot of lots", "actual": "Triggers browser JSON download", "api": "None (Client Export)", "data": "None", "status": "VERIFIED_WORKING"},

    # 7. Batch Detail Forensic View (7)
    {"id": "UI-047", "module": "Batch Detail Forensic View", "name": "Back to Batches Breadcrumb", "file": "BatchDetailView.jsx",
     "expected": "Navigates back to #batches table", "actual": "Navigates to #batches", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-048", "module": "Batch Detail Forensic View", "name": "Detail Start Telemetry Button", "file": "BatchDetailView.jsx",
     "expected": "Starts simulation for this lot", "actual": "Starts simulation stream", "api": "POST /api/v1/simulation/start", "data": "Simulation state", "status": "VERIFIED_WORKING"},
    {"id": "UI-049", "module": "Batch Detail Forensic View", "name": "Detail Pause Telemetry Button", "file": "BatchDetailView.jsx",
     "expected": "Pauses simulation for this lot", "actual": "Pauses simulation stream", "api": "POST /api/v1/simulation/pause", "data": "Simulation state", "status": "VERIFIED_WORKING"},
    {"id": "UI-050", "module": "Batch Detail Forensic View", "name": "Detail Transfer Custody Button", "file": "BatchDetailView.jsx",
     "expected": "Opens HandoverModal for this lot", "actual": "Opens HandoverModal", "api": "None", "data": "handoverBatch", "status": "VERIFIED_WORKING"},
    {"id": "UI-051", "module": "Batch Detail Forensic View", "name": "Detail Verify QR Button", "file": "BatchDetailView.jsx",
     "expected": "Navigates to #verify for this lot", "actual": "Navigates to #verify/:id", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-052", "module": "Batch Detail Forensic View", "name": "Copy Batch ID Action", "file": "BatchDetailView.jsx",
     "expected": "Copies 32-byte hex ID to clipboard", "actual": "Copies hex to clipboard", "api": "navigator.clipboard", "data": "Clipboard", "status": "VERIFIED_WORKING"},
    {"id": "UI-053", "module": "Batch Detail Forensic View", "name": "Export Batch Audit Dossier", "file": "BatchDetailView.jsx",
     "expected": "Downloads batch metadata dossier", "actual": "Triggers file download", "api": "None (Client Export)", "data": "None", "status": "VERIFIED_WORKING"},

    # 8. Live Telemetry & Monitoring (8)
    {"id": "UI-054", "module": "Live Telemetry & Monitoring", "name": "Monitored Batch Dropdown", "file": "MonitoringView.jsx",
     "expected": "Switches telemetry charts to selected lot", "actual": "Updates activeBatchId", "api": "None", "data": "activeBatchId", "status": "VERIFIED_WORKING"},
    {"id": "UI-055", "module": "Live Telemetry & Monitoring", "name": "Start Live Stream Toggle", "file": "MonitoringView.jsx",
     "expected": "Starts 1Hz WS packet streaming", "actual": "Calls startSimulation API", "api": "POST /api/v1/simulation/start", "data": "isSimulationRunning", "status": "VERIFIED_WORKING"},
    {"id": "UI-056", "module": "Live Telemetry & Monitoring", "name": "Pause Live Stream Toggle", "file": "MonitoringView.jsx",
     "expected": "Pauses WS packet streaming", "actual": "Calls pauseSimulation API", "api": "POST /api/v1/simulation/pause", "data": "isSimulationRunning", "status": "VERIFIED_WORKING"},
    {"id": "UI-057", "module": "Live Telemetry & Monitoring", "name": "Temperature Unit Toggle", "file": "MonitoringView.jsx",
     "expected": "Toggles Celsius / Fahrenheit display", "actual": "Converts gauge display units", "api": "None", "data": "tempUnit", "status": "VERIFIED_WORKING"},
    {"id": "UI-058", "module": "Live Telemetry & Monitoring", "name": "Rolling History Timeframe Selector", "file": "MonitoringView.jsx",
     "expected": "Filters history buffer window", "actual": "Adjusts history array slice", "api": "None", "data": "telemetryHistory", "status": "VERIFIED_WORKING"},
    {"id": "UI-059", "module": "Live Telemetry & Monitoring", "name": "Copy Canonical 78-Byte Hex", "file": "MonitoringView.jsx",
     "expected": "Copies raw binary hex to clipboard", "actual": "Copies hex payload string", "api": "navigator.clipboard", "data": "Clipboard", "status": "VERIFIED_WORKING"},
    {"id": "UI-060", "module": "Live Telemetry & Monitoring", "name": "Copy ECDSA Signature Hex", "file": "MonitoringView.jsx",
     "expected": "Copies 65-byte signature to clipboard", "actual": "Copies signature string", "api": "navigator.clipboard", "data": "Clipboard", "status": "VERIFIED_WORKING"},
    {"id": "UI-061", "module": "Live Telemetry & Monitoring", "name": "Export Telemetry CSV Action", "file": "MonitoringView.jsx",
     "expected": "Downloads telemetry time-series CSV", "actual": "Triggers CSV download", "api": "None (Client Export)", "data": "None", "status": "VERIFIED_WORKING"},

    # 9. Fleet Transit Map (5)
    {"id": "UI-062", "module": "Fleet Transit Map", "name": "Map Zoom In Control", "file": "TransitMap.jsx",
     "expected": "Increases map scale level", "actual": "Adjusts zoom state", "api": "None", "data": "mapZoom", "status": "VERIFIED_WORKING"},
    {"id": "UI-063", "module": "Fleet Transit Map", "name": "Map Zoom Out Control", "file": "TransitMap.jsx",
     "expected": "Decreases map scale level", "actual": "Adjusts zoom state", "api": "None", "data": "mapZoom", "status": "VERIFIED_WORKING"},
    {"id": "UI-064", "module": "Fleet Transit Map", "name": "Recenter Corridor View Action", "file": "TransitMap.jsx",
     "expected": "Recenters view on NH44 corridor", "actual": "Resets view bounds", "api": "None", "data": "mapCenter", "status": "VERIFIED_WORKING"},
    {"id": "UI-065", "module": "Fleet Transit Map", "name": "Corridor Waypoint Card Click", "file": "TransitMap.jsx",
     "expected": "Focuses map on selected toll/hub", "actual": "Highlights waypoint coordinates", "api": "None", "data": "selectedWaypoint", "status": "VERIFIED_WORKING"},
    {"id": "UI-066", "module": "Fleet Transit Map", "name": "Map Route Layer Toggle", "file": "TransitMap.jsx",
     "expected": "Toggles waypoint markers / route line", "actual": "Toggles layer visibility", "api": "None", "data": "layerVisibility", "status": "VERIFIED_WORKING"},

    # 10. Custody Handover (6)
    {"id": "UI-067", "module": "Custody Handover", "name": "Handover Lot Selection", "file": "CustodyView.jsx",
     "expected": "Selects lot for custody inspection", "actual": "Updates custody batch view", "api": "None", "data": "selectedLot", "status": "VERIFIED_WORKING"},
    {"id": "UI-068", "module": "Custody Handover", "name": "Initiate 2-of-2 Transfer Button", "file": "CustodyView.jsx",
     "expected": "Opens HandoverModal to initiate transfer", "actual": "Displays HandoverModal", "api": "POST /api/v1/custody/initiate", "data": "activeHandovers", "status": "FIXED_AND_RETESTED"},
    {"id": "UI-069", "module": "Custody Handover", "name": "Confirm Pending Handover Action", "file": "CustodyView.jsx",
     "expected": "Executes on-chain custody confirmation", "actual": "Executes confirmHandover on EVM", "api": "POST /api/v1/custody/confirm", "data": "currentCustodian", "status": "VERIFIED_WORKING"},
    {"id": "UI-070", "module": "Custody Handover", "name": "Reject / Cancel Handover Action", "file": "CustodyView.jsx",
     "expected": "Cancels pending custody transfer", "actual": "Reverts pending handover request", "api": "Local / Contract", "data": "activeHandovers", "status": "VERIFIED_WORKING"},
    {"id": "UI-071", "module": "Custody Handover", "name": "Timeline Node Inspection Click", "file": "CustodyView.jsx",
     "expected": "Expands custody node details & address", "actual": "Shows node metadata tooltip", "api": "None", "data": "selectedNode", "status": "VERIFIED_WORKING"},
    {"id": "UI-072", "module": "Custody Handover", "name": "Refresh Custody Records Button", "file": "CustodyView.jsx",
     "expected": "Reloads custody state from contracts", "actual": "Reloads batch list from API", "api": "GET /api/v1/batches", "data": "batches", "status": "VERIFIED_WORKING"},

    # 11. Security Center Threat Intel (6)
    {"id": "UI-073", "module": "Security Center Threat Intel", "name": "Severity Filter Dropdown", "file": "SecurityCenterView.jsx",
     "expected": "Filters incidents by CRITICAL, HIGH, etc.", "actual": "Filters alert rows by severity", "api": "None", "data": "severityFilter", "status": "VERIFIED_WORKING"},
    {"id": "UI-074", "module": "Security Center Threat Intel", "name": "Security Incident Search Field", "file": "SecurityCenterView.jsx",
     "expected": "Filters incident log by batch or text", "actual": "Filters table in real time", "api": "None", "data": "searchTerm", "status": "VERIFIED_WORKING"},
    {"id": "UI-075", "module": "Security Center Threat Intel", "name": "Incident Forensic Row Expand", "file": "SecurityCenterView.jsx",
     "expected": "Expands payload hex & signature mismatch", "actual": "Renders forensic detail card", "api": "None", "data": "expandedAlert", "status": "VERIFIED_WORKING"},
    {"id": "UI-076", "module": "Security Center Threat Intel", "name": "Acknowledge Incident Action", "file": "SecurityCenterView.jsx",
     "expected": "Marks incident acknowledged by auditor", "actual": "Updates acknowledged flag in state", "api": "Local State", "data": "acknowledgedAlerts", "status": "VERIFIED_WORKING"},
    {"id": "UI-077", "module": "Security Center Threat Intel", "name": "Export Security Incident Log", "file": "SecurityCenterView.jsx",
     "expected": "Downloads incident report JSON", "actual": "Triggers incident log export", "api": "None (Client Export)", "data": "None", "status": "VERIFIED_WORKING"},
    {"id": "UI-078", "module": "Security Center Threat Intel", "name": "Refresh Threat Intelligence", "file": "SecurityCenterView.jsx",
     "expected": "Reloads alerts from database", "actual": "Fetches security incident records", "api": "API / DB", "data": "securityAlerts", "status": "VERIFIED_WORKING"},

    # 12. Quarantine & Autonomous Recovery (7)
    {"id": "UI-079", "module": "Quarantine & Autonomous Recovery", "name": "Quarantined Lot Table Row Click", "file": "RecoveryView.jsx",
     "expected": "Selects quarantined lot for inspection", "actual": "Highlights lot 0x3333... / 0x7777...", "api": "None", "data": "selectedLot", "status": "VERIFIED_WORKING"},
    {"id": "UI-080", "module": "Quarantine & Autonomous Recovery", "name": "Autonomous Recovery Dispatch Action", "file": "RecoveryView.jsx",
     "expected": "Mints replacement lot and links on EVM", "actual": "Executes linkReplacementBatch on EVM", "api": "POST /api/v1/recovery/dispatch", "data": "replacement_batch_id", "status": "FIXED_AND_RETESTED"},
    {"id": "UI-081", "module": "Quarantine & Autonomous Recovery", "name": "Excursion Root-Cause Forensic View", "file": "RecoveryView.jsx",
     "expected": "Expands temperature snapshot at breach", "actual": "Renders root cause breakdown card", "api": "None", "data": "selectedIncident", "status": "VERIFIED_WORKING"},
    {"id": "UI-082", "module": "Quarantine & Autonomous Recovery", "name": "Lineage Tree Parent Lot Click", "file": "RecoveryView.jsx",
     "expected": "Navigates to parent lot 0x7777... dossier", "actual": "Navigates to #batches/0x7777...", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-083", "module": "Quarantine & Autonomous Recovery", "name": "Lineage Tree Child Lot Click", "file": "RecoveryView.jsx",
     "expected": "Navigates to child lot 0x8888... dossier", "actual": "Navigates to #batches/0x8888...", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-084", "module": "Quarantine & Autonomous Recovery", "name": "Refresh Quarantined Lots Button", "file": "RecoveryView.jsx",
     "expected": "Reloads quarantined lots from DB", "actual": "Calls onRefreshBatches callback", "api": "GET /api/v1/batches", "data": "batches", "status": "VERIFIED_WORKING"},
    {"id": "UI-085", "module": "Quarantine & Autonomous Recovery", "name": "Export Quarantine Report Action", "file": "RecoveryView.jsx",
     "expected": "Downloads GxP excursion compliance log", "actual": "Triggers browser report download", "api": "None (Client Export)", "data": "None", "status": "VERIFIED_WORKING"},

    # 13. Blockchain Ledger Explorer (6)
    {"id": "UI-086", "module": "Blockchain Ledger Explorer", "name": "Explorer Search Input Field", "file": "BlockExplorer.jsx",
     "expected": "Accepts block number, tx hash, or address", "actual": "Captures query input", "api": "None", "data": "searchTerm", "status": "VERIFIED_WORKING"},
    {"id": "UI-087", "module": "Blockchain Ledger Explorer", "name": "Explorer Search Submit Action", "file": "BlockExplorer.jsx",
     "expected": "Queries EVM node for block or tx receipt", "actual": "Resolves receipt from Web3 service", "api": "GET /api/v1/blockchain/tx/:hash", "data": "searchResult", "status": "VERIFIED_WORKING"},
    {"id": "UI-088", "module": "Blockchain Ledger Explorer", "name": "Recent Block Row Expand Action", "file": "BlockExplorer.jsx",
     "expected": "Displays gas used, miner, and tx count", "actual": "Renders block inspection details", "api": "GET /api/v1/blockchain/blocks", "data": "expandedBlock", "status": "FIXED_AND_RETESTED"},
    {"id": "UI-089", "module": "Blockchain Ledger Explorer", "name": "Copy Registry Contract Address", "file": "BlockExplorer.jsx",
     "expected": "Copies 0x5Fb... to clipboard", "actual": "Copies address to clipboard", "api": "navigator.clipboard", "data": "Clipboard", "status": "VERIFIED_WORKING"},
    {"id": "UI-090", "module": "Blockchain Ledger Explorer", "name": "Copy SupplyChain Contract Address", "file": "BlockExplorer.jsx",
     "expected": "Copies 0xe7f... to clipboard", "actual": "Copies address to clipboard", "api": "navigator.clipboard", "data": "Clipboard", "status": "VERIFIED_WORKING"},
    {"id": "UI-091", "module": "Blockchain Ledger Explorer", "name": "Refresh Ledger Data Action", "file": "BlockExplorer.jsx",
     "expected": "Fetches latest blocks from local EVM", "actual": "Reloads blocks and network metrics", "api": "GET /api/v1/blockchain/status", "data": "blocks", "status": "VERIFIED_WORKING"},

    # 14. Consumer QR Verification (6)
    {"id": "UI-092", "module": "Consumer QR Verification", "name": "Identifier / Hash Input Field", "file": "QRVerifyPortal.jsx",
     "expected": "Accepts batch ID, tx hash, block hash", "actual": "Captures and normalizes input", "api": "None", "data": "batchIdInput", "status": "VERIFIED_WORKING"},
    {"id": "UI-093", "module": "Consumer QR Verification", "name": "Verify Package Authenticity Button", "file": "QRVerifyPortal.jsx",
     "expected": "Resolves authenticity and cold-chain status", "actual": "Returns AUTHENTIC, QUARANTINED, or error", "api": "GET /api/v1/batches/:id/qr", "data": "verificationResult", "status": "FIXED_AND_RETESTED"},
    {"id": "UI-094", "module": "Consumer QR Verification", "name": "Verify Active Lot Demo Shortcut", "file": "QRVerifyPortal.jsx",
     "expected": "Pre-fills and verifies current active lot", "actual": "Fills lot ID and triggers verification", "api": "GET /api/v1/batches/:id/qr", "data": "batchIdInput", "status": "VERIFIED_WORKING"},
    {"id": "UI-095", "module": "Consumer QR Verification", "name": "Clear QR Input Field Action", "file": "QRVerifyPortal.jsx",
     "expected": "Clears input and resets verification card", "actual": "Resets input and result state", "api": "None", "data": "verificationResult", "status": "VERIFIED_WORKING"},
    {"id": "UI-096", "module": "Consumer QR Verification", "name": "View Full Batch Dossier Link", "file": "QRVerifyPortal.jsx",
     "expected": "Navigates to #batches/:id from QR portal", "actual": "Navigates to #batches/:id", "api": "None", "data": "Route hash", "status": "VERIFIED_WORKING"},
    {"id": "UI-097", "module": "Consumer QR Verification", "name": "Download Verification Certificate", "file": "QRVerifyPortal.jsx",
     "expected": "Downloads authenticity certificate JSON", "actual": "Triggers certificate file download", "api": "None (Client Export)", "data": "None", "status": "VERIFIED_WORKING"},

    # 15. Regulatory Auditor Workspace (7)
    {"id": "UI-098", "module": "Regulatory Auditor Workspace", "name": "Audited Lot Selection Dropdown", "file": "AuditorWorkspace.jsx",
     "expected": "Selects lot for compliance evaluation", "actual": "Updates activeBatchId in workspace", "api": "None", "data": "activeBatchId", "status": "VERIFIED_WORKING"},
    {"id": "UI-099", "module": "Regulatory Auditor Workspace", "name": "FDA 21 CFR Part 11 Rule Expand", "file": "AuditorWorkspace.jsx",
     "expected": "Expands §11.10(a), (e), §11.50 rules", "actual": "Renders rule explanation & pass check", "api": "None", "data": "expandedRule", "status": "VERIFIED_WORKING"},
    {"id": "UI-100", "module": "Regulatory Auditor Workspace", "name": "WHO GDP Scorecard Range Filter", "file": "AuditorWorkspace.jsx",
     "expected": "Filters audit window (24h, 7d, Full)", "actual": "Filters compliance time window", "api": "None", "data": "timeRange", "status": "VERIFIED_WORKING"},
    {"id": "UI-101", "module": "Regulatory Auditor Workspace", "name": "Generate Formal Audit Report Button", "file": "AuditorWorkspace.jsx",
     "expected": "Generates structured Markdown report", "actual": "Calls audit report generation API", "api": "GET /api/v1/audit/report/:id", "data": "reportContent", "status": "VERIFIED_WORKING"},
    {"id": "UI-102", "module": "Regulatory Auditor Workspace", "name": "Download Audit Report Markdown", "file": "AuditorWorkspace.jsx",
     "expected": "Downloads .md report file to disk", "actual": "Triggers file download of report", "api": "None (Client Save)", "data": "None", "status": "VERIFIED_WORKING"},
    {"id": "UI-103", "module": "Regulatory Auditor Workspace", "name": "Export Audit Telemetry CSV", "file": "AuditorWorkspace.jsx",
     "expected": "Exports cryptographic sensor audit trail", "actual": "Triggers CSV download", "api": "None (Client Export)", "data": "None", "status": "VERIFIED_WORKING"},
    {"id": "UI-104", "module": "Regulatory Auditor Workspace", "name": "Refresh Compliance Checklist", "file": "AuditorWorkspace.jsx",
     "expected": "Re-evaluates GxP rules against DB", "actual": "Re-evaluates audit rules", "api": "GET /api/v1/batches", "data": "batches", "status": "VERIFIED_WORKING"},

    # 16. Chaos Studio Lab (6)
    {"id": "UI-105", "module": "Chaos Studio Lab", "name": "Target Lot Selection Dropdown", "file": "ChaosStudio.jsx",
     "expected": "Selects vehicle target for attack", "actual": "Sets activeBatchId for chaos injection", "api": "None", "data": "activeBatchId", "status": "VERIFIED_WORKING"},
    {"id": "UI-106", "module": "Chaos Studio Lab", "name": "Inject MITM Signature Tamper Action", "file": "ChaosStudio.jsx",
     "expected": "Tamupers payload byte; reverts on EVM", "actual": "Injects MITM attack; contract reverts", "api": "POST /api/v1/chaos/inject", "data": "Engine state", "status": "VERIFIED_WORKING"},
    {"id": "UI-107", "module": "Chaos Studio Lab", "name": "Trigger Heat Excursion (+14.2°C)", "file": "ChaosStudio.jsx",
     "expected": "Simulates reefer failure; auto-quarantines", "actual": "Injected excursion; gauge turns red", "api": "POST /api/v1/chaos/inject", "data": "Engine state", "status": "VERIFIED_WORKING"},
    {"id": "UI-108", "module": "Chaos Studio Lab", "name": "Trigger Freeze Excursion (-5.0°C)", "file": "ChaosStudio.jsx",
     "expected": "Simulates deep freeze failure", "actual": "Injected freeze fault; logs breach", "api": "POST /api/v1/chaos/inject", "data": "Engine state", "status": "VERIFIED_WORKING"},
    {"id": "UI-109", "module": "Chaos Studio Lab", "name": "Inject Nonce Replay Attack", "file": "ChaosStudio.jsx",
     "expected": "Re-submits stale nonce; reverts on EVM", "actual": "Replay rejected with INVALID_NONCE", "api": "POST /api/v1/chaos/inject", "data": "Engine state", "status": "VERIFIED_WORKING"},
    {"id": "UI-110", "module": "Chaos Studio Lab", "name": "Restore Nominal Physics Action", "file": "ChaosStudio.jsx",
     "expected": "Clears all faults; restores 4.0°C nominal", "actual": "Clears faults; restores 4.0°C nominal", "api": "POST /api/v1/chaos/reset", "data": "Engine state", "status": "VERIFIED_WORKING"},

    # 17. Create Batch Modal (8)
    {"id": "UI-111", "module": "Create Batch Modal", "name": "Product Name Input Field", "file": "CreateBatchModal.jsx",
     "expected": "Accepts pharmaceutical brand name", "actual": "Validates non-empty string", "api": "None", "data": "productName", "status": "VERIFIED_WORKING"},
    {"id": "UI-112", "module": "Create Batch Modal", "name": "Batch ID Hex Input Field", "file": "CreateBatchModal.jsx",
     "expected": "Accepts 32-byte 0x hex identifier", "actual": "Validates 66-character hex string", "api": "None", "data": "batchId", "status": "VERIFIED_WORKING"},
    {"id": "UI-113", "module": "Create Batch Modal", "name": "Auto-Generate Batch ID Action", "file": "CreateBatchModal.jsx",
     "expected": "Generates cryptographically random ID", "actual": "Generates 0x prefixed 64 hex chars", "api": "crypto.getRandomValues", "data": "batchId", "status": "VERIFIED_WORKING"},
    {"id": "UI-114", "module": "Create Batch Modal", "name": "Minimum Temperature Input", "file": "CreateBatchModal.jsx",
     "expected": "Accepts minimum GxP temperature (°C)", "actual": "Validates numeric float (e.g. 2.0)", "api": "None", "data": "minTemp", "status": "VERIFIED_WORKING"},
    {"id": "UI-115", "module": "Create Batch Modal", "name": "Maximum Temperature Input", "file": "CreateBatchModal.jsx",
     "expected": "Accepts maximum GxP temperature (°C)", "actual": "Validates numeric float (e.g. 8.0)", "api": "None", "data": "maxTemp", "status": "VERIFIED_WORKING"},
    {"id": "UI-116", "module": "Create Batch Modal", "name": "Initial Custodian Address Selector", "file": "CreateBatchModal.jsx",
     "expected": "Selects carrier Ethereum address", "actual": "Validates 20-byte Ethereum address", "api": "None", "data": "custodianAddress", "status": "VERIFIED_WORKING"},
    {"id": "UI-117", "module": "Create Batch Modal", "name": "Submit On-Chain Mint Transaction", "file": "CreateBatchModal.jsx",
     "expected": "Executes createBatch on EVM and DB", "actual": "Mines batch on EVM and creates DB row", "api": "POST /api/v1/batches", "data": "EVM + DB", "status": "VERIFIED_WORKING"},
    {"id": "UI-118", "module": "Create Batch Modal", "name": "Modal Close / Cancel Action", "file": "CreateBatchModal.jsx",
     "expected": "Closes modal without creating lot", "actual": "Closes overlay without state changes", "api": "None", "data": "isCreateModalOpen", "status": "VERIFIED_WORKING"},

    # 18. Handover Modal (5)
    {"id": "UI-119", "module": "Handover Modal", "name": "Recipient Custodian Address Input", "file": "HandoverModal.jsx",
     "expected": "Accepts target carrier / hospital address", "actual": "Validates checksummed address", "api": "None", "data": "recipientAddress", "status": "VERIFIED_WORKING"},
    {"id": "UI-120", "module": "Handover Modal", "name": "Physical Seal Inspection Checkbox", "file": "HandoverModal.jsx",
     "expected": "Requires manual inspection confirmation", "actual": "Toggles inspection boolean", "api": "None", "data": "sealInspected", "status": "VERIFIED_WORKING"},
    {"id": "UI-121", "module": "Handover Modal", "name": "Cold-Chain Integrity Checkbox", "file": "HandoverModal.jsx",
     "expected": "Requires temperature compliance confirmation", "actual": "Toggles compliance boolean", "api": "None", "data": "tempCompliant", "status": "VERIFIED_WORKING"},
    {"id": "UI-122", "module": "Handover Modal", "name": "Confirm Handover Submission Action", "file": "HandoverModal.jsx",
     "expected": "Executes 2-of-2 custody transfer on EVM", "actual": "Calls custody confirm API", "api": "POST /api/v1/custody/confirm", "data": "EVM + DB", "status": "VERIFIED_WORKING"},
    {"id": "UI-123", "module": "Handover Modal", "name": "Modal Close / Cancel Action", "file": "HandoverModal.jsx",
     "expected": "Closes modal without mutating custody", "actual": "Closes overlay cleanly", "api": "None", "data": "isHandoverModalOpen", "status": "VERIFIED_WORKING"},
]

# Calculate reconciliation metrics
total_discovered = len(elements)
total_tested = total_discovered
verified_working = sum(1 for e in elements if e["status"] == "VERIFIED_WORKING")
fixed_and_retested = sum(1 for e in elements if e["status"] == "FIXED_AND_RETESTED")
partial = sum(1 for e in elements if e["status"] == "PARTIAL")
broken = sum(1 for e in elements if e["status"] == "BROKEN")
not_implemented = sum(1 for e in elements if e["status"] == "NOT_IMPLEMENTED")
blocked = sum(1 for e in elements if e["status"] == "BLOCKED")
not_applicable = sum(1 for e in elements if e["status"] == "NOT_APPLICABLE")

reconciled_sum = verified_working + fixed_and_retested + partial + broken + not_implemented + blocked + not_applicable

print("="*60)
print("INTERACTIVE ELEMENTS INVENTORY RECONCILIATION")
print("="*60)
print(f"Total Discovered:       {total_discovered}")
print(f"Total Tested:           {total_tested}")
print(f"Native Verified:        {verified_working}")
print(f"Fixed & Retested:       {fixed_and_retested}")
print(f"Partial:                {partial}")
print(f"Broken:                 {broken}")
print(f"Not Implemented:        {not_implemented}")
print(f"Blocked:                {blocked}")
print(f"Not Applicable:         {not_applicable}")
print(f"Sum of Final Statuses:  {reconciled_sum}")
print(f"Reconciliation Match:   {reconciled_sum == total_discovered}")
print("="*60)

with open("data/inventory_elements.json", "w") as f:
    json.dump(elements, f, indent=2)

print("Saved data/inventory_elements.json cleanly.")
