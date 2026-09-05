"""
Virtualized Telemetry Node Emulator.
Simulates edge IoT firmware generating cryptographically signed environmental telemetry.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

from typing import Dict, Any, Optional
from eth_account import Account
from app.core.security import sign_telemetry_payload


class VirtualizedNode:
    """
    Emulates an edge IoT telematics device running inside a refrigerated vehicle
    or warehouse facility. Each node maintains its own ECDSA secp256k1 private key
    and an auto-incrementing monotonic nonce.
    """

    def __init__(
        self,
        node_id: str,
        organization_name: str,
        role: str,
        private_key: Optional[str] = None
    ):
        self.node_id = node_id
        self.organization_name = organization_name
        self.role = role

        if private_key:
            self._account = Account.from_key(private_key)
        else:
            self._account = Account.create()

        self.ethereum_address = self._account.address
        self.private_key = self._account.key.hex()
        self.current_nonce = 0

    def get_next_nonce(self) -> int:
        """Returns next monotonic nonce to protect against replay attacks."""
        self.current_nonce += 1
        return self.current_nonce

    def sign_reading(
        self,
        batch_id_hex: str,
        temperature_celsius: float,
        latitude: float,
        longitude: float,
        timestamp: int,
        forced_nonce: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Signs a telemetry reading using the node's private key.
        forced_nonce can be used to simulate replay attacks.
        """
        nonce = forced_nonce if forced_nonce is not None else self.get_next_nonce()

        signed_packet = sign_telemetry_payload(
            private_key=self.private_key,
            batch_id_hex=batch_id_hex,
            temp_celsius=temperature_celsius,
            lat=latitude,
            lon=longitude,
            timestamp=timestamp,
            nonce=nonce
        )

        signed_packet["node_id"] = self.node_id
        signed_packet["organization_name"] = self.organization_name
        signed_packet["custodian_address"] = self.ethereum_address
        signed_packet["role"] = self.role

        return signed_packet
