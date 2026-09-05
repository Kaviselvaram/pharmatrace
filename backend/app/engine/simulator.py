"""
Deterministic Thermodynamic & Transit Simulation Engine.
Models physical temperature fluctuations, compressor cycling, route progress, and attack injection.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import time
import random
from enum import Enum
from typing import Dict, Any, Optional, Tuple, Callable
from app.engine.telemetry_node import VirtualizedNode
from app.engine.routes import interpolate_route_position, DEFAULT_WAYPOINTS


class AttackType(str, Enum):
    NONE = "NONE"
    COMPRESSOR_FAILURE = "COMPRESSOR_FAILURE"
    MITM_ALTERATION = "MITM_ALTERATION"
    REPLAY_ATTACK = "REPLAY_ATTACK"
    GEOFENCE_DEVIATION = "GEOFENCE_DEVIATION"


class TransitSimulator:
    """
    Simulates a refrigerated vehicle transporting a pharmaceutical batch.
    Uses thermodynamic heat transfer formulas and hysteresis compressor cycles.
    Supports deterministic seeded runs (seed=42) for reproducible evaluations and tests.
    """

    def __init__(
        self,
        batch_id_hex: str,
        node: VirtualizedNode,
        initial_temp: float = 4.5,
        ambient_temp: float = 32.0,
        insulation_k: float = 0.008,
        cooling_power: float = -0.65,
        seed: int = 42,
        total_steps: int = 50
    ):
        self.batch_id_hex = batch_id_hex
        self.node = node
        self.current_temp = initial_temp
        self.ambient_temp = ambient_temp
        self.insulation_k = insulation_k
        self.cooling_power = cooling_power
        self.total_steps = total_steps
        self.current_step = 0
        self.compressor_active = False

        self.rng = random.Random(seed)
        self.active_attack: AttackType = AttackType.NONE
        self.tamper_temp_delta: float = 0.0
        self.stale_nonce: Optional[int] = None
        self.last_emitted_packet: Optional[Dict[str, Any]] = None

    def inject_attack(self, attack: AttackType, tamper_delta: float = -8.0):
        """Injects a physical failure or cryptographic security attack."""
        self.active_attack = attack
        self.tamper_temp_delta = tamper_delta

    def reset_attacks(self):
        """Resets attack mode to nominal operation."""
        self.active_attack = AttackType.NONE
        self.tamper_temp_delta = 0.0

    def step(self, delta_t: float = 1.0, current_time: Optional[int] = None) -> Dict[str, Any]:
        """
        Advances simulation by delta_t seconds and generates a cryptographically signed packet.
        """
        self.current_step += 1
        timestamp = current_time if current_time is not None else int(time.time())

        # 1. Physical Thermodynamic Heat Exchange: dT/dt = -k(T - T_amb) + Q_cooling + noise
        passive_heat_gain = -self.insulation_k * (self.current_temp - self.ambient_temp) * delta_t

        if self.active_attack == AttackType.COMPRESSOR_FAILURE:
            # Compressor mechanical failure: cooling turns completely off
            self.compressor_active = False
            active_cooling = 0.0
        else:
            # Normal compressor hysteresis cycle (3.8°C - 5.2°C)
            if self.current_temp >= 5.2:
                self.compressor_active = True
            elif self.current_temp <= 3.8:
                self.compressor_active = False

            active_cooling = (self.cooling_power * delta_t) if self.compressor_active else 0.0

        # Sensor measurement noise
        noise = self.rng.gauss(0.0, 0.03)

        self.current_temp = max(-30.0, min(60.0, self.current_temp + passive_heat_gain + active_cooling + noise))

        # 2. Route Position Interpolation
        progress = self.current_step / float(self.total_steps)
        lat, lon, waypoint_label = interpolate_route_position(progress)

        if self.active_attack == AttackType.GEOFENCE_DEVIATION:
            # Shift coordinates 120km west into unauthorized zone
            lat += 1.2
            lon -= 1.5
            waypoint_label = "UNAUTHORIZED ROUTE DEVIATION DETECTED"

        # 3. Nonce & Signing Handling
        nonce_to_use = None
        if self.active_attack == AttackType.REPLAY_ATTACK and self.stale_nonce is not None:
            # Inject previously consumed nonce
            nonce_to_use = self.stale_nonce
        else:
            nonce_to_use = self.node.get_next_nonce()
            self.stale_nonce = nonce_to_use

        # Sign truthfully at edge
        signed_packet = self.node.sign_reading(
            batch_id_hex=self.batch_id_hex,
            temperature_celsius=round(self.current_temp, 2),
            latitude=lat,
            longitude=lon,
            timestamp=timestamp,
            forced_nonce=nonce_to_use
        )

        # 4. MITM Attack Simulation: Tamper with payload after signing without updating signature
        if self.active_attack == AttackType.MITM_ALTERATION:
            # Attacker falsifies reading to hide excursion
            altered_temp = round(self.current_temp + self.tamper_temp_delta, 2)
            signed_packet["raw_sensor_temperature"] = signed_packet["temperature_celsius"]
            signed_packet["temperature_celsius"] = altered_temp
            signed_packet["temperature_scaled"] = int(round(altered_temp * 100))
            signed_packet["is_tampered_mitm"] = True
        else:
            signed_packet["is_tampered_mitm"] = False

        signed_packet["step"] = self.current_step
        signed_packet["progress"] = round(progress, 4)
        signed_packet["waypoint_label"] = waypoint_label
        signed_packet["compressor_active"] = self.compressor_active
        signed_packet["attack_mode"] = self.active_attack.value

        self.last_emitted_packet = signed_packet
        return signed_packet
