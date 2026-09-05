"""
FastAPI Main Application Entrypoint.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.websocket import ws_manager

# Import API Routers
from app.api.v1.batches import router as batches_router
from app.api.v1.handover import router as handover_router
from app.api.v1.simulation import router as simulation_router
from app.api.v1.blockchain import router as blockchain_router
from app.api.v1.audit import router as audit_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: initializes SQLite database on startup."""
    print("=== Initializing Pharmaceutical Supply Chain Gateway ===")
    await init_db()
    print("SQLite database tables initialized.")
    yield
    print("=== Shutting down Gateway ===")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Decentralized Pharmaceutical Cold-Chain Traceability, Chaos Attack Simulator & Autonomous Replenishment Platform",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(batches_router, prefix=settings.API_V1_STR)
app.include_router(handover_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(blockchain_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)


@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """Real-time bi-directional WebSocket stream for live sensor readings and on-chain events."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; accept any client commands
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


@app.get("/health")
async def health_check():
    """Healthcheck endpoint."""
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


@app.get("/")
async def root():
    """Root metadata endpoint."""
    return {
        "message": "Welcome to the Blockchain-Based Supply Chain Simulation Framework API",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "websocket_url": "/ws/telemetry"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
