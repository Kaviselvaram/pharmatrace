"""
Unit Tests for Simulation Physics, Cryptographic Signing, and Attack Models.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import pytest
from app.core.security import (
    create_canonical_payload,
    hash_canonical_payload,
    sign_telemetry_payload,
    recover_telemetry_signer,
)
from app.engine.telemetry_node import VirtualizedNode
from app.engine.simulator import TransitSimulator, AttackType
from app.engine.routes import interpolate_route_position


TEST_BATCH_ID = "0x4a9b6c8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b"
TEST_PRIVKEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
EXPECTED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"


def test_canonical_byte_length_and_packing():
    """Verify that canonical payload has exact 78 bytes with expected field alignments."""
    payload = create_canonical_payload(
        batch_id_hex=TEST_BATCH_ID,
        temp_celsius=4.25,
        lat=12.9716,
        lon=77.5946,
        timestamp=1772798400,
        nonce=1042
    )
    assert len(payload) == 78
    raw_hash = hash_canonical_payload(payload)
    assert raw_hash.hex() == "f1ab697f1f9b154772c485059ab5e2ea802460192a1f6489703029d714c09dca"


def test_cryptographic_signature_and_recovery():
    """Verify that signing canonical payload with TEST_PRIVKEY recovers exact expected Ethereum address."""
    signed = sign_telemetry_payload(
        private_key=TEST_PRIVKEY,
        batch_id_hex=TEST_BATCH_ID,
        temp_celsius=4.25,
        lat=12.9716,
        lon=77.5946,
        timestamp=1772798400,
        nonce=1042
    )

    assert signed["v"] in [27, 28]
    assert signed["payload_bytes_length"] == 78

    recovered = recover_telemetry_signer(
        batch_id_hex=TEST_BATCH_ID,
        temp_celsius=4.25,
        lat=12.9716,
        lon=77.5946,
        timestamp=1772798400,
        nonce=1042,
        v=signed["v"],
        r_hex=signed["r"],
        s_hex=signed["s"]
    )
    assert recovered.lower() == EXPECTED_ADDRESS.lower()


def test_virtualized_node_monotonic_nonces():
    """Verify that node automatically increments nonces sequentially."""
    node = VirtualizedNode("NODE-01", "ColdLogix Fleet", "CARRIER", private_key=TEST_PRIVKEY)
    assert node.ethereum_address.lower() == EXPECTED_ADDRESS.lower()

    reading1 = node.sign_reading(TEST_BATCH_ID, 4.5, 12.97, 77.59, 1772798400)
    reading2 = node.sign_reading(TEST_BATCH_ID, 4.6, 12.98, 77.60, 1772798403)

    assert reading1["nonce"] == 1
    assert reading2["nonce"] == 2


def test_nominal_simulation_thermal_stability():
    """Verify that simulated temperature remains within safe cold-chain bounds (2°C - 8°C) under nominal operation."""
    node = VirtualizedNode("NODE-01", "ColdLogix Fleet", "CARRIER", private_key=TEST_PRIVKEY)
    simulator = TransitSimulator(
        batch_id_hex=TEST_BATCH_ID,
        node=node,
        initial_temp=4.5,
        seed=42,
        total_steps=30
    )

    temps = []
    for _ in range(30):
        packet = simulator.step(delta_t=1.0, current_time=1772798400)
        temps.append(packet["temperature_celsius"])

    # All temperatures must remain strictly in 2°C to 8°C
    for t in temps:
        assert 2.0 <= t <= 8.0, f"Temperature {t} deviated outside 2-8°C envelope!"


def test_compressor_failure_excursion():
    """Verify that injecting compressor failure causes temperature to rise and breach 8.0°C ceiling."""
    node = VirtualizedNode("NODE-01", "ColdLogix Fleet", "CARRIER", private_key=TEST_PRIVKEY)
    simulator = TransitSimulator(
        batch_id_hex=TEST_BATCH_ID,
        node=node,
        initial_temp=4.5,
        ambient_temp=35.0,
        insulation_k=0.04,
        seed=42,
        total_steps=40
    )

    simulator.inject_attack(AttackType.COMPRESSOR_FAILURE)

    breached = False
    for _ in range(40):
        packet = simulator.step(delta_t=2.0, current_time=1772798400)
        if packet["temperature_celsius"] > 8.0:
            breached = True
            break

    assert breached, "Expected temperature to breach 8.0°C after refrigeration compressor failure!"


def test_mitm_tamper_detection_in_simulation():
    """Verify that MITM attack invalidates signature recovery when payload temperature is altered."""
    node = VirtualizedNode("NODE-01", "ColdLogix Fleet", "CARRIER", private_key=TEST_PRIVKEY)
    simulator = TransitSimulator(
        batch_id_hex=TEST_BATCH_ID,
        node=node,
        initial_temp=12.0,
        seed=42,
        total_steps=10
    )

    simulator.inject_attack(AttackType.MITM_ALTERATION, tamper_delta=-7.5) # Falsifies 12°C down to 4.5°C
    packet = simulator.step(delta_t=1.0, current_time=1772798400)

    assert packet["is_tampered_mitm"] is True
    # Attempting to recover signature from the tampered temperature must produce an invalid address
    recovered = recover_telemetry_signer(
        batch_id_hex=packet["batch_id"],
        temp_celsius=packet["temperature_celsius"], # Tampered!
        lat=packet["latitude"],
        lon=packet["longitude"],
        timestamp=packet["timestamp"],
        nonce=packet["nonce"],
        v=packet["v"],
        r_hex=packet["r"],
        s_hex=packet["s"]
    )

    assert recovered.lower() != EXPECTED_ADDRESS.lower(), "MITM tampered reading should NOT match genuine custodian!"


def test_replay_attack_in_simulation():
    """Verify that replay attack mode re-submits previously consumed nonce."""
    node = VirtualizedNode("NODE-01", "ColdLogix Fleet", "CARRIER", private_key=TEST_PRIVKEY)
    simulator = TransitSimulator(
        batch_id_hex=TEST_BATCH_ID,
        node=node,
        initial_temp=4.5,
        seed=42,
        total_steps=10
    )

    packet1 = simulator.step(delta_t=1.0, current_time=1772798400)
    simulator.inject_attack(AttackType.REPLAY_ATTACK)
    packet2 = simulator.step(delta_t=1.0, current_time=1772798402)

    assert packet1["nonce"] == packet2["nonce"], "Expected replay attack to resubmit identical nonce!"


def test_route_interpolation():
    """Verify route waypoint interpolation spans between start and destination."""
    lat_start, lon_start, label_start = interpolate_route_position(0.0)
    lat_end, lon_end, label_end = interpolate_route_position(1.0)

    assert lat_start > 17.0 # Hyderabad latitude
    assert lat_end < 14.0 # Chennai latitude
    assert "BioVax" in label_start
    assert "Apollo" in label_end
