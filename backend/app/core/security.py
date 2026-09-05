"""
Security and Cryptographic Primitives for Telemetry Signing and Verification.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

from typing import Dict, Any, Tuple
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import keccak


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

    Byte layout:
      - batchId:     32 bytes (bytes32)
      - temperature: 2 bytes  (int16, scaled x100)
      - latitude:    4 bytes  (int32, scaled x1,000,000)
      - longitude:   4 bytes  (int32, scaled x1,000,000)
      - timestamp:   4 bytes  (uint32, Unix epoch seconds)
      - nonce:       32 bytes (uint256, monotonic counter)
      Total:         78 bytes
    """
    clean_batch_id = bytes.fromhex(batch_id_hex.replace("0x", ""))
    if len(clean_batch_id) != 32:
        raise ValueError(f"batch_id must be exactly 32 bytes, got {len(clean_batch_id)}")

    temp_scaled = int(round(temp_celsius * 100))
    lat_scaled = int(round(lat * 1000000))
    lon_scaled = int(round(lon * 1000000))

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

    # EIP-191 "\x19Ethereum Signed Message:\n32" wrapper
    signable_message = encode_defunct(raw_hash)
    signed_data = Account.sign_message(signable_message, private_key=private_key)

    return {
        "batch_id": batch_id_hex,
        "temperature_celsius": temp_celsius,
        "temperature_scaled": int(round(temp_celsius * 100)),
        "latitude": lat,
        "latitude_scaled": int(round(lat * 1000000)),
        "longitude": lon,
        "longitude_scaled": int(round(lon * 1000000)),
        "timestamp": timestamp,
        "nonce": nonce,
        "payload_bytes_hex": "0x" + payload_bytes.hex(),
        "payload_bytes_length": len(payload_bytes),
        "raw_hash": "0x" + raw_hash.hex(),
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
