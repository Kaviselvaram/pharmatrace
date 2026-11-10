#!/usr/bin/env python3
"""
PharmaTrace Comprehensive REST API & Edge Matrix Verification Suite.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S

Tests all 23 API endpoints covering:
- Positive flows (Health, Batches, Handover, Telemetry, Verify, Audit, Blockchain)
- Negative/boundary flows (Inverted temperature bounds, duplicate lots, invalid attack enums,
  non-existent lots, duplicate handover confirms)
"""

import sys
import os
import json
import secrets
import urllib.request
import urllib.error

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8001")

results = []

def make_req(method, path, body=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {"raw": content}
    except Exception as e:
        return 0, {"error": str(e)}

def record(endpoint, test_type, caller, expected_status, actual_status, passed, notes=""):
    results.append({
        "endpoint": endpoint,
        "test_type": test_type,
        "caller": caller,
        "expected_status": expected_status,
        "actual_status": actual_status,
        "passed": passed,
        "notes": notes
    })

def main():
    print("=" * 65)
    print("🧪 PHARMATRACE: EXECUTING COMPREHENSIVE REST API MATRIX (23 ENDPOINTS)")
    print("=" * 65)

    # 1. GET /health
    st, resp = make_req("GET", "/health")
    record("GET /health", "System Health Check", "Monitoring/DevOps", 200, st, st == 200, resp.get("status", ""))

    # 2. GET /
    st, resp = make_req("GET", "/")
    record("GET /", "Root Metadata Check", "System", 200, st, st == 200, "Service descriptor")

    # 3. GET /api/v1/batches
    st, resp = make_req("GET", "/api/v1/batches")
    record("GET /api/v1/batches", "List Batches", "Overview/BatchesView", 200, st, st == 200, f"{len(resp)} batches retrieved")

    # 4. POST /api/v1/batches - Valid
    new_lot = "0x" + secrets.token_hex(32)
    payload = {
        "batch_id": new_lot,
        "product_name": "Moderna Spikevax mRNA-1273 (Matrix Test)",
        "min_temp_celsius": 2.0,
        "max_temp_celsius": 8.0
    }
    st, resp = make_req("POST", "/api/v1/batches", payload)
    record("POST /api/v1/batches", "Valid Batch Mint", "CreateBatchModal", 201, st, st == 201, f"Lot: {new_lot[:14]}...")

    # 5. POST /api/v1/batches - Duplicate Lot ID
    st, resp = make_req("POST", "/api/v1/batches", payload)
    record("POST /api/v1/batches", "Duplicate Batch ID Rejection", "CreateBatchModal", 400, st, st == 400, "Correctly rejected duplicate")

    # 6. POST /api/v1/batches - Invalid Bounds (min >= max)
    inv_payload = {
        "batch_id": "0x" + secrets.token_hex(32),
        "product_name": "Inverted Temperature Range Lot",
        "min_temp_celsius": 10.0,
        "max_temp_celsius": 2.0
    }
    st, resp = make_req("POST", "/api/v1/batches", inv_payload)
    record("POST /api/v1/batches", "Inverted Range Validation", "CreateBatchModal", 400, st, st == 400, "Rejected with HTTP 400 Bad Request")

    # 7. GET /api/v1/batches/{batch_id} - Valid
    st, resp = make_req("GET", f"/api/v1/batches/{new_lot}")
    record("GET /api/v1/batches/{id}", "Get Batch Details", "BatchDetailView", 200, st, st == 200, f"Status: {resp.get('metadata', {}).get('status')}")

    # 8. GET /api/v1/batches/{batch_id} - Non-existent
    st, resp = make_req("GET", "/api/v1/batches/0x0000000000000000000000000000000000000000000000000000000000009999")
    record("GET /api/v1/batches/{id}", "Non-existent Batch Query", "BatchDetailView", 404, st, st == 404, "404 Not Found")

    # 9. POST /api/v1/handover/initiate - Valid
    carrier_addr = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    init_payload = {"batch_id": new_lot, "recipient_address": carrier_addr}
    st, resp = make_req("POST", "/api/v1/handover/initiate", init_payload)
    record("POST /api/v1/handover/initiate", "Handover Step 1 (Initiate)", "HandoverModal", 200, st, st == 200, f"Tx: {resp.get('tx_hash', '')[:16]}...")

    # 10. POST /api/v1/handover/initiate - Non-existent batch
    st, resp = make_req("POST", "/api/v1/handover/initiate", {"batch_id": "0x9999999999999999999999999999999999999999999999999999999999999999", "recipient_address": carrier_addr})
    record("POST /api/v1/handover/initiate", "Handover Unknown Batch", "HandoverModal", 404, st, st == 404, "404 Not Found")

    # 11. POST /api/v1/handover/confirm - Valid
    mfg_addr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    conf_payload = {"batch_id": new_lot, "sender_address": mfg_addr}
    st, resp = make_req("POST", "/api/v1/handover/confirm", conf_payload)
    record("POST /api/v1/handover/confirm", "Handover Step 2 (Confirm)", "HandoverModal", 200, st, st == 200, f"Status: {resp.get('new_status')}")

    # 12. POST /api/v1/handover/confirm - Double Confirm (Should fail because already confirmed)
    st, resp = make_req("POST", "/api/v1/handover/confirm", conf_payload)
    record("POST /api/v1/handover/confirm", "Replay Confirmation Rejection", "HandoverModal", 400, st, st == 400, "Rejected already confirmed handover")

    # 13. POST /api/v1/simulation/start - Valid
    st, resp = make_req("POST", f"/api/v1/simulation/start?batch_id={new_lot}")
    record("POST /api/v1/simulation/start", "Start Telemetry Worker", "Overview/Chaos", 200, st, st == 200, f"Status: {resp.get('status')}")

    # 14. POST /api/v1/simulation/attack - Valid MITM
    attack_payload = {"batch_id": new_lot, "attack_type": "MITM_ALTERATION", "tamper_delta": -8.0}
    st, resp = make_req("POST", "/api/v1/simulation/attack", attack_payload)
    record("POST /api/v1/simulation/attack", "Inject MITM Fault", "ChaosStudio", 200, st, st == 200, f"Injected: {resp.get('attack_type')}")

    # 15. POST /api/v1/simulation/attack - Invalid Attack Type
    st, resp = make_req("POST", "/api/v1/simulation/attack", {"batch_id": new_lot, "attack_type": "UNKNOWN_ATTACK_XYZ"})
    record("POST /api/v1/simulation/attack", "Invalid Fault Enum Rejection", "ChaosStudio", 400, st, st in [400, 422], "HTTP 400/422 Rejected")

    # 16. POST /api/v1/simulation/reset-attacks - Valid
    st, resp = make_req("POST", f"/api/v1/simulation/reset-attacks?batch_id={new_lot}")
    record("POST /api/v1/simulation/reset-attacks", "Reset Chaos Faults", "ChaosStudio", 200, st, st == 200, "Restored nominal thermodynamics")

    # 17. POST /api/v1/simulation/pause - Valid
    st, resp = make_req("POST", f"/api/v1/simulation/pause?batch_id={new_lot}")
    record("POST /api/v1/simulation/pause", "Pause Telemetry Worker", "Overview/Waveform", 200, st, st == 200, "Simulation paused")

    # 18. GET /api/v1/blockchain/status - Valid
    st, resp = make_req("GET", "/api/v1/blockchain/status")
    record("GET /api/v1/blockchain/status", "Blockchain RPC Status", "Navbar/Explorer", 200, st, st == 200 and resp.get("connected") == True, f"Block #{resp.get('block_number')}")

    # 19. GET /api/v1/blockchain/blocks - Valid
    st, resp = make_req("GET", "/api/v1/blockchain/blocks?limit=5")
    record("GET /api/v1/blockchain/blocks", "Query Recent Mined Blocks", "BlockExplorer", 200, st, st == 200, f"{len(resp.get('blocks', []))} blocks fetched")

    # 20. GET /api/v1/verify/{batch_id} - Valid
    st, resp = make_req("GET", f"/api/v1/verify/{new_lot}")
    record("GET /api/v1/verify/{id}", "Public Consumer QR Scan", "QRVerifyPortal", 200, st, st == 200, f"Safe: {resp.get('is_safe_to_administer')}")

    # 21. GET /api/v1/verify/{batch_id} - Non-existent
    st, resp = make_req("GET", "/api/v1/verify/0x9999999999999999999999999999999999999999999999999999999999999999")
    record("GET /api/v1/verify/{id}", "Verify Unknown QR Code", "QRVerifyPortal", 404, st, st == 404, "404 Not Found")

    # 22. GET /api/v1/audit/{batch_id}/report - Valid
    st, resp = make_req("GET", f"/api/v1/audit/{new_lot}/report")
    record("GET /api/v1/audit/{id}/report", "Generate FDA Regulatory Report", "AuditorWorkspace", 200, st, st == 200, f"Compliant: {resp.get('cold_chain_compliant')}")

    # 23. GET /api/v1/audit/{batch_id}/report - Non-existent
    st, resp = make_req("GET", "/api/v1/audit/0x9999999999999999999999999999999999999999999999999999999999999999/report")
    record("GET /api/v1/audit/{id}/report", "Audit Non-existent Batch", "AuditorWorkspace", 404, st, st == 404, "404 Not Found")

    passed_count = sum(1 for r in results if r["passed"])
    failed_count = len(results) - passed_count

    print("\n" + "=" * 65)
    print(f"📊 API MATRIX RESULTS: {passed_count}/{len(results)} PASSED | {failed_count} FAILED")
    print("=" * 65)
    for r in results:
        status_tag = "✅ PASS" if r["passed"] else "❌ FAIL"
        print(f"{status_tag} | {r['endpoint']:<32} | {r['test_type']:<30} | Status: {r['actual_status']}")

    if failed_count > 0:
        print(f"\n❌ API Matrix Failed with {failed_count} failing checks.")
        sys.exit(1)
    else:
        print("\n🎉 ALL 23 REST API MATRIX SCENARIOS VERIFIED SUCCESSFULLY (100% GREEN)")
        sys.exit(0)

if __name__ == "__main__":
    main()
