from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, client_id: str = None):
    if not client_id:
        client_id = str(id(websocket))

    await manager.connect(websocket, client_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle different message types
            if message.get("type") == "sensor_data":
                # Broadcast sensor data to all connected clients
                await manager.broadcast(json.dumps({
                    "type": "sensor_update",
                    "client_id": client_id,
                    "data": message.get("data")
                }))

            elif message.get("type") == "emergency":
                # Broadcast emergency alert
                await manager.broadcast(json.dumps({
                    "type": "emergency_alert",
                    "client_id": client_id,
                    "data": message.get("data")
                }))

            elif message.get("type") == "ping":
                # Respond to ping
                await manager.send_personal_message(
                    json.dumps({"type": "pong"}),
                    client_id
                )

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast(json.dumps({
            "type": "client_disconnected",
            "client_id": client_id
        }))