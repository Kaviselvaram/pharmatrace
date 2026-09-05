"""
WebSocket Connection Manager for Real-Time Telemetry & Alert Distribution.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import json
from typing import List, Dict, Any
from fastapi import WebSocket


class ConnectionManager:
    """Manages active browser WebSocket clients and broadcasts live events."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a JSON payload to all connected frontend clients."""
        disconnected = []
        payload_str = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload_str)
            except Exception:
                disconnected.append(connection)

        for dead_conn in disconnected:
            self.disconnect(dead_conn)


ws_manager = ConnectionManager()
