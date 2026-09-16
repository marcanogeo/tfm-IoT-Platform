# =============================================================================
# Backend TFM IoT — FastAPI main.py
# Rutas: /health · /api/v1/telemetry · /api/v1/alerts · /ws/realtime
# =============================================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

# --------------- Lifespan (arranque / parada) ---------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Aquí conectarías el cliente MQTT y las BBDDs al arrancar
    print("🚀 Backend TFM IoT arrancando...")
    yield
    print("🛑 Backend TFM IoT apagándose...")

# --------------- App ----------------------------------------------------------
app = FastAPI(
    title="TFM IoT — API de Monitoreo Ambiental",
    description=(
        "Sistema distribuido de monitorización ambiental con ESP32, MQTT, "
        "InfluxDB, MongoDB y Grafana. TFM Máster Software Sistemas Distribuidos."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — permitir peticiones desde la app móvil / web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # En producción: lista de orígenes específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------- Rutas básicas ------------------------------------------------

@app.get("/health", tags=["Sistema"])
async def health():
    """Endpoint de salud — usado por el healthcheck de Docker Compose."""
    return {
        "status": "ok",
        "service": "tfm-iot-backend",
        "version": "1.0.0",
    }

@app.get("/api/v1/telemetry", tags=["Telemetría"])
async def get_telemetry(
    site: str = None,
    device_id: str = None,
    start: str = "-1h",
    stop: str = "now()",
    limit: int = 100,
):
    """
    Consulta telemetría almacenada en InfluxDB.
    Parámetros Flux: start/stop en formato InfluxDB ('-1h', '-7d', timestamp ISO).
    """
    # TODO: implementar consulta Flux a InfluxDB
    return {
        "query": {"site": site, "device_id": device_id, "start": start},
        "data": [],
        "message": "Implementar cliente InfluxDB aquí"
    }

@app.get("/api/v1/devices", tags=["Dispositivos"])
async def get_devices():
    """Lista todos los dispositivos registrados en MongoDB."""
    # TODO: implementar consulta a MongoDB (colección devices)
    return {"devices": [], "message": "Implementar cliente MongoDB aquí"}

@app.get("/api/v1/alerts", tags=["Alertas"])
async def get_alert_events(limit: int = 50):
    """Histórico de eventos de alerta generados."""
    # TODO: consultar colección alert_events en MongoDB
    return {"events": [], "total": 0}

@app.get("/api/v1/alerts/rules", tags=["Alertas"])
async def get_alert_rules():
    """Reglas de alerta configuradas en MongoDB."""
    # TODO: consultar colección alert_rules en MongoDB
    return {"rules": []}

# --------------- WebSocket — datos en tiempo real -----------------------------
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/realtime")
async def websocket_realtime(websocket: WebSocket):
    """
    WebSocket para streaming de telemetría en tiempo real.
    El backend se suscribe a MQTT y reenvía los mensajes a los clientes conectados.
    Formato del mensaje: {"device_id": "...", "site": "...", "payload": {...}}
    """
    await websocket.accept()
    try:
        while True:
            # TODO: conectar a cliente MQTT y hacer forward de mensajes
            data = await websocket.receive_text()
            await websocket.send_json({"echo": data, "status": "ws_ok"})
    except WebSocketDisconnect:
        pass
