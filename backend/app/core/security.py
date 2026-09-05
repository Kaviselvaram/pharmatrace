"""
Security and Cryptographic Primitives for Telemetry Signing and Verification.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

from typing import Dict, Any, Tuple
from decimal import Decimal, ROUND_HALF_UP
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import keccak

# Strict Numeric Range Constants
INT16_MIN = -32768
INT16_MAX = 32767
INT32_MIN = -2147483648
INT32_MAX = 2147483647
UINT32_MAX = 4294967295
UINT256_MAX = (1 << 256) - 1


def round_half_up(value: float, scale: int = 100) -> int:
    """
    Deterministic symmetric round-half-up (away from zero) scaling.
    Eliminates Python's default banker's rounding ambiguity.
    Example: 4.255 * 100 = 425.5 -> 426; -1.255 * 100 = -125.5 -> -126.
    """
    d = Decimal(str(value)) * Decimal(scale)
    return int(d.to_integral_value(rounding=ROUND_HALF_UP))


def create_canonical_payload(
    batch_id_hex: str,
    temp_celsius: float,
    lat: float,
    lon: float,
    timestamp: int,
    nonce: int
) -> bytes:
    """
    Constructs the canonical 78-byte payload in strict big-endian binary format,
    matching Solidity's abi.encodePacked(bytes32, int16, int32, int32, uint32, uint256).

    Exact Byte Offsets:
      0  - 31 : batchId     (32 bytes, bytes32)
      32 - 33 : temperature ( 2 bytes, int16,  scaled x100)
      34 - 37 : latitude    ( 4 bytes, int32,  scaled x1,000,000)
      38 - 41 : longitude   ( 4 bytes, int32,  scaled x1,000,000)
      42 - 45 : timestamp   ( 4 bytes, uint32, Unix epoch seconds)
      46 - 77 : nonce       (32 bytes, uint256, monotonic counter)
      ------------------------------------------------------------
      TOTAL   : 78 bytes
    """
    clean_batch_id = bytes.fromhex(batch_id_hex.replace("0x", ""))
    if len(clean_batch_id) != 32:
        raise ValueError(f"batch_id must be exactly 32 bytes, got {len(clean_batch_id)}")

    # 1. Scale with deterministic round-half-up
    temp_scaled = round_half_up(temp_celsius, 100)
    lat_scaled = round_half_up(lat, 1000000)
    lon_scaled = round_half_up(lon, 1000000)

    # 2. Strict Range Validation
    if temp_scaled < INT16_MIN or temp_scaled > INT16_MAX:
        raise ValueError(
            f"Scaled temperature {temp_scaled} out of int16 bounds [{INT16_MIN}, {INT16_MAX}]. "
            f"Allowed range: -327.68°C to +327.67°C."
        )

    if not (-90.0 <= lat <= 90.0) or lat_scaled < INT32_MIN or lat_scaled > INT32_MAX:
        raise ValueError(f"Latitude {lat} out of valid WGS-84 bounds [-90.0, +90.0].")

    if not (-180.0 <= lon <= 180.0) or lon_scaled < INT32_MIN or lon_scaled > INT32_MAX:
        raise ValueError(f"Longitude {lon} out of valid WGS-84 bounds [-180.0, +180.0].")

    if not (0 <= timestamp <= UINT32_MAX):
        raise ValueError(f"Timestamp {timestamp} out of uint32 bounds [0, {UINT32_MAX}].")

    if not (1 <= nonce <= UINT256_MAX):
        raise ValueError(f"Nonce {nonce} must be a positive integer in [1, 2^256 - 1].")

    # 3. Canonical Big-Endian Binary Serialization
    payload = (
        clean_batch_id +
        temp_scaled.to_bytes(2, byteorder="big", signed=True) +
        lat_scaled.to_bytes(4, byteorder="big", signed=True) +
        lon_scaled.to_bytes(4, byteorder="big", signed=True) +
        int(timestamp).to_bytes(4, byteorder="big", signed=False) +
        int(nonce).to_bytes(32, byteorder="big", signed=False)
    )

    if len(payload) != 78:
        raise ValueError(f"Canonical payload must be exactly 78 bytes, got {len(payload)}")

    return payload


def hash_canonical_payload(payload_bytes: bytes) -> bytes:
    """Calculates Keccak-256 hash over canonical raw payload bytes."""
    return keccak(payload_bytes)


def get_eip191_digest(raw_hash: bytes) -> bytes:
    """Calculates EIP-191 personal_sign digest: keccak256('\x19Ethereum Signed Message:\n32' || raw_hash)."""
    prefix = b"\x19Ethereum Signed Message:\n32"
    return keccak(prefix + raw_hash)


def sign_telemetry_payload(
    private_key: str,
    batch_id_hex: str,
    temp_celsius: float,
    lat: float,
    lon: float,
    timestamp: int,
    nonce: int
) -> Dict[str, Any]:
    """
    Signs canonical telemetry payload using EIP-191 personal_sign format.
    Returns payload details, Keccak hash, and signature tuple (v, r, s).
    """
    payload_bytes = create_canonical_payload(
        batch_id_hex, temp_celsius, lat, lon, timestamp, nonce
    )
    raw_hash = hash_canonical_payload(payload_bytes)
    eip191_digest = get_eip191_digest(raw_hash)

    # EIP-191 "\x19Ethereum Signed Message:\n32" wrapper
    signable_message = encode_defunct(raw_hash)
    signed_data = Account.sign_message(signable_message, private_key=private_key)

    temp_scaled = round_half_up(temp_celsius, 100)
    lat_scaled = round_half_up(lat, 1000000)
    lon_scaled = round_half_up(lon, 1000000)

    return {
        "batch_id": batch_id_hex,
        "temperature_celsius": temp_celsius,
        "temperature_scaled": temp_scaled,
        "latitude": lat,
        "latitude_scaled": lat_scaled,
        "longitude": lon,
        "longitude_scaled": lon_scaled,
        "timestamp": timestamp,
        "nonce": nonce,
        "payload_bytes_hex": "0x" + payload_bytes.hex(),
        "payload_bytes_length": len(payload_bytes),
        "raw_hash": "0x" + raw_hash.hex(),
        "eip191_digest": "0x" + eip191_digest.hex(),
        "v": signed_data.v,
        "r": "0x" + signed_data.r.to_bytes(32, byteorder="big").hex(),
        "s": "0x" + signed_data.s.to_bytes(32, byteorder="big").hex(),
        "signature_hex": signed_data.signature.hex(),
    }


def recover_telemetry_signer(
    batch_id_hex: str,
    temp_celsius: float,
    lat: float,
    lon: float,
    timestamp: int,
    nonce: int,
    v: int,
    r_hex: str,
    s_hex: str
) -> str:
    """
    Recovers the Ethereum signer address from canonical payload parameters and (v, r, s).
    Matches Solidity's ecrecover behavior.
    """
    payload_bytes = create_canonical_payload(
        batch_id_hex, temp_celsius, lat, lon, timestamp, nonce
    )
    raw_hash = hash_canonical_payload(payload_bytes)
    signable_message = encode_defunct(raw_hash)

    r_int = int(r_hex, 16) if isinstance(r_hex, str) else r_hex
    s_int = int(s_hex, 16) if isinstance(s_hex, str) else s_hex

    recovered_address = Account.recover_message(
        signable_message,
        vrs=(v, r_int, s_int)
    )
    return recovered_address
