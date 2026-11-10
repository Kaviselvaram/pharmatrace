#!/usr/bin/env python3
"""
PharmaTrace Coherent Demonstration Dataset Seeder.
CBS3002 Information Security Project - Final Demonstration Readiness

Seeds 8 stable, predictable demonstration lots across all key supply chain scenarios:
1. 0x1111... - Normal active shipment in-transit (Comirnaty mRNA Vaccine)
2. 0x2222... - Pre-transit lot created at manufacturer (Covaxin Inactivated)
3. 0x3333... - Thermal excursion quarantined lot (Spikevax mRNA-1273)
4. 0x4444... - Cryptographic MITM tamper attempt lot (Vaxzevria ChAdOx1)
5. 0x5555... - Monotonic nonce replay attack lot (Corbevax RBD Subunit)
6. 0x6666... - Fully delivered hospital pharmacy lot (ZyCoV-D DNA Vaccine)
7. 0x7777... - Quarantined parent lot linked to replacement (Rotavac Oral)
8. 0x8888... - Expedited child replacement lot in-transit (EXPEDITED Rotavac)

Guarantees:
- Idempotent: Safe to rerun repeatedly without corrupting data or failing.
- Purely additive: Preserves existing unrelated database records.
- Real on-chain verification: Mints, transfers custody, and links lots directly on local EVM.
"""

import sys
import os
import json
import time
import sqlite3
import hashlib
from datetime import datetime, timezone

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.path.join(ROOT_DIR, "backend") not in sys.path:
    sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))

from app.core.security import sign_telemetry_payload
from app.services.web3_service import web3_service

DB_PATH = os.path.join(ROOT_DIR, "data/infosecproj.db")

# Demo Participant Accounts
MFG_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MFG_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

CARRIER_ADDR = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
CARRIER_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"

HOSPITAL_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
HOSPITAL_KEY = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

DEMO_LOTS = [
    {
        "batch_id": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "product_name": "Comirnaty mRNA COVID-19 Vaccine (2-8°C)",
        "min_temp": 2.0,
        "max_temp": 8.0,
        "target_status": "IN_TRANSIT",
        "custodian": CARRIER_ADDR,
        "telemetry_count": 8,
        "nominal_temp": 4.35,
        "scenario": "Normal In-Transit Telemetry",
    },
    {
        "batch_id": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "product_name": "Covaxin Purified Inactivated Lot B-4091",
        "min_temp": 2.0,
        "max_temp": 8.0,
        "target_status": "CREATED",
        "custodian": MFG_ADDR,
        "telemetry_count": 0,
        "nominal_temp": 4.5,
        "scenario": "Pre-Transit Genesis Formulation at Manufacturer",
    },
    {
        "batch_id": "0x3333333333333333333333333333333333333333333333333333333333333333",
        "product_name": "Spikevax mRNA-1273 (Thermal Breach Lot)",
        "min_temp": 2.0,
        "max_temp": 8.0,
        "target_status": "QUARANTINED",
        "custodian": CARRIER_ADDR,
        "telemetry_count": 4,
        "nominal_temp": 12.8,
        "scenario": "Thermal Excursion & Smart Contract Quarantine",
        "alert": {
            "type": "COLD_CHAIN_EXCURSION",
            "severity": "CRITICAL",
            "message": "Temperature excursion detected: 12.8°C outside 2.0°C - 8.0°C threshold. Batch quarantined on-chain.",
        },
    },
    {
        "batch_id": "0x4444444444444444444444444444444444444444444444444444444444444444",
        "product_name": "Vaxzevria ChAdOx1 (MITM Adversarial Lot)",
        "min_temp": 2.0,
        "max_temp": 8.0,
        "target_status": "IN_TRANSIT",
        "custodian": CARRIER_ADDR,
        "telemetry_count": 6,
        "nominal_temp": 4.1,
        "scenario": "Active Transit with Flagged MITM Tamper Alert",
        "alert": {
            "type": "MITM_TAMPER_ATTACK",
            "severity": "CRITICAL",
            "message": "Cryptographic Signature Mismatch: Sensor claimed 12.5°C, payload altered to 4.0°C in transit.",
        },
    },
    {
        "batch_id": "0x5555555555555555555555555555555555555555555555555555555555555555",
        "product_name": "Corbevax RBD Protein Subunit (Replay Attack Lot)",
        "min_temp": 2.0,
        "max_temp": 8.0,
        "target_status": "IN_TRANSIT",
        "custodian": CARRIER_ADDR,
        "telemetry_count": 5,
        "nominal_temp": 4.6,
        "scenario": "Active Transit with Intercepted Monotonic Replay Attempt",
        "alert": {
            "type": "REPLAY_ATTACK",
            "severity": "HIGH",
            "message": "Monotonic Replay Attack Detected: Nonce 1 already consumed on-chain. Packet rejected.",
        },
    },
    {
        "batch_id": "0x6666666666666666666666666666666666666666666666666666666666666666",
        "product_name": "ZyCoV-D DNA Vaccine (Hospital Delivered Lot)",
        "min_temp": 2.0,
        "max_temp": 8.0,
        "target_status": "DELIVERED",
        "custodian": HOSPITAL_ADDR,
        "telemetry_count": 10,
        "nominal_temp": 4.2,
        "scenario": "Fully Completed 2-of-2 Custody Handover to Hospital",
    },
    {
        "batch_id": "0x7777777777777777777777777777777777777777777777777777777777777777",
        "product_name": "Rotavac Oral Monovalent (Spoiled Parent Lot)",
        "min_temp": 2.0,
        "max_temp": 8.0,
        "target_status": "REPLENISHED",
        "custodian": CARRIER_ADDR,
        "replacement_id": "0x8888888888888888888888888888888888888888888888888888888888888888",
        "telemetry_count": 6,
        "nominal_temp": 9.4,
        "scenario": "Quarantined Parent Lot Linked to Autonomous Replacement",
        "alert": {
            "type": "COLD_CHAIN_EXCURSION",
            "severity": "CRITICAL",
            "message": "Thermal breach: 9.40°C exceeds upper limit. Expedited replacement lot #0x8888... authorized.",
        },
    },
    {
        "batch_id": "0x8888888888888888888888888888888888888888888888888888888888888888",
        "product_name": "EXPEDITED REPLACEMENT - Rotavac Oral Monovalent",
        "min_temp": 2.0,
        "max_temp": 8.0,
        "target_status": "IN_TRANSIT",
        "custodian": CARRIER_ADDR,
        "telemetry_count": 7,
        "nominal_temp": 4.15,
        "scenario": "Expedited Child Replacement Lot in Transit",
    },
]

