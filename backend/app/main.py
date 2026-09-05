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
    """Lifecycle manager: initializes SQLite database on startup and seeds initial demonstration lots."""
    print("=== Initializing Pharmaceutical Supply Chain Gateway ===")
    await init_db()
    print("SQLite database tables initialized.")

    try:
        from app.core.database import AsyncSessionLocal
        from app.domain.models import BatchModel
        from datetime import datetime, timezone

        async with AsyncSessionLocal() as session:
            batch1 = await session.get(BatchModel, "0x1111111111111111111111111111111111111111111111111111111111111111")
            if not batch1:
                session.add(BatchModel(
                    batch_id="0x1111111111111111111111111111111111111111111111111111111111111111",
                    product_name="Comirnaty mRNA COVID-19 Vaccine (2-8°C)",
                    manufacturer_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                    current_custodian="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                    min_temp_celsius=2.0,
                    max_temp_celsius=8.0,
                    status="IN_TRANSIT",
                    created_at=datetime.now(timezone.utc)
                ))
            batch2 = await session.get(BatchModel, "0x2222222222222222222222222222222222222222222222222222222222222222")
            if not batch2:
                session.add(BatchModel(
                    batch_id="0x2222222222222222222222222222222222222222222222222222222222222222",
                    product_name="Covaxin Purified Inactivated Lot B-4091",
                    manufacturer_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                    current_custodian="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                    min_temp_celsius=2.0,
                    max_temp_celsius=8.0,
                    status="CREATED",
                    created_at=datetime.now(timezone.utc)
                ))
            await session.commit()
            print("Demonstration lots verified in SQLite database.")
    except Exception as e:
        print(f"Notice: Batch auto-seeding skipped: {e}")

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
