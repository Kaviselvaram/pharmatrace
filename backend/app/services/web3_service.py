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
        """Returns True if connected to EVM node and ensures contracts are loaded."""
        try:
            connected = bool(self.w3.is_connected())
            if connected:
                # Check if contracts need loading or reloading
                deployments_path = os.path.abspath(settings.DEPLOYMENTS_FILE)
                if not os.path.exists(deployments_path):
                    alt_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../contracts/deployments/local.json"))
                    if os.path.exists(alt_path):
                        deployments_path = alt_path
                if os.path.exists(deployments_path):
                    with open(deployments_path, "r") as f:
                        meta = json.load(f)
                    new_addr = meta.get("contracts", {}).get("PharmaSupplyChain", {}).get("address")
                    curr_addr = self.supply_chain_contract.address if self.supply_chain_contract else None
                    if not self.supply_chain_contract or (new_addr and curr_addr and new_addr.lower() != curr_addr.lower()):
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

    def get_current_chain_time(self) -> int:
        """Returns current EVM latest block timestamp, or system time if unavailable."""
        try:
            return self.w3.eth.get_block("latest").timestamp
        except Exception:
            import time
            return int(time.time())

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

        try:
            raw_hex = batch_id_hex.strip().lower()
            if raw_hex.startswith("0x"):
                raw_hex = raw_hex[2:]
            if len(raw_hex) < 64:
                raw_hex = raw_hex.zfill(64)
            elif len(raw_hex) > 64:
                raw_hex = raw_hex[:64]
            clean_batch_id = bytes.fromhex(raw_hex)

            data = self.supply_chain_contract.functions.getBatch(clean_batch_id).call()
            # If batch does not exist, data[6] (createdAt) is 0
            if not data or data[6] == 0:
                return None

            status_map = ["CREATED", "IN_TRANSIT", "DELIVERED", "QUARANTINED", "REPLENISHED"]
            status_idx = data[7] if 0 <= data[7] < len(status_map) else 0
            return {
                "batch_id": "0x" + data[0].hex(),
                "product_name": data[1],
                "manufacturer": data[2],
                "current_custodian": data[3],
                "min_temp_celsius": data[4] / 100.0,
                "max_temp_celsius": data[5] / 100.0,
                "created_at_epoch": data[6],
                "status": status_map[status_idx],
                "replacement_batch_id": "0x" + data[8].hex() if data[8] != b'\x00'*32 else None,
                "telemetry_commit_count": data[9]
            }
        except Exception:
            return None

    def find_batch_by_tx_hash(self, tx_hash_hex: str) -> Optional[str]:
        """Resolves a pharmaceutical batch ID from EVM transaction receipt logs or calldata."""
        try:
            if not self.is_connected():
                return None
            clean_tx = tx_hash_hex.strip()
            if not clean_tx.startswith("0x"):
                clean_tx = f"0x{clean_tx}"

            receipt = None
            try:
                receipt = self.w3.eth.get_transaction_receipt(clean_tx)
            except Exception:
                receipt = None

            # Handle failed / reverted transactions
            if receipt and receipt.status == 0:
                return "FAILED_TX"

            # Check if receipt target contract matches supply chain
            if receipt and receipt.to and self.supply_chain_contract:
                if receipt.to.lower() != self.supply_chain_contract.address.lower():
                    return "WRONG_CONTRACT_TX"

            # 1. Inspect transaction receipt logs
            if receipt and receipt.logs:
                for log in receipt.logs:
                    for topic in log.topics[1:]:
                        topic_hex = topic.hex() if hasattr(topic, "hex") else str(topic)
                        candidate = "0x" + topic_hex if not topic_hex.startswith("0x") else topic_hex
                        batch_info = self.get_batch_from_chain(candidate)
                        if batch_info:
                            return batch_info["batch_id"]

            # 2. Inspect transaction calldata
            try:
                tx = self.w3.eth.get_transaction(clean_tx)
                if tx and tx.input:
                    # Try ABI function decoding if sent to supply chain contract
                    if tx.to and self.supply_chain_contract and tx.to.lower() == self.supply_chain_contract.address.lower():
                        try:
                            func, params = self.supply_chain_contract.decode_function_input(tx.input)
                            for key in ["batchId", "originalBatchId", "quarantinedBatchId", "replacementBatchId", "suggestedReplacementId"]:
                                if key in params:
                                    val = params[key]
                                    hex_str = "0x" + (val.hex() if isinstance(val, (bytes, bytearray)) else str(val).replace("0x", ""))
                                    batch_info = self.get_batch_from_chain(hex_str)
                                    if batch_info:
                                        return batch_info["batch_id"]
                        except Exception:
                            pass

                    # Direct scan of input bytes for any 32-byte chunk matching a registered batch
                    raw_input = tx.input.hex() if hasattr(tx.input, "hex") else str(tx.input)
                    raw_clean = raw_input.replace("0x", "")
                    for i in range(8, len(raw_clean) - 63, 64):
                        chunk = "0x" + raw_clean[i:i + 64]
                        batch_info = self.get_batch_from_chain(chunk)
                        if batch_info:
                            return batch_info["batch_id"]
            except Exception:
                pass

            if receipt:
                return "UNRELATED_TX"

            return None
        except Exception:
            return None

    def find_batch_by_block(self, block_identifier: Any) -> Optional[str]:
        """Resolves pharmaceutical batch ID(s) from transactions in an EVM block hash or number."""
        try:
            if not self.is_connected():
                return None
            target = block_identifier
            if isinstance(target, str):
                target = target.strip()
                if target.startswith("0x") and len(target) == 66:
                    target = target
                elif len(target) == 64 and all(c in "0123456789abcdefABCDEF" for c in target):
                    target = f"0x{target}"
                elif target.startswith("0x") and target[2:].isdigit():
                    target = int(target[2:], 10)
                elif target.isdigit():
                    target = int(target)

            block = None
            try:
                block = self.w3.eth.get_block(target, full_transactions=True)
            except Exception:
                if isinstance(target, str) and target.startswith("0x"):
                    try:
                        target_int = int(target, 16)
                        block = self.w3.eth.get_block(target_int, full_transactions=True)
                    except Exception:
                        pass

            if not block:
                return None

            candidate_batches = set()
            if block.transactions:
                for tx in block.transactions:
                    tx_hash = tx.hash.hex() if hasattr(tx.hash, "hex") else str(tx.hash)
                    batch_id = self.find_batch_by_tx_hash(tx_hash)
                    if batch_id and batch_id not in ["UNRELATED_TX", "FAILED_TX", "WRONG_CONTRACT_TX"]:
                        candidate_batches.add(batch_id)

            if len(candidate_batches) > 1:
                return "AMBIGUOUS:" + ",".join(sorted(candidate_batches))
            elif len(candidate_batches) == 1:
                return next(iter(candidate_batches))

            # Block exists on EVM, but has no transactions associated with any registered batch
            return "UNRELATED_BLOCK"
        except Exception:
            return None

    def link_replacement_batch_on_chain(
        self,
        quarantined_batch_id_hex: str,
        replacement_batch_id_hex: str,
        mfg_private_key: str
    ) -> str:
        """Links an expedited replacement batch to a quarantined lot on-chain."""
        clean_orig_id = bytes.fromhex(quarantined_batch_id_hex.replace("0x", ""))
        clean_rep_id = bytes.fromhex(replacement_batch_id_hex.replace("0x", ""))
        mfg_acct = Account.from_key(mfg_private_key)
        nonce = self.w3.eth.get_transaction_count(mfg_acct.address)

        tx = self.supply_chain_contract.functions.linkReplacementBatch(
            clean_orig_id,
            clean_rep_id
        ).build_transaction({
            "from": mfg_acct.address,
            "nonce": nonce,
            "gas": 200000,
            "gasPrice": self.w3.eth.gas_price
        })

        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=mfg_private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=10)
        return receipt.transactionHash.hex()


web3_service = Web3Service()