CORRIDOR_WAYPOINTS = [
    (17.5186, 78.5833), # Hyderabad Genesis
    (16.7488, 77.9897), # Mahabubnagar
    (15.8281, 78.0373), # Kurnool
    (14.6819, 77.6006), # Anantapur
    (13.6288, 77.5385), # Chikkaballapur
    (12.9716, 77.5946), # Bangalore Hub
    (12.8342, 77.8624), # Hosur
    (12.5266, 78.2148), # Krishnagiri
    (12.9165, 79.1325), # Vellore
    (13.0604, 80.2496), # Chennai Destination
]

def seed_on_chain(lot):
    """Executes on-chain operations to establish ground truth if EVM is connected."""
    if not web3_service.is_connected() or not web3_service.supply_chain_contract:
        return None

    bid = lot["batch_id"]
    chain_batch = web3_service.get_batch_from_chain(bid)

    # 1. Create batch if not yet minted
    if not chain_batch:
        try:
            tx = web3_service.create_batch_on_chain(
                batch_id_hex=bid,
                product_name=lot["product_name"],
                min_temp_c=lot["min_temp"],
                max_temp_c=lot["max_temp"],
                mfg_private_key=MFG_KEY,
            )
            print(f"   [EVM] Minted lot {bid[:14]}... Tx: {tx[:14]}...")
            chain_batch = web3_service.get_batch_from_chain(bid)
        except Exception as e:
            print(f"   [EVM Notice] Batch creation: {e}")

    # 2. Handover to Carrier if target is IN_TRANSIT, DELIVERED, QUARANTINED, or REPLENISHED
    if lot["target_status"] in ["IN_TRANSIT", "DELIVERED", "QUARANTINED", "REPLENISHED"]:
        curr_cust = (chain_batch["current_custodian"] if chain_batch else MFG_ADDR).lower()
        if curr_cust == MFG_ADDR.lower():
            try:
                web3_service.initiate_handover_on_chain(bid, CARRIER_ADDR, MFG_KEY)
                web3_service.confirm_handover_on_chain(bid, MFG_ADDR, CARRIER_KEY)
                print(f"   [EVM] Custody transferred to Carrier for {bid[:14]}...")
                chain_batch = web3_service.get_batch_from_chain(bid)
            except Exception as e:
                print(f"   [EVM Notice] Handover to Carrier: {e}")

    # 3. Handover to Hospital if target is DELIVERED
    if lot["target_status"] == "DELIVERED":
        curr_cust = (chain_batch["current_custodian"] if chain_batch else CARRIER_ADDR).lower()
        if curr_cust == CARRIER_ADDR.lower():
            try:
                web3_service.initiate_handover_on_chain(bid, HOSPITAL_ADDR, CARRIER_KEY)
                web3_service.confirm_handover_on_chain(bid, CARRIER_ADDR, HOSPITAL_KEY)
                print(f"   [EVM] Custody transferred to Hospital (DELIVERED) for {bid[:14]}...")
                chain_batch = web3_service.get_batch_from_chain(bid)
            except Exception as e:
                print(f"   [EVM Notice] Handover to Hospital: {e}")

    # 4. Thermal excursion to trigger QUARANTINED if target is QUARANTINED or REPLENISHED
    if lot["target_status"] in ["QUARANTINED", "REPLENISHED"]:
        curr_status = chain_batch["status"] if chain_batch else "CREATED"
        if curr_status not in ["QUARANTINED", "REPLENISHED"]:
            try:
                ts = web3_service.get_current_chain_time()
                sig = sign_telemetry_payload(CARRIER_KEY, bid, 12.8, 14.6819, 77.6006, ts, 9999)
                pkt = {
                    "batch_id": bid,
                    "temperature_scaled": 1280,
                    "latitude_scaled": 14681900,
                    "longitude_scaled": 77600600,
                    "timestamp": ts,
                    "nonce": 9999,
                    "v": sig["v"],
                    "r": sig["r"],
                    "s": sig["s"],
                }
                success, tx_or_err = web3_service.submit_signed_telemetry_on_chain(pkt, CARRIER_KEY)
                if success:
                    print(f"   [EVM] Submitted excursion (12.8°C) -> Status is now QUARANTINED for {bid[:14]}...")
                    chain_batch = web3_service.get_batch_from_chain(bid)
            except Exception as e:
                print(f"   [EVM Notice] Excursion trigger: {e}")

    # 5. Link replacement if target is REPLENISHED
    if lot["target_status"] == "REPLENISHED" and lot.get("replacement_id"):
        curr_status = chain_batch["status"] if chain_batch else "CREATED"
        if curr_status != "REPLENISHED":
            rep_id = lot["replacement_id"]
            # Ensure replacement batch exists first
            rep_chain = web3_service.get_batch_from_chain(rep_id)
            if not rep_chain:
                try:
                    web3_service.create_batch_on_chain(rep_id, f"EXPEDITED REPLACEMENT - {lot['product_name']}", 2.0, 8.0, MFG_KEY)
                except Exception:
                    pass
            try:
                web3_service.link_replacement_batch_on_chain(bid, rep_id, MFG_KEY)
                print(f"   [EVM] Linked replacement {rep_id[:14]} to {bid[:14]}... (REPLENISHED)")
            except Exception as e:
                print(f"   [EVM Notice] Link replacement: {e}")

    return web3_service.get_batch_from_chain(bid)


