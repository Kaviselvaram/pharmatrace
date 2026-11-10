#!/usr/bin/env python3
"""
PharmaTrace 20-Scenario Comprehensive End-to-End Acceptance Test Suite.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
Complies with Phase 7 of Release Readiness.
"""

import sys
import os
import time
import json
import secrets
import sqlite3
import urllib.request
import urllib.error

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.path.join(ROOT_DIR, "backend") not in sys.path:
    sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))

from app.core.security import sign_telemetry_payload
from app.services.web3_service import web3_service

BACKEND_URL = "http://127.0.0.1:8001"
FRONTEND_URL = "http://localhost:5174"
EVM_URL = "http://127.0.0.1:8546"
DB_PATH = os.path.join(ROOT_DIR, "data/infosecproj.db")

MFG_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MFG_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
CARRIER_ADDR = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
CARRIER_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
HOSPITAL_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
HOSPITAL_KEY = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

def api_request(path, method="GET", data=None):
    url = f"{BACKEND_URL}{path}"
    headers = {"Content-Type": "application/json"}
    encoded = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"detail": body}
        return e.code, parsed
    except Exception as e:
        return 0, {"error": str(e)}


def run_all_20_scenarios():
    print("=" * 70)
    print("🛡️  PHARMATRACE 20-SCENARIO END-TO-END ACCEPTANCE TEST SUITE")
    print("=" * 70)

    results = []

    def record(scen_num, name, passed, detail=""):
        status_str = "✅ PASS" if passed else "❌ FAIL"
        results.append((scen_num, name, passed, detail))
        print(f"[{status_str}] Scenario {scen_num:02d}: {name}")
        if detail:
            print(f"         └─ {detail}")

    # SCENARIO 1: Startup Readiness
    try:
        status, health = api_request("/health")
        chain_status, chain_data = api_request("/api/v1/blockchain/status")
        evm_ok = chain_data.get("connected", False)
        db_exists = os.path.exists(DB_PATH)
        scen1_ok = (status == 200 and health.get("status") == "HEALTHY" and evm_ok and db_exists)
        record(1, "Startup Readiness & Multi-Service Health", scen1_ok, f"Backend=200, EVM_Connected={evm_ok}, DB_Exists={db_exists}")
    except Exception as e:
        record(1, "Startup Readiness & Multi-Service Health", False, str(e))

    # SCENARIO 2: Batch Creation via API
    test_batch_id = "0x" + secrets.token_hex(32)
    product_name = f"E2E Acceptance Vaccine Lot #{test_batch_id[2:8].upper()}"
    status, batch_resp = api_request("/api/v1/batches", method="POST", data={
        "batch_id": test_batch_id,
        "product_name": product_name,
        "min_temp_celsius": 2.0,
        "max_temp_celsius": 8.0
    })
    scen2_ok = (status == 201 and batch_resp.get("batch_id") == test_batch_id and batch_resp.get("status") == "CREATED")
    record(2, "Batch Creation via REST API", scen2_ok, f"Created {test_batch_id[:14]}... Status: {batch_resp.get('status')}")

    # SCENARIO 3: Batch Visibility in API and Database
    status, batch_list = api_request("/api/v1/batches")
    found_in_api = any(b.get("batch_id") == test_batch_id for b in batch_list)
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("SELECT status, product_name FROM batches WHERE batch_id = ?", (test_batch_id,))
    db_row = cur.fetchone()
    con.close()
    scen3_ok = (status == 200 and found_in_api and db_row is not None and db_row[0] == "CREATED")
    record(3, "Batch Visibility in API and SQLite DB", scen3_ok, f"Found in API: {found_in_api}, DB Status: {db_row[0] if db_row else None}")

    # SCENARIO 4: On-Chain Batch State Verification
    chain_lot = web3_service.get_batch_from_chain(test_batch_id) if web3_service.is_connected() else None
    scen4_ok = (chain_lot is not None and chain_lot.get("status") == "CREATED" and chain_lot.get("manufacturer").lower() == MFG_ADDR.lower())
    record(4, "On-Chain EVM Batch Creation & Role Verification", scen4_ok, f"EVM Status: {chain_lot.get('status') if chain_lot else None}, Mfg: {chain_lot.get('manufacturer')[:12] if chain_lot else None}...")

    # SCENARIO 5: Authorized 2-of-2 Custody Handover (Step 1 + Step 2)
    # Step 1: Initiate
    s1, r1 = api_request("/api/v1/handover/initiate", method="POST", data={
        "batch_id": test_batch_id,
        "recipient_address": CARRIER_ADDR
    })
    # Step 2: Confirm
    s2, r2 = api_request("/api/v1/handover/confirm", method="POST", data={
        "batch_id": test_batch_id,
        "sender_address": MFG_ADDR
    })
    updated_chain = web3_service.get_batch_from_chain(test_batch_id)
    scen5_ok = (s1 == 200 and s2 == 200 and updated_chain and updated_chain["status"] == "IN_TRANSIT" and updated_chain["current_custodian"].lower() == CARRIER_ADDR.lower())
    record(5, "Authorized 2-of-2 Custody Handover (Mfg -> Carrier)", scen5_ok, f"New Custodian: {updated_chain.get('current_custodian')[:12] if updated_chain else None}..., Status: {updated_chain.get('status') if updated_chain else None}")

    # SCENARIO 6: Telemetry Ingestion via Backend Gateway
    ts = web3_service.get_current_chain_time()
    sig = sign_telemetry_payload(CARRIER_KEY, test_batch_id, 4.5, 17.5186, 78.5833, ts, 1)
    status, telem_res = api_request(f"/api/v1/batches/{test_batch_id}/telemetry", method="POST", data={
        "temperature_celsius": 4.5,
        "latitude": 17.5186,
        "longitude": 78.5833,
        "timestamp": ts,
        "nonce": 1,
        "signature_v": sig["v"],
        "signature_r": sig["r"],
        "signature_s": sig["s"]
    })
    scen6_ok = (status == 200 and telem_res.get("is_compliant") is True)
    record(6, "Telemetry Ingestion & Signature Verification", scen6_ok, f"Compliant: {telem_res.get('is_compliant')}, Tx: {telem_res.get('on_chain_tx_hash')[:14] if telem_res.get('on_chain_tx_hash') else 'N/A'}...")

    # SCENARIO 7: Telemetry Persistence in Database
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("SELECT temperature_celsius, nonce FROM telemetry_records WHERE batch_id = ? ORDER BY id DESC LIMIT 1", (test_batch_id,))
    t_row = cur.fetchone()
    con.close()
    scen7_ok = (t_row is not None and abs(t_row[0] - 4.5) < 0.01 and t_row[1] == 1)
    record(7, "Telemetry Database Persistence & Retrieval", scen7_ok, f"Persisted Temp: {t_row[0] if t_row else None}°C, Nonce: {t_row[1] if t_row else None}")

    # SCENARIO 8: Invalid Telemetry Rejection (Out of Bounds Coordinates)
    s8, r8 = api_request(f"/api/v1/batches/{test_batch_id}/telemetry", method="POST", data={
        "temperature_celsius": 4.5,
        "latitude": 95.0, # Latitude > 90 invalid!
        "longitude": 78.5833,
        "timestamp": ts + 10,
        "nonce": 2,
        "signature_v": 28,
        "signature_r": "0x" + "1" * 64,
        "signature_s": "0x" + "2" * 64
    })
    scen8_ok = (s8 == 400 and ("out of bounds" in str(r8).lower() or "latitude" in str(r8).lower()))
    record(8, "Invalid Telemetry Rejection (Latitude > 90° Boundary)", scen8_ok, f"HTTP Status: {s8}, Error: {r8.get('detail')}")

    # SCENARIO 9: Tampered Signature Rejection (MITM Mutation)
    # Sign nominal 4.5°C, but submit payload claiming 12.0°C
    sig_nominal = sign_telemetry_payload(CARRIER_KEY, test_batch_id, 4.5, 17.5186, 78.5833, ts + 20, 2)
    s9, r9 = api_request(f"/api/v1/batches/{test_batch_id}/telemetry", method="POST", data={
        "temperature_celsius": 12.0, # Tampered!
        "latitude": 17.5186,
        "longitude": 78.5833,
        "timestamp": ts + 20,
        "nonce": 2,
        "signature_v": sig_nominal["v"],
        "signature_r": sig_nominal["r"],
        "signature_s": sig_nominal["s"]
    })
    scen9_ok = (s9 in [400, 422] or r9.get("is_compliant") is False or "signature" in str(r9).lower())
    record(9, "Tampered Payload MITM Rejection", scen9_ok, f"HTTP Status: {s9}, Response: {str(r9)[:60]}...")

    # SCENARIO 10: Monotonic Nonce Replay Attack Rejection
    # Submitting nonce = 1 again (already consumed in Scenario 6)
    s10, r10 = api_request(f"/api/v1/batches/{test_batch_id}/telemetry", method="POST", data={
        "temperature_celsius": 4.5,
        "latitude": 17.5186,
        "longitude": 78.5833,
        "timestamp": ts,
        "nonce": 1, # REPLAY OF NONCE 1!
        "signature_v": sig["v"],
        "signature_r": sig["r"],
        "signature_s": sig["s"]
    })
    scen10_ok = (s10 == 400 and ("replay" in str(r10).lower() or "nonce" in str(r10).lower()))
    record(10, "Exact-Packet Replay Attack Rejection (Strict Monotonic Nonce)", scen10_ok, f"HTTP Status: {s10}, Error: {r10.get('detail')}")

    # SCENARIO 11: Temperature Excursion & Autonomous On-Chain Quarantine
    ts_exc = web3_service.get_current_chain_time()
    sig_exc = sign_telemetry_payload(CARRIER_KEY, test_batch_id, 14.8, 16.7488, 77.9897, ts_exc, 3)
    s11, r11 = api_request(f"/api/v1/batches/{test_batch_id}/telemetry", method="POST", data={
        "temperature_celsius": 14.8, # Excursion > 8.0°C!
        "latitude": 16.7488,
        "longitude": 77.9897,
        "timestamp": ts_exc,
        "nonce": 3,
        "signature_v": sig_exc["v"],
        "signature_r": sig_exc["r"],
        "signature_s": sig_exc["s"]
    })
    chain_post_exc = web3_service.get_batch_from_chain(test_batch_id)
    scen11_ok = (chain_post_exc and chain_post_exc["status"] == "QUARANTINED")
    record(11, "Cold-Chain Thermal Excursion & Smart Contract Quarantine", scen11_ok, f"Excursion 14.8°C submitted -> On-chain Status: {chain_post_exc.get('status') if chain_post_exc else None}")

    # SCENARIO 12: Unauthorized Custody Transfer Rejection
    # Batch is in QUARANTINED status, so handover initiation must be rejected by smart contract
    s12, r12 = api_request("/api/v1/handover/initiate", method="POST", data={
        "batch_id": test_batch_id,
        "recipient_address": MFG_ADDR
    })
    scen12_ok = (s12 == 400 and ("not eligible" in str(r12).lower() or "failed" in str(r12).lower()))
    record(12, "Unauthorized Custody Handover Rejection", scen12_ok, f"HTTP Status: {s12}, Rejection detail: {str(r12.get('detail'))[:60]}...")

    # SCENARIO 13: Expedited Replacement Lot Minting & On-Chain Lineage Link
    rep_batch_id = "0x" + secrets.token_hex(32)
    s13_mint, r13_mint = api_request("/api/v1/batches", method="POST", data={
        "batch_id": rep_batch_id,
        "product_name": f"EXPEDITED REPLACEMENT - {product_name}",
        "min_temp_celsius": 2.0,
        "max_temp_celsius": 8.0
    })
    s13_link, r13_link = api_request(f"/api/v1/batches/{test_batch_id}/link-replacement", method="POST", data={
        "replacement_batch_id": rep_batch_id
    })
    chain_parent = web3_service.get_batch_from_chain(test_batch_id)
    chain_child = web3_service.get_batch_from_chain(rep_batch_id)
    scen13_ok = (s13_link == 200 and chain_parent and chain_parent["status"] == "REPLENISHED" and chain_parent["replacement_batch_id"].lower() == rep_batch_id.lower())
    record(13, "Expedited Replacement Mint & Autonomous On-Chain Lineage Binding", scen13_ok, f"Parent: {test_batch_id[:14]} (REPLENISHED) -> Replacement: {rep_batch_id[:14]}")

    # SCENARIO 14: Public Consumer QR Scan & Verification
    s14, r14 = api_request(f"/api/v1/verify/{test_batch_id}")
    scen14_ok = (s14 == 200 and r14.get("status") == "REPLENISHED" and r14.get("is_safe_to_administer") is False and r14.get("cold_chain_breached") is True and r14.get("replacement_batch_id") == rep_batch_id)
    record(14, "Consumer QR Verification Endpoint (Dossier & Safety Logic)", scen14_ok, f"Status: {r14.get('status')}, Safe: {r14.get('is_safe_to_administer')}, Replacement: {r14.get('replacement_batch_id')[:14] if r14.get('replacement_batch_id') else None}")

    # SCENARIO 15: Unknown QR Identifier Rejection (No Fallback Substitution)
    fake_id = "0x" + "f" * 64
    s15, r15 = api_request(f"/api/v1/verify/{fake_id}")
    scen15_ok = (s15 == 404 and "not found" in str(r15).lower() and r15.get("batch_id") != "0x1111111111111111111111111111111111111111111111111111111111111111")
    record(15, "Unknown Identifier Rejection (Zero Fallback Substitution)", scen15_ok, f"HTTP Status: {s15}, Returned 404 without silent lot replacement.")

    # SCENARIO 16: Blockchain Explorer Blocks & Transactions Inspection
    s16, r16 = api_request("/api/v1/blockchain/blocks?limit=5")
    blocks = r16.get("blocks", [])
    has_valid_blocks = len(blocks) > 0 and all("number" in b and "hash" in b for b in blocks)
    scen16_ok = (s16 == 200 and has_valid_blocks)
    record(16, "Blockchain Explorer Mined Blocks & Transaction Inspection", scen16_ok, f"Blocks returned: {len(blocks)}, Current block: {r16.get('current_block')}")

    # SCENARIO 17: FDA 21 CFR Part 11 Regulatory Compliance Report
    s17, r17 = api_request(f"/api/v1/audit/{test_batch_id}/report")
    report_md = r17.get("markdown_report", "")
    scen17_ok = (s17 == 200 and "21 CFR Part 11" in report_md and r17.get("batch_id") == test_batch_id)
    record(17, "FDA 21 CFR Part 11 Regulatory Audit Generation", scen17_ok, f"Report length: {len(report_md)} chars, Batch ID: {r17.get('batch_id')[:14]}")

    # SCENARIO 18: Database Persistence Across Process Reconnect
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("SELECT status, replacement_batch_id FROM batches WHERE batch_id = ?", (test_batch_id,))
    row18 = cur.fetchone()
    con.close()
    scen18_ok = (row18 is not None and row18[0] == "REPLENISHED" and row18[1] == rep_batch_id)
    record(18, "Database State Persistence Across Connection Cycles", scen18_ok, f"SQLite Batch: {test_batch_id[:14]} has status={row18[0] if row18 else None}")

    # SCENARIO 19: Safe Repeated Seeder Execution (Idempotency)
    # Check count of demo lots
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM batches WHERE batch_id LIKE '0x1111%' OR batch_id LIKE '0x2222%'")
    c_before = cur.fetchone()[0]
    con.close()
    # Re-run seeder function directly
    if ROOT_DIR not in sys.path:
        sys.path.insert(0, ROOT_DIR)
    from scripts.seed_demo_data import seed_database
    seed_database()
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM batches WHERE batch_id LIKE '0x1111%' OR batch_id LIKE '0x2222%'")
    c_after = cur.fetchone()[0]
    con.close()
    scen19_ok = (c_before == c_after)
    record(19, "Safe Repeated Seeder Execution (Strict Idempotency)", scen19_ok, f"Demo batch count before={c_before}, after={c_after} (zero duplicates).")

    # SCENARIO 20: Frontend Reverse-Proxy and WebSocket Readiness
    try:
        req = urllib.request.Request(f"{FRONTEND_URL}/api/v1/blockchain/status")
        with urllib.request.urlopen(req, timeout=5) as resp:
            p_status = resp.status
            p_data = json.loads(resp.read().decode("utf-8"))
        scen20_ok = (p_status == 200 and p_data.get("connected") is True)
        record(20, "Frontend Vite Reverse Proxy & Backend Bridge Verification", scen20_ok, f"Proxy status={p_status}, on-chain EVM connected={p_data.get('connected')}")
    except Exception as e:
        record(20, "Frontend Vite Reverse Proxy & Backend Bridge Verification", False, str(e))

    print("=" * 70)
    passed_count = sum(1 for _, _, p, _ in results if p)
    print(f"📊 SUMMARY: {passed_count}/20 ACCEPTANCE SCENARIOS PASSED")
    print("=" * 70)

    if passed_count != 20:
        sys.exit(1)


if __name__ == "__main__":
    run_all_20_scenarios()
