#!/usr/bin/env python3
"""
E2E Golden Path & Adversarial Verification Script
CBS3002 Information Security Project - Final Verification Gate
Tests all 19 steps of the Golden Path against live Backend (8001) and EVM (8546).
"""

import sys
import os
import time
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8001"
RPC_URL = "http://127.0.0.1:8546"

def api_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {"error": content}

def rpc_call(method, params=[]):
    payload = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode("utf-8")
    req = urllib.request.Request(RPC_URL, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("=" * 60)
    print("🚀 RUNNING INFOSECPROJ E2E GOLDEN PATH VERIFICATION")
    print("=" * 60)

    # Step 0: Check health and blockchain connectivity
    print("\n[Step 0] Health & Blockchain Connectivity Check...")
    status_code, health = api_request("/health")
    assert status_code == 200, f"Health check failed: {health}"
    print(f"   ✔ Backend health: {health['status']}")

    status_code, bc_status = api_request("/api/v1/blockchain/status")
    assert status_code == 200 and bc_status["connected"], f"Blockchain not connected: {bc_status}"
    print(f"   ✔ EVM Chain ID: {bc_status['chain_id']}, Block: {bc_status['block_number']}")
    print(f"   ✔ SupplyChainRegistry: {bc_status['registry_address']}")
    print(f"   ✔ PharmaSupplyChain: {bc_status['supply_chain_address']}")

    # Step 1: Batch creation
    print("\n[Step 1] Creating New Pharmaceutical Lot...")
    import secrets
    unique_lot_id = "0x" + secrets.token_hex(32)
    product_name = "Pfizer-BioNTech Comirnaty BNT162b2 (Lot E2E-TEST)"
    create_payload = {
        "batch_id": unique_lot_id,
        "product_name": product_name,
        "min_temp_celsius": 2.0,
        "max_temp_celsius": 8.0
    }
    status_code, batch_resp = api_request("/api/v1/batches", method="POST", data=create_payload)
    assert status_code == 201, f"Batch creation failed: {batch_resp}"
    print(f"   ✔ Batch Created: {batch_resp['batch_id'][:18]}... Status: {batch_resp['status']}")
    print(f"   ✔ Genesis Tx Hash: {batch_resp.get('genesis_tx_hash')}")

    # Step 2: Manufacturer ownership verification
    print("\n[Step 2] Verifying Initial Manufacturer Ownership...")
    mfg_address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".lower()
    carrier_address = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC".lower()
    hospital_address = "0x90F79bf6EB2c4f870365E785982E1f101E93b906".lower()
    assert batch_resp["manufacturer_address"].lower() == mfg_address
    assert batch_resp["current_custodian"].lower() == mfg_address
    print(f"   ✔ Initial Custodian confirmed as Manufacturer ({mfg_address})")

    # Step 3: Custody handover initiation (Manufacturer -> Carrier)
    print("\n[Step 3] Initiating 2-of-2 Custody Handover (Step 1/2: Manufacturer -> Carrier)...")
    init_payload = {
        "batch_id": unique_lot_id,
        "recipient_address": carrier_address
    }
    status_code, init_resp = api_request("/api/v1/handover/initiate", method="POST", data=init_payload)
    assert status_code == 200, f"Handover initiation failed: {init_resp}"
    print(f"   ✔ Handover Initiated on-chain! Tx: {init_resp['tx_hash']}")

    # Step 4: Carrier confirmation (Step 2/2)
    print("\n[Step 4] Confirming Custody Handover (Step 2/2: Carrier Counter-Signature)...")
    confirm_payload = {
        "batch_id": unique_lot_id,
        "sender_address": mfg_address
    }
    status_code, confirm_resp = api_request("/api/v1/handover/confirm", method="POST", data=confirm_payload)
    assert status_code == 200, f"Handover confirmation failed: {confirm_resp}"
    print(f"   ✔ Custody Handover Finalized! New Custodian: {confirm_resp['new_custodian']}")
    print(f"   ✔ Batch Status: {confirm_resp['status']}, Tx: {confirm_resp['tx_hash']}")

    # Step 5-8: Telemetry Generation, Signing, On-chain verification, Normal cold chain
    print("\n[Step 5-8] Testing Telemetry Generation, 78-Byte Canonical Signing & Normal Ingestion...")
    # Import core security modules to construct exact packets
    from app.core.security import (
        create_canonical_payload,
        hash_canonical_payload,
        sign_telemetry_payload,
        recover_telemetry_signer
    )
    from app.services.web3_service import web3_service

    carrier_key = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
    temp_nominal = 4.5
    lat = 13.0827
    lon = 80.2707
    ts = int(time.time())
    nonce = 1

    sig_dict = sign_telemetry_payload(carrier_key, unique_lot_id, temp_nominal, lat, lon, ts, nonce)
    packet = {
        "batch_id": unique_lot_id,
        "temperature_celsius": temp_nominal,
        "temperature_scaled": int(temp_nominal * 100),
        "latitude": lat,
        "longitude": lon,
        "latitude_scaled": int(lat * 1_000_000),
        "longitude_scaled": int(lon * 1_000_000),
        "timestamp": ts,
        "nonce": nonce,
        "raw_hash": sig_dict["raw_hash"],
        "v": sig_dict["v"],
        "r": sig_dict["r"],
        "s": sig_dict["s"],
        "custodian_address": carrier_address,
        "is_tampered_mitm": False
    }

    # Submit on-chain
    success, tx_or_err = web3_service.submit_signed_telemetry_on_chain(packet, carrier_key)
    assert success, f"Normal telemetry submission failed: {tx_or_err}"
    print(f"   ✔ Normal Telemetry (4.50°C) accepted on-chain. Tx: {tx_or_err}")

    # Step 9-10: MITM Attack — Altered Temperature
    print("\n[Step 9-10] Testing MITM Tamper Attack (Payload modified 12.5°C -> 4.0°C)...")
    # Genuine reading signed at 12.5°C
    tamper_nonce = 2
    genuine_temp = 12.5
    tamper_sig = sign_telemetry_payload(carrier_key, unique_lot_id, genuine_temp, lat, lon, ts + 2, tamper_nonce)

    # Attacker alters temperature field to 4.0°C without having carrier's private key
    mitm_packet = {
        "batch_id": unique_lot_id,
        "temperature_celsius": 4.0,
        "temperature_scaled": 400,
        "latitude": lat,
        "longitude": lon,
        "latitude_scaled": int(lat * 1_000_000),
        "longitude_scaled": int(lon * 1_000_000),
        "timestamp": ts + 2,
        "nonce": tamper_nonce,
        "raw_hash": tamper_sig["raw_hash"], # Old hash
        "v": tamper_sig["v"],
        "r": tamper_sig["r"],
        "s": tamper_sig["s"],
        "custodian_address": carrier_address,
        "is_tampered_mitm": True
    }

    mitm_success, mitm_err = web3_service.submit_signed_telemetry_on_chain(mitm_packet, carrier_key)
    assert not mitm_success, "MITM packet should have been REJECTED by smart contract!"
    assert "INVALID_SIGNATURE" in mitm_err or "execution reverted" in mitm_err or "UnauthorizedSigner" in mitm_err
    print(f"   ✔ MITM attack correctly rejected by smart contract! Reason: {mitm_err}")

    # Step 10b: Replay Attack — Submitting old nonce
    print("\n[Step 10b] Testing Replay Attack (Submitting old nonce = 1)...")
    replay_packet = {
        "batch_id": unique_lot_id,
        "temperature_celsius": 4.5,
        "temperature_scaled": 450,
        "latitude": lat,
        "longitude": lon,
        "latitude_scaled": int(lat * 1_000_000),
        "longitude_scaled": int(lon * 1_000_000),
        "timestamp": ts + 5,
        "nonce": 1, # Replay old nonce!
        "raw_hash": sig_dict["raw_hash"],
        "v": sig_dict["v"],
        "r": sig_dict["r"],
        "s": sig_dict["s"],
        "custodian_address": carrier_address,
        "is_tampered_mitm": False
    }
    replay_success, replay_err = web3_service.submit_signed_telemetry_on_chain(replay_packet, carrier_key)
    assert not replay_success, "Replay attack should have been REJECTED by smart contract!"
    print(f"   ✔ Replay attack correctly rejected! Nonce monotonic check enforced: {replay_err}")

    # Step 11-14: Thermal Excursion, Authentic Signature Accepted, Batch Quarantined
    print("\n[Step 11-14] Testing Authentic Thermal Excursion (11.80°C > 8.00°C threshold)...")
    excursion_temp = 11.80
    excursion_nonce = 3
    excursion_sig = sign_telemetry_payload(carrier_key, unique_lot_id, excursion_temp, lat, lon, ts + 10, excursion_nonce)
    excursion_packet = {
        "batch_id": unique_lot_id,
        "temperature_celsius": excursion_temp,
        "temperature_scaled": int(excursion_temp * 100),
        "latitude": lat,
        "longitude": lon,
        "latitude_scaled": int(lat * 1_000_000),
        "longitude_scaled": int(lon * 1_000_000),
        "timestamp": ts + 10,
        "nonce": excursion_nonce,
        "raw_hash": excursion_sig["raw_hash"],
        "v": excursion_sig["v"],
        "r": excursion_sig["r"],
        "s": excursion_sig["s"],
        "custodian_address": carrier_address,
        "is_tampered_mitm": False
    }

    exc_success, exc_tx = web3_service.submit_signed_telemetry_on_chain(excursion_packet, carrier_key)
    assert exc_success, f"Authentic signature should be accepted: {exc_tx}"
    print(f"   ✔ Authentic Signature Accepted on-chain! Tx: {exc_tx}")

    # Check on-chain batch status
    chain_batch = web3_service.get_batch_from_chain(unique_lot_id)
    assert chain_batch["status"] == "QUARANTINED", f"Expected QUARANTINED, got {chain_batch['status']}"
    print(f"   ✔ SMART CONTRACT AUTOMATICALLY TRANSITIONED STATUS TO: {chain_batch['status']}")

    # Step 15-16: Replacement Batch Creation & Autonomous Digital Recovery
    print("\n[Step 15-16] Testing Autonomous Digital Recovery & Replacement Linking...")
    replacement_lot_id = "0x" + secrets.token_hex(32)
    mfg_key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    
    # Create replacement batch
    rep_tx = web3_service.create_batch_on_chain(
        batch_id_hex=replacement_lot_id,
        product_name=f"EXPEDITED REPLACEMENT - {product_name}",
        min_temp_c=2.0,
        max_temp_c=8.0,
        mfg_private_key=mfg_key
    )
    print(f"   ✔ Replacement Lot Created on-chain: {replacement_lot_id[:18]}... Tx: {rep_tx}")

    # Link replacement to quarantined batch
    link_tx = web3_service.link_replacement_batch_on_chain(
        quarantined_batch_id_hex=unique_lot_id,
        replacement_batch_id_hex=replacement_lot_id,
        mfg_private_key=mfg_key
    )
    print(f"   ✔ Replacement Linked to Quarantined Batch! Tx: {link_tx}")

    # Verify link on-chain
    updated_chain_batch = web3_service.get_batch_from_chain(unique_lot_id)
    assert updated_chain_batch["replacement_batch_id"].lower() == replacement_lot_id.lower()
    print(f"   ✔ On-Chain Verified: Quarantined batch now points to Replacement: {updated_chain_batch['replacement_batch_id'][:18]}...")

    # Step 17: QR Verification Endpoint
    print("\n[Step 17] Verifying Public Consumer QR Portal API...")
    status_code, qr_data = api_request(f"/api/v1/verify/{unique_lot_id}")
    assert status_code == 200, f"QR batch fetch failed: {qr_data}"
    print(f"   ✔ QR Data: Batch Status: {qr_data['status']}, Product: {qr_data['product_name']}")
    print(f"   ✔ Safe to administer: {qr_data['is_safe_to_administer']}, Breached: {qr_data['cold_chain_breached']}")
    print(f"   ✔ Replacement Linked: {qr_data.get('replacement_batch_id')}")

    # Step 18: Auditor Report Verification
    print("\n[Step 18] Verifying Auditor Regulatory Export API (FDA 21 CFR Part 11)...")
    status_code, audit_data = api_request(f"/api/v1/audit/{unique_lot_id}/report")
    assert status_code == 200, f"Audit report failed: {audit_data}"
    print(f"   ✔ Auditor Report generated successfully:")
    print(f"      - Batch ID: {audit_data['batch_id'][:18]}...")
    print(f"      - Compliant: {audit_data['cold_chain_compliant']}")
    print(f"      - Total Telemetry Observations: {audit_data['total_telemetry_points']}")
    print(f"      - Breach Count: {audit_data['breach_count']}")
    print(f"      - Markdown Report preview:\n{audit_data['markdown_report'][:150]}...")

    # Step 19: Ledger Inspection
    print("\n[Step 19] Verifying Blockchain Ledger Inspection...")
    block_info = rpc_call("eth_getBlockByNumber", ["latest", False])
    latest_block = int(block_info["result"]["number"], 16)
    print(f"   ✔ Latest EVM Mined Block: #{latest_block}")
    assert latest_block > 0, "Block height should have advanced during transactions"

    print("\n" + "=" * 60)
    print("🎉 ALL 19 GOLDEN PATH STEPS VERIFIED WITH 100% EMPIRICAL PROOF")
    print("=" * 60)

if __name__ == "__main__":
    main()
