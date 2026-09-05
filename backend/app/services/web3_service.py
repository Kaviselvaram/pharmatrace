"""
Web3.py Client and Smart Contract RPC Bridge.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import json
import os
from typing import Dict, Any, Optional, Tuple
from web3 import Web3
from eth_account import Account
from app.core.config import settings


class Web3Service:
    """
    Manages connection to the local EVM blockchain, loads contract ABIs,
    and executes transactions and read calls against the smart contracts.
    """

    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))
        self.registry_contract = None
        self.supply_chain_contract = None
        self.deployment_metadata: Dict[str, Any] = {}
        self._load_contracts()

    def _load_contracts(self):
        """Loads deployed contract addresses and ABIs from local.json."""
        deployments_path = os.path.abspath(settings.DEPLOYMENTS_FILE)
        if not os.path.exists(deployments_path):
            # Fallback path if run from backend directory
            alt_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../contracts/deployments/local.json"))
            if os.path.exists(alt_path):
                deployments_path = alt_path

        if os.path.exists(deployments_path):
            with open(deployments_path, "r") as f:
                self.deployment_metadata = json.load(f)

            contracts_meta = self.deployment_metadata.get("contracts", {})
            registry_info = contracts_meta.get("SupplyChainRegistry", {})
            supply_chain_info = contracts_meta.get("PharmaSupplyChain", {})

            if registry_info.get("address"):
                self.registry_contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(registry_info["address"]),
                    abi=registry_info["abi"]
                )

            if supply_chain_info.get("address"):
                self.supply_chain_contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(supply_chain_info["address"]),
                    abi=supply_chain_info["abi"]
                )

    def is_connected(self) -> bool:
        """Returns True if connected to EVM node."""
        try:
            connected = bool(self.w3.is_connected())
            if connected and not self.supply_chain_contract:
                self._load_contracts()
            return connected
        except Exception:
            return False

    def get_block_number(self) -> int:
        """Returns current EVM block height."""
        try:
            return self.w3.eth.block_number
        except Exception:
            return 0

    def get_chain_id(self) -> int:
        """Returns current EVM chain ID."""
        try:
            return self.w3.eth.chain_id
        except Exception:
            return 31337

    def create_batch_on_chain(
        self,
        batch_id_hex: str,
        product_name: str,
        min_temp_c: float,
        max_temp_c: float,
        mfg_private_key: str
    ) -> str:
        """
        Calls PharmaSupplyChain.createBatch() using manufacturer private key.
        Returns transaction hash.
        """
        if not self.supply_chain_contract:
            raise RuntimeError("PharmaSupplyChain contract not initialized or deployed")

        clean_batch_id = bytes.fromhex(batch_id_hex.replace("0x", ""))
        min_temp_scaled = int(round(min_temp_c * 100))
        max_temp_scaled = int(round(max_temp_c * 100))

        mfg_account = Account.from_key(mfg_private_key)
        nonce = self.w3.eth.get_transaction_count(mfg_account.address)

        tx = self.supply_chain_contract.functions.createBatch(
            clean_batch_id,
            product_name,
            min_temp_scaled,
            max_temp_scaled
        ).build_transaction({
            "from": mfg_account.address,
            "nonce": nonce,
            "gas": 300000,
            "gasPrice": self.w3.eth.gas_price
        })

        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=mfg_private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=10)
        return receipt.transactionHash.hex()

    def initiate_handover_on_chain(
        self,
        batch_id_hex: str,
        recipient_address: str,
        custodian_private_key: str
    ) -> str:
        """Initiates custody transfer on-chain."""
        clean_batch_id = bytes.fromhex(batch_id_hex.replace("0x", ""))
        custodian_acct = Account.from_key(custodian_private_key)
        nonce = self.w3.eth.get_transaction_count(custodian_acct.address)

        tx = self.supply_chain_contract.functions.initiateHandover(
            clean_batch_id,
            Web3.to_checksum_address(recipient_address)
        ).build_transaction({
            "from": custodian_acct.address,
            "nonce": nonce,
            "gas": 200000,
            "gasPrice": self.w3.eth.gas_price
        })

        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=custodian_private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=10)
        return receipt.transactionHash.hex()

    def confirm_handover_on_chain(
        self,
        batch_id_hex: str,
        sender_address: str,
        recipient_private_key: str
    ) -> str:
        """Confirms custody transfer on-chain (completes 2-of-2 multi-sig)."""
        clean_batch_id = bytes.fromhex(batch_id_hex.replace("0x", ""))
        recipient_acct = Account.from_key(recipient_private_key)
        nonce = self.w3.eth.get_transaction_count(recipient_acct.address)

        tx = self.supply_chain_contract.functions.confirmHandover(
            clean_batch_id,
            Web3.to_checksum_address(sender_address)
        ).build_transaction({
            "from": recipient_acct.address,
            "nonce": nonce,
            "gas": 250000,
            "gasPrice": self.w3.eth.gas_price
        })

        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=recipient_private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=10)
        return receipt.transactionHash.hex()

    def submit_signed_telemetry_on_chain(
        self,
        packet: Dict[str, Any],
        caller_private_key: str
    ) -> Tuple[bool, str]:
        """
        Submits signed telemetry to PharmaSupplyChain.submitSignedTelemetry().
        Returns (success_boolean, tx_hash_or_revert_message).
        """
        clean_batch_id = bytes.fromhex(packet["batch_id"].replace("0x", ""))
        caller_acct = Account.from_key(caller_private_key)
        nonce = self.w3.eth.get_transaction_count(caller_acct.address)

        r_bytes = bytes.fromhex(packet["r"].replace("0x", ""))
        s_bytes = bytes.fromhex(packet["s"].replace("0x", ""))

        try:
            tx = self.supply_chain_contract.functions.submitSignedTelemetry(
                clean_batch_id,
                packet["temperature_scaled"],
                packet["latitude_scaled"],
                packet["longitude_scaled"],
                packet["timestamp"],
                packet["nonce"],
                packet["v"],
                r_bytes,
                s_bytes
            ).build_transaction({
                "from": caller_acct.address,
                "nonce": nonce,
                "gas": 350000,
                "gasPrice": self.w3.eth.gas_price
            })

            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=caller_private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=10)
            return (True, receipt.transactionHash.hex())
        except Exception as e:
            return (False, str(e))

    def get_batch_from_chain(self, batch_id_hex: str) -> Optional[Dict[str, Any]]:
        """Reads batch state directly from EVM storage."""
        if not self.supply_chain_contract:
            return None

        clean_batch_id = bytes.fromhex(batch_id_hex.replace("0x", ""))
        try:
            data = self.supply_chain_contract.functions.getBatch(clean_batch_id).call()
            status_map = ["CREATED", "IN_TRANSIT", "DELIVERED", "QUARANTINED", "REPLENISHED"]
            return {
                "batch_id": "0x" + data[0].hex(),
                "product_name": data[1],
                "manufacturer": data[2],
                "current_custodian": data[3],
                "min_temp_celsius": data[4] / 100.0,
                "max_temp_celsius": data[5] / 100.0,
                "created_at_epoch": data[6],
                "status": status_map[data[7]],
                "replacement_batch_id": "0x" + data[8].hex() if data[8] != b'\x00'*32 else None,
                "telemetry_commit_count": data[9]
            }
        except Exception:
            return None


web3_service = Web3Service()