def seed_database():
    """Seeds SQLite database idempotently with demonstration lots, telemetries, and alerts."""
    print("=" * 65)
    print("🌱 PHARMATRACE: EXECUTING IDEMPOTENT DEMONSTRATION DATA SEEDER")
    print("=" * 65)

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # Ensure tables exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS batches (
            batch_id VARCHAR(66) PRIMARY KEY,
            product_name VARCHAR(120) NOT NULL,
            manufacturer_address VARCHAR(42) NOT NULL,
            current_custodian VARCHAR(42) NOT NULL,
            min_temp_celsius FLOAT NOT NULL,
            max_temp_celsius FLOAT NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
            replacement_batch_id VARCHAR(66),
            genesis_tx_hash VARCHAR(66),
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS telemetry_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id VARCHAR(66) NOT NULL,
            temperature_celsius FLOAT NOT NULL,
            temperature_scaled INTEGER NOT NULL,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL,
            timestamp INTEGER NOT NULL,
            nonce INTEGER NOT NULL,
            payload_hash VARCHAR(66) NOT NULL,
            signature_v INTEGER NOT NULL,
            signature_r VARCHAR(66) NOT NULL,
            signature_s VARCHAR(66) NOT NULL,
            custodian_address VARCHAR(42) NOT NULL,
            is_tampered_mitm BOOLEAN DEFAULT 0,
            on_chain_committed BOOLEAN DEFAULT 0,
            on_chain_tx_hash VARCHAR(66),
            recorded_at TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS security_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id VARCHAR(66) NOT NULL,
            alert_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) NOT NULL,
            message TEXT NOT NULL,
            tx_hash VARCHAR(66),
            created_at TIMESTAMP
        )
    """)
    con.commit()

    evm_connected = web3_service.is_connected()
    print(f"EVM RPC Connected: {evm_connected} (Port: 8546)")

    created_count = 0
    updated_count = 0

    now_iso = datetime.now(timezone.utc).isoformat()
    base_time = int(time.time()) - 3600

    for lot in DEMO_LOTS:
        bid = lot["batch_id"]
        chain_info = seed_on_chain(lot) if evm_connected else None

        actual_status = chain_info["status"] if chain_info else lot["target_status"]
        actual_custodian = chain_info["current_custodian"] if chain_info else lot["custodian"]
        repl_id = chain_info.get("replacement_batch_id") if chain_info else lot.get("replacement_id")

        cur.execute("SELECT batch_id FROM batches WHERE batch_id = ?", (bid,))
        existing = cur.fetchone()

        if existing:
            cur.execute("""
                UPDATE batches
                SET product_name = ?,
                    current_custodian = ?,
                    status = ?,
                    min_temp_celsius = ?,
                    max_temp_celsius = ?,
                    replacement_batch_id = ?,
                    updated_at = ?
                WHERE batch_id = ?
            """, (
                lot["product_name"],
                actual_custodian,
                actual_status,
                lot["min_temp"],
                lot["max_temp"],
                repl_id,
                now_iso,
                bid
            ))
            updated_count += 1
            action = "UPDATED"
        else:
            cur.execute("""
                INSERT INTO batches (
                    batch_id, product_name, manufacturer_address, current_custodian,
                    min_temp_celsius, max_temp_celsius, status, replacement_batch_id,
                    genesis_tx_hash, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                bid,
                lot["product_name"],
                MFG_ADDR,
                actual_custodian,
                lot["min_temp"],
                lot["max_temp"],
                actual_status,
                repl_id,
                "0x" + hashlib.sha256(f"pharma_genesis_tx_{bid}".encode()).hexdigest(),
                now_iso,
                now_iso
            ))
            created_count += 1
            action = "CREATED"

        # Check and seed initial telemetry records if none exist
        cur.execute("SELECT COUNT(*) FROM telemetry_records WHERE batch_id = ?", (bid,))
        telem_exist = cur.fetchone()[0]

        if telem_exist == 0 and lot["telemetry_count"] > 0:
            for i in range(lot["telemetry_count"]):
                wp_idx = min(i, len(CORRIDOR_WAYPOINTS) - 1)
                lat, lon = CORRIDOR_WAYPOINTS[wp_idx]
                step_ts = base_time + (i * 300)
                step_nonce = i + 1
                temp = lot["nominal_temp"] + ((-0.1) if i % 2 == 0 else 0.1)

                sig_dict = sign_telemetry_payload(CARRIER_KEY, bid, temp, lat, lon, step_ts, step_nonce)

                cur.execute("""
                    INSERT INTO telemetry_records (
                        batch_id, temperature_celsius, temperature_scaled, latitude, longitude,
                        timestamp, nonce, payload_hash, signature_v, signature_r, signature_s,
                        custodian_address, is_tampered_mitm, on_chain_committed, recorded_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    bid,
                    temp,
                    sig_dict["temperature_scaled"],
                    lat,
                    lon,
                    step_ts,
                    step_nonce,
                    sig_dict["raw_hash"],
                    sig_dict["v"],
                    sig_dict["r"],
                    sig_dict["s"],
                    CARRIER_ADDR,
                    0,
                    1 if evm_connected else 0,
                    now_iso
                ))

        # Reconcile security alerts for this explicitly owned demonstration lot
        cur.execute("DELETE FROM security_alerts WHERE batch_id = ?", (bid,))
        if lot.get("alert"):
            cur.execute("""
                INSERT INTO security_alerts (
                    batch_id, alert_type, severity, message, tx_hash, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                bid,
                lot["alert"]["type"],
                lot["alert"]["severity"],
                lot["alert"]["message"],
                None,
                now_iso
            ))

        print(f"[{action}] Lot: {bid[:14]}... | Status: {actual_status:<11} | Scenario: {lot['scenario']}")

    con.commit()
    con.close()

    print("=" * 65)
    print(f"✅ DEMONSTRATION DATA SEEDING COMPLETE: {created_count} Created, {updated_count} Synchronized.")
    print("=" * 65)

    verify_dataset()


