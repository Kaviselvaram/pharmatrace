"""
Unit Tests for Simulation Physics, Cryptographic Signing, and Attack Models.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import pytest
from app.core.security import (
    create_canonical_payload,
    hash_canonical_payload,
    get_eip191_digest,
    sign_telemetry_payload,
    recover_telemetry_signer,
    round_half_up,
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


def test_deterministic_test_vector_cryptographic_proof():
    """Verify the permanent deterministic test vector with exact hashes and signatures."""
    signed = sign_telemetry_payload(
        private_key=TEST_PRIVKEY,
        batch_id_hex=TEST_BATCH_ID,
        temp_celsius=4.25,
        lat=12.9716,
        lon=77.5946,
        timestamp=1772798400,
        nonce=1042
    )

    assert signed["payload_bytes_length"] == 78
    assert signed["raw_hash"] == "0xf1ab697f1f9b154772c485059ab5e2ea802460192a1f6489703029d714c09dca"
    assert signed["eip191_digest"] == "0xc9c705c42dffe727421ebddbd53e4e1ec3dacf06a7c7e60ccd827e8c0e4a5382"
    assert signed["v"] == 28
    assert signed["r"] == "0x92c2a3931a6e790488e69f50925902c639ed2c857457bf64a57ae707f4564113"
    assert signed["s"] == "0x2c0d325a3bea82ea76521681e983379434b321f7600f5dd51348b35dfeb7c828"

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


def test_deterministic_rounding_semantics():
    """Verify deterministic symmetric round-half-up (away from zero)."""
    assert round_half_up(4.25, 100) == 425
    assert round_half_up(4.255, 100) == 426
    assert round_half_up(-1.25, 100) == -125
    assert round_half_up(-1.255, 100) == -126
    assert round_half_up(0.0, 100) == 0
    assert round_half_up(327.67, 100) == 32767
    assert round_half_up(-327.68, 100) == -32768


def test_numeric_bounds_validation():
    """Verify that inputs outside valid ranges are rejected with clear ValueErrors."""
    # Temperature out of int16 bounds
    with pytest.raises(ValueError, match="out of int16 bounds"):
        create_canonical_payload(TEST_BATCH_ID, 327.68, 12.97, 77.59, 1772798400, 1)

    with pytest.raises(ValueError, match="out of int16 bounds"):
        create_canonical_payload(TEST_BATCH_ID, -327.69, 12.97, 77.59, 1772798400, 1)

    # Latitude out of bounds
    with pytest.raises(ValueError, match="Latitude"):
        create_canonical_payload(TEST_BATCH_ID, 4.25, 90.01, 77.59, 1772798400, 1)

    with pytest.raises(ValueError, match="Latitude"):
        create_canonical_payload(TEST_BATCH_ID, 4.25, -90.01, 77.59, 1772798400, 1)

    # Longitude out of bounds
    with pytest.raises(ValueError, match="Longitude"):
        create_canonical_payload(TEST_BATCH_ID, 4.25, 12.97, 180.01, 1772798400, 1)

    with pytest.raises(ValueError, match="Longitude"):
        create_canonical_payload(TEST_BATCH_ID, 4.25, 12.97, -180.01, 1772798400, 1)

    # Timestamp out of uint32 bounds
    with pytest.raises(ValueError, match="Timestamp"):
        create_canonical_payload(TEST_BATCH_ID, 4.25, 12.97, 77.59, -1, 1)

    # Nonce non-positive
    with pytest.raises(ValueError, match="Nonce"):
        create_canonical_payload(TEST_BATCH_ID, 4.25, 12.97, 77.59, 1772798400, 0)


def test_adversarial_mitm_field_tampering_all_fields():
    """Verify that tampering with ANY single field invalidates the recovered signer address."""
    signed = sign_telemetry_payload(
        private_key=TEST_PRIVKEY,
        batch_id_hex=TEST_BATCH_ID,
        temp_celsius=4.25,
        lat=12.9716,
        lon=77.5946,
        timestamp=1772798400,
        nonce=1042
    )

    # 1. Tamper Temperature
    rec = recover_telemetry_signer(
        TEST_BATCH_ID, 4.26, 12.9716, 77.5946, 1772798400, 1042,
        signed["v"], signed["r"], signed["s"]
    )
    assert rec.lower() != EXPECTED_ADDRESS.lower()

    # 2. Tamper Latitude
    rec = recover_telemetry_signer(
        TEST_BATCH_ID, 4.25, 12.9717, 77.5946, 1772798400, 1042,
        signed["v"], signed["r"], signed["s"]
    )
    assert rec.lower() != EXPECTED_ADDRESS.lower()

    # 3. Tamper Longitude
    rec = recover_telemetry_signer(
        TEST_BATCH_ID, 4.25, 12.9716, 77.5947, 1772798400, 1042,
        signed["v"], signed["r"], signed["s"]
    )
    assert rec.lower() != EXPECTED_ADDRESS.lower()

    # 4. Tamper Timestamp
    rec = recover_telemetry_signer(
        TEST_BATCH_ID, 4.25, 12.9716, 77.5946, 1772798401, 1042,
        signed["v"], signed["r"], signed["s"]
    )
    assert rec.lower() != EXPECTED_ADDRESS.lower()

    # 5. Tamper Nonce
    rec = recover_telemetry_signer(
        TEST_BATCH_ID, 4.25, 12.9716, 77.5946, 1772798400, 1043,
        signed["v"], signed["r"], signed["s"]
    )
    assert rec.lower() != EXPECTED_ADDRESS.lower()

    # 6. Tamper BatchId
    other_batch = "0x5b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c"
    rec = recover_telemetry_signer(
        other_batch, 4.25, 12.9716, 77.5946, 1772798400, 1042,
        signed["v"], signed["r"], signed["s"]
    )
    assert rec.lower() != EXPECTED_ADDRESS.lower()


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

    simulator.inject_attack(AttackType.MITM_ALTERATION, tamper_delta=-7.5)
    packet = simulator.step(delta_t=1.0, current_time=1772798400)

    assert packet["is_tampered_mitm"] is True
    recovered = recover_telemetry_signer(
        batch_id_hex=packet["batch_id"],
        temp_celsius=packet["temperature_celsius"],
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

    assert lat_start > 17.0
    assert lat_end < 14.0
    assert "BioVax" in label_start
    assert "Apollo" in label_end
