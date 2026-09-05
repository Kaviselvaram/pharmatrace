# Cryptographic Specification & Canonical Encoding
**Native ECDSA secp256k1, Keccak-256 & Mathematical Determinism**

---

## 1. CANONICAL MESSAGE SPECIFICATION

To guarantee zero hash discrepancy between Python (`web3.py` / `eth_account`) and Solidity (`abi.encodePacked`), all telemetry packets adhere to this exact binary structure:

### 1.1 Field Ordering & Precise Types
| Order | Field Name | Data Type | Scaling Factor | Example Value | Encoded Bytes (Hex) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `batchId` | `bytes32` | None | `0x4a9b...f1` | 32 bytes |
| **2** | `temperature` | `int16` | $\times 100$ | $4.25^\circ\text{C} \rightarrow 425$ | 2 bytes (Big Endian) |
| **3** | `latitude` | `int32` | $\times 10^6$ | $12.971600 \rightarrow 12971600$ | 4 bytes (Big Endian) |
| **4** | `longitude` | `int32` | $\times 10^6$ | $77.594600 \rightarrow 77594600$ | 4 bytes (Big Endian) |
| **5** | `timestamp` | `uint32` | None | $1772798400$ | 4 bytes (Big Endian) |
| **6** | `nonce` | `uint256` | None | $1042$ | 32 bytes (Big Endian) |

Total canonical byte length: $32 + 2 + 4 + 4 + 4 + 32 = 78\text{ bytes}$.

---

## 2. PYTHON CANONICAL IMPLEMENTATION (`backend/app/core/security.py`)

```python
from eth_account.messages import encode_defunct
from eth_account import Account
from eth_utils import keccak

def create_canonical_payload(batch_id_hex: str, temp_celsius: float, lat: float, lon: float, timestamp: int, nonce: int) -> bytes:
    # 1. Clean hex string
    clean_batch_id = bytes.fromhex(batch_id_hex.replace("0x", ""))
    if len(clean_batch_id) != 32:
        raise ValueError("batch_id must be exactly 32 bytes")

    # 2. Scale fixed-point numbers
    temp_scaled = int(round(temp_celsius * 100))
    lat_scaled = int(round(lat * 1000000))
    lon_scaled = int(round(lon * 1000000))

    # 3. Pack in strict big-endian binary format
    payload = (
        clean_batch_id +
        temp_scaled.to_bytes(2, byteorder="big", signed=True) +
        lat_scaled.to_bytes(4, byteorder="big", signed=True) +
        lon_scaled.to_bytes(4, byteorder="big", signed=True) +
        int(timestamp).to_bytes(4, byteorder="big", signed=False) +
        int(nonce).to_bytes(32, byteorder="big", signed=False)
    )
    return payload

def sign_telemetry(private_key: str, batch_id_hex: str, temp: float, lat: float, lon: float, timestamp: int, nonce: int):
    payload_bytes = create_canonical_payload(batch_id_hex, temp, lat, lon, timestamp, nonce)
    message_hash = keccak(payload_bytes)
    
    # EIP-191 personal sign format
    signable_message = encode_defunct(message_hash)
    signed_data = Account.sign_message(signable_message, private_key=private_key)
    
    return {
        "message_hash": "0x" + message_hash.hex(),
        "v": signed_data.v,
        "r": "0x" + signed_data.r.to_bytes(32, byteorder="big").hex(),
        "s": "0x" + signed_data.s.to_bytes(32, byteorder="big").hex()
    }
```

---

## 3. SOLIDITY ON-CHAIN RECONSTRUCTION (`PharmaSupplyChain.sol`)

```solidity
function verifyTelemetrySignature(
    bytes32 batchId,
    int16 temperatureScaled,
    int32 latitudeScaled,
    int32 longitudeScaled,
    uint32 timestamp,
    uint256 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
) public pure returns (address recoveredSigner, bytes32 messageHash) {
    // 1. Pack exact 78 bytes in identical sequence
    bytes memory payload = abi.encodePacked(
        batchId,
        temperatureScaled,
        latitudeScaled,
        longitudeScaled,
        timestamp,
        nonce
    );

    messageHash = keccak256(payload);

    // 2. Reconstruct EIP-191 eth_sign prefix
    bytes32 ethSignedHash = keccak256(
        abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
    );

    // 3. Native EVM ecrecover execution
    recoveredSigner = ecrecover(ethSignedHash, v, r, s);
    require(recoveredSigner != address(0), "ECDSA: invalid signature");
}
```

---

## 4. SECURITY & REPLAY MITIGATION
1. **Monotonic Nonces**: Each batch tracks an integer counter mapped to the custodian:
   `mapping(bytes32 => mapping(address => uint256)) public lastNonce;`
   Any incoming `nonce <= lastNonce` will revert immediately.
2. **Clock Drift Envelope**: Timestamps must fall within $[-300\text{s}, +60\text{s}]$ of current `block.timestamp`.
3. **Malleability Protection**: Signatures must satisfy standard Ethereum $s$-value limits ($s \le \text{secp256k1n} / 2$) to prevent signature malleability attacks.