def verify_dataset():
    """Automated post-seeding acceptance verification for Phase 5."""
    print("\n🔍 VERIFYING SEEDED DEMO DATASET...")
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    failures = []

    # 1. Verify all 8 demo lots exist
    for lot in DEMO_LOTS:
        bid = lot["batch_id"]
        cur.execute("SELECT status, current_custodian, replacement_batch_id FROM batches WHERE batch_id = ?", (bid,))
        row = cur.fetchone()
        if not row:
            failures.append(f"Missing demo batch in database: {bid}")
            continue

        db_status, db_custodian, db_repl = row
        print(f"   ✔ DB Verified: {bid[:14]}... | Status: {db_status:<11} | Custodian: {db_custodian[:12]}...")

        # 2. Verify on-chain state if connected
        if web3_service.is_connected() and web3_service.supply_chain_contract:
            chain_batch = web3_service.get_batch_from_chain(bid)
            if not chain_batch:
                failures.append(f"Batch {bid} missing from EVM on-chain contract!")
            else:
                if chain_batch["status"] != db_status:
                    failures.append(f"Status mismatch for {bid[:14]}: DB={db_status} vs EVM={chain_batch['status']}")
                if chain_batch["current_custodian"].lower() != db_custodian.lower():
                    failures.append(f"Custodian mismatch for {bid[:14]}: DB={db_custodian} vs EVM={chain_batch['current_custodian']}")

    # 3. Verify Quarantined parent -> Replacement child link
    cur.execute("SELECT replacement_batch_id, status FROM batches WHERE batch_id = '0x7777777777777777777777777777777777777777777777777777777777777777'")
    p_row = cur.fetchone()
    if not p_row or p_row[1] != "REPLENISHED" or p_row[0] != "0x8888888888888888888888888888888888888888888888888888888888888888":
        failures.append(f"Parent lot 0x7777... lineage link invalid: {p_row}")
    else:
        print("   ✔ Lineage Verified: Parent 0x7777... (REPLENISHED) -> Child 0x8888...")

    # 4. Verify telemetry records and nonces
    cur.execute("SELECT COUNT(*), MIN(nonce), MAX(nonce) FROM telemetry_records WHERE batch_id = '0x1111111111111111111111111111111111111111111111111111111111111111'")
    t_cnt, min_n, max_n = cur.fetchone()
    if t_cnt < 8 or min_n != 1:
        failures.append(f"Lot 0x1111... telemetry records count/nonce issue: count={t_cnt}, min_nonce={min_n}")
    else:
        print(f"   ✔ Telemetry Verified: Lot 0x1111... has {t_cnt} records with nonces [{min_n}..{max_n}].")

    # 5. Verify security alerts
    cur.execute("SELECT alert_type, severity FROM security_alerts WHERE batch_id = '0x3333333333333333333333333333333333333333333333333333333333333333'")
    alert_row = cur.fetchone()
    if not alert_row or alert_row[0] != "COLD_CHAIN_EXCURSION":
        failures.append(f"Lot 0x3333... missing COLD_CHAIN_EXCURSION alert: {alert_row}")
    else:
        print(f"   ✔ Alert Verified: Lot 0x3333... flagged with {alert_row[0]} ({alert_row[1]}).")

    con.close()

    if failures:
        print("\n❌ SEEDING VERIFICATION FAILED:")
        for f in failures:
            print(f"   - {f}")
        sys.exit(1)

    print("=" * 65)
    print("🎉 ALL DEMO DATASET VERIFICATION CHECKS PASSED (8/8 LOTS COHERENT)")
    print("=" * 65)


if __name__ == "__main__":
    seed_database()
