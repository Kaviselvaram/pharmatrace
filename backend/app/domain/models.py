from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Index
from app.core.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class BatchModel(Base):
    __tablename__ = "batches"

    batch_id = Column(String(66), primary_key=True, index=True) # 0x + 64 hex
    product_name = Column(String(120), nullable=False)
    manufacturer_address = Column(String(42), nullable=False)
    current_custodian = Column(String(42), nullable=False)
    min_temp_celsius = Column(Float, nullable=False)
    max_temp_celsius = Column(Float, nullable=False)
    status = Column(String(30), nullable=False, default="CREATED") # CREATED, IN_TRANSIT, DELIVERED, QUARANTINED, REPLENISHED
    replacement_batch_id = Column(String(66), nullable=True)
    genesis_tx_hash = Column(String(66), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class TelemetryModel(Base):
    __tablename__ = "telemetry_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(66), nullable=False, index=True)
    temperature_celsius = Column(Float, nullable=False)
    temperature_scaled = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(Integer, nullable=False)
    nonce = Column(Integer, nullable=False)
    payload_hash = Column(String(66), nullable=False)
    signature_v = Column(Integer, nullable=False)
    signature_r = Column(String(66), nullable=False)
    signature_s = Column(String(66), nullable=False)
    custodian_address = Column(String(42), nullable=False)
    is_tampered_mitm = Column(Boolean, default=False)
    on_chain_committed = Column(Boolean, default=False)
    on_chain_tx_hash = Column(String(66), nullable=True)
    recorded_at = Column(DateTime, default=get_utc_now)

    __table_args__ = (
        Index("idx_batch_nonce", "batch_id", "nonce"),
    )


class SecurityAlertModel(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(66), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False) # THERMAL_BREACH, MITM_TAMPER, REPLAY_ATTACK, GEOFENCE_DEVIATION
    severity = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    message = Column(Text, nullable=False)
    tx_hash = Column(String(66), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
