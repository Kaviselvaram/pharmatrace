"""
Simulation Engine Controls & Chaos Attack Laboratory Endpoints.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import asyncio
import os
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.domain.models import BatchModel, TelemetryModel, SecurityAlertModel
from app.domain.schemas import AttackInjectionRequest
from app.engine.simulator import TransitSimulator, AttackType
from app.engine.telemetry_node import VirtualizedNode
from app.services.web3_service import web3_service
from app.api.websocket import ws_manager

router = APIRouter(prefix="/simulation", tags=["Simulation & Chaos Studio"])

# Active simulation sessions: batch_id -> {"simulator": TransitSimulator, "running": bool, "task": Task}
active_simulations: Dict[str, Any] = {}

# Demo Carrier Account #2
CARRIER_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"


async def simulation_loop(batch_id: str):
    """
    Background loop running every 2.5 seconds:
    Advances physics step -> signs reading -> saves to SQLite -> commits on-chain -> broadcasts to WebSocket.
    """
    sim_data = active_simulations.get(batch_id)
    if not sim_data:
        return

    simulator: TransitSimulator = sim_data["simulator"]
    print(f"[SIMULATOR] Starting background telemetry loop for batch: {batch_id}")

    while sim_data.get("running", False):
        try:
            # 1. Advance simulation step
            current_time = web3_service.get_current_chain_time() if web3_service.is_connected() else int(time.time())
            packet = simulator.step(delta_t=2.0, current_time=current_time)

            on_chain_success = False
            tx_hash = None
            error_msg = None

            # 2. Submit to on-chain smart contract
            if web3_service.is_connected() and web3_service.supply_chain_contract:
                success, result = web3_service.submit_signed_telemetry_on_chain(
                    packet=packet,
                    caller_private_key=CARRIER_KEY
                )
                on_chain_success = success
                if success:
                    tx_hash = result
                else:
                    error_msg = result

            # 3. Cache telemetry in off-chain database
            async with AsyncSessionLocal() as session:
                record = TelemetryModel(
                    batch_id=batch_id,
                    temperature_celsius=packet["temperature_celsius"],
                    temperature_scaled=packet["temperature_scaled"],
                    latitude=packet["latitude"],
                    longitude=packet["longitude"],
                    timestamp=packet["timestamp"],
                    nonce=packet["nonce"],
                    payload_hash=packet["raw_hash"],
                    signature_v=packet["v"],
                    signature_r=packet["r"],
                    signature_s=packet["s"],
                    custodian_address=packet["custodian_address"],
                    is_tampered_mitm=packet["is_tampered_mitm"],
                    on_chain_committed=on_chain_success,
                    on_chain_tx_hash=tx_hash
                )
                session.add(record)

                # Check if this was a thermal breach or security event
                if not on_chain_success and "INVALID_SIGNATURE" in str(error_msg):
                    alert = SecurityAlertModel(
                        batch_id=batch_id,
                        alert_type="MITM_TAMPER_ATTACK",
                        severity="CRITICAL",
                        message=f"Cryptographic Signature Mismatch: Sensor claimed {packet.get('raw_sensor_temperature')}°C, payload altered to {packet['temperature_celsius']}°C"
                    )
                    session.add(alert)
                    await ws_manager.broadcast({
                        "type": "MITM_TAMPER_ATTACK",
                        "data": {
                            "batch_id": batch_id,
                            "error": str(error_msg)
                        }
                    })
                elif not on_chain_success and "REPLAY_ATTACK_DETECTED" in str(error_msg):
                    alert = SecurityAlertModel(
                        batch_id=batch_id,
                        alert_type="REPLAY_ATTACK",
                        severity="HIGH",
                        message=f"Monotonic Replay Attack Detected: Nonce {packet.get('nonce')} already consumed on-chain."
                    )
                    session.add(alert)
                elif packet["temperature_celsius"] > 8.0 or packet["temperature_celsius"] < 2.0:
                    alert = SecurityAlertModel(
                        batch_id=batch_id,
                        alert_type="COLD_CHAIN_EXCURSION",
                        severity="HIGH",
                        message=f"Temperature excursion detected: {packet['temperature_celsius']}°C outside 2.0°C - 8.0°C threshold. Batch quarantined on-chain.",
                        tx_hash=tx_hash
                    )
                    session.add(alert)
                    batch_record = await session.get(BatchModel, batch_id)
                    if batch_record:
                        batch_record.status = "QUARANTINED"
                    await ws_manager.broadcast({
                        "type": "COLD_CHAIN_EXCURSION",
                        "data": {
                            "batch_id": batch_id,
                            "status": "QUARANTINED",
                            "temperature": packet["temperature_celsius"],
                            "tx_hash": tx_hash
                        }
                    })

                await session.commit()

            # 4. Broadcast live frame over WebSockets
            ws_packet = {
                "type": "TELEMETRY_STREAM",
                "data": {
                    "batch_id": batch_id,
                    "temperature_celsius": packet["temperature_celsius"],
                    "latitude": packet["latitude"],
                    "longitude": packet["longitude"],
                    "timestamp": packet["timestamp"],
                    "nonce": packet["nonce"],
                    "signature_r": packet["r"],
                    "signature_s": packet["s"],
                    "signature_v": packet["v"],
                    "raw_hash": packet["raw_hash"],
                    "step": packet["step"],
                    "progress": packet["progress"],
                    "waypoint_label": packet["waypoint_label"],
                    "compressor_active": packet["compressor_active"],
                    "attack_mode": packet["attack_mode"],
                    "is_tampered_mitm": packet["is_tampered_mitm"],
                    "raw_sensor_temperature": packet.get("raw_sensor_temperature"),
                    "on_chain_committed": on_chain_success,
                    "tx_hash": tx_hash,
                    "error": error_msg
                }
            }
            await ws_manager.broadcast(ws_packet)

        except Exception as e:
            print(f"[SIMULATOR ERROR] Error in simulation loop: {e}")

        await asyncio.sleep(2.5)


@router.post("/start")
async def start_simulation(batch_id: str):
    """Starts or resumes virtual vehicle telemetry generation for a batch."""
    if batch_id in active_simulations and active_simulations[batch_id].get("running", False):
        return {"status": "ALREADY_RUNNING", "batch_id": batch_id}

    carrier_node = VirtualizedNode(
        node_id="VEHICLE-COLDLOGIX-04",
        organization_name="ColdLogix Transport Fleet",
        role="CARRIER",
        private_key=CARRIER_KEY
    )

    simulator = TransitSimulator(
        batch_id_hex=batch_id,
        node=carrier_node,
        initial_temp=4.5,
        seed=42,
        total_steps=50
    )

    sim_session = {
        "simulator": simulator,
        "running": True,
        "task": asyncio.create_task(simulation_loop(batch_id))
    }
    active_simulations[batch_id] = sim_session

    return {"status": "STARTED", "batch_id": batch_id, "node": carrier_node.ethereum_address}


@router.post("/pause")
async def pause_simulation(batch_id: str):
    """Pauses an active simulation for a batch."""
    if batch_id not in active_simulations or not active_simulations[batch_id].get("running", False):
        return {"status": "NOT_RUNNING", "batch_id": batch_id}

    active_simulations[batch_id]["running"] = False
    return {"status": "PAUSED", "batch_id": batch_id}


ATTACK_ALIAS_MAP = {
    "MITM_ALTERATION": AttackType.MITM_ALTERATION,
    "MITM_TAMPER": AttackType.MITM_ALTERATION,
    "COMPRESSOR_FAILURE": AttackType.COMPRESSOR_FAILURE,
    "HEAT_BREACH": AttackType.COMPRESSOR_FAILURE,
    "FREEZING_EVENT": AttackType.FREEZING_EVENT,
    "FREEZE_BREACH": AttackType.FREEZING_EVENT,
    "REPLAY_ATTACK": AttackType.REPLAY_ATTACK,
    "GEOFENCE_DEVIATION": AttackType.GEOFENCE_DEVIATION,
    "NONE": AttackType.NONE,
}


@router.post("/attack")
async def inject_attack(payload: AttackInjectionRequest):
    """Injects a physical failure or security attack into the simulation session."""
    sim_data = active_simulations.get(payload.batch_id)
    if not sim_data:
        raise HTTPException(status_code=404, detail="No active simulation found for this batch. Start simulation first.")

    simulator: TransitSimulator = sim_data["simulator"]

    attack_key = str(payload.attack_type).strip().upper()
    if attack_key in ATTACK_ALIAS_MAP:
        attack_enum = ATTACK_ALIAS_MAP[attack_key]
    else:
        try:
            attack_enum = AttackType(payload.attack_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid attack type: {payload.attack_type}")

    simulator.inject_attack(attack_enum, tamper_delta=payload.tamper_delta or -8.0)

    # Broadcast attack event to frontend
    await ws_manager.broadcast({
        "type": "CHAOS_ATTACK_TRIGGERED",
        "data": {
            "batch_id": payload.batch_id,
            "attack_type": attack_enum.value,
            "tamper_delta": payload.tamper_delta
        }
    })

    return {
        "status": "ATTACK_INJECTED",
        "batch_id": payload.batch_id,
        "attack_type": attack_enum.value
    }


@router.post("/reset-attacks")
async def reset_attacks(batch_id: str):
    """Resets simulator to nominal operation."""
    sim_data = active_simulations.get(batch_id)
    if not sim_data:
        raise HTTPException(status_code=404, detail="No simulation found for this batch")

    simulator: TransitSimulator = sim_data["simulator"]
    simulator.reset_attacks()

    await ws_manager.broadcast({
        "type": "CHAOS_ATTACK_RESET",
        "data": {"batch_id": batch_id}
    })

    return {"status": "RESET", "batch_id": batch_id}
