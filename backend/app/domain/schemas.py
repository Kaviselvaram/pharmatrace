"""
Pydantic v2 Request and Response Validation Schemas.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class BatchCreateRequest(BaseModel):
    batch_id: Optional[str] = Field(None, description="Optional 32-byte hex ID; generated if omitted")
    product_name: str = Field(..., json_schema_extra={"example": "COVID-19 mRNA Vaccine Lot B"})
    min_temp_celsius: float = Field(default=2.0, json_schema_extra={"example": 2.0})
    max_temp_celsius: float = Field(default=8.0, json_schema_extra={"example": 8.0})


class BatchResponse(BaseModel):
    batch_id: str
    product_name: str
    manufacturer_address: str
    current_custodian: str
    min_temp_celsius: float
    max_temp_celsius: float
    status: str
    replacement_batch_id: Optional[str] = None
    genesis_tx_hash: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class HandoverInitiateRequest(BaseModel):
    batch_id: str
    recipient_address: str


class HandoverConfirmRequest(BaseModel):
    batch_id: str
    sender_address: str


class AttackInjectionRequest(BaseModel):
    batch_id: str
    attack_type: str = Field(..., json_schema_extra={"example": "COMPRESSOR_FAILURE"}) # COMPRESSOR_FAILURE, MITM_ALTERATION, REPLAY_ATTACK, GEOFENCE_DEVIATION
    tamper_delta: Optional[float] = -8.0


class TelemetryPacketSchema(BaseModel):
    batch_id: str
    temperature_celsius: float
    temperature_scaled: int
    latitude: float
    longitude: float
    timestamp: int
    nonce: int
    v: int
    r: str
    s: str
    raw_hash: str
    custodian_address: str
    is_tampered_mitm: bool = False
    waypoint_label: Optional[str] = None
    compressor_active: Optional[bool] = None
    attack_mode: Optional[str] = "NONE"


class BlockchainStatusResponse(BaseModel):
    connected: bool
    chain_id: int
    block_number: int
    rpc_url: str
    registry_address: str
    supply_chain_address: str


class AuditReportResponse(BaseModel):
    batch_id: str
    product_name: str
    status: str
    manufacturer: str
    current_custodian: str
    total_telemetry_points: int
    breach_count: int
    is_authentic: bool
    cold_chain_compliant: bool
    markdown_report: str
