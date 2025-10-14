from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.v1 import auth, contacts, emergency, sensor_data
from app.core.config import settings
from app.core.database import create_db_and_tables
from app.websocket.handlers import websocket_endpoint

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    await create_db_and_tables()
    yield
    # Shutdown
    logger.info("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Seizure Detection API",
    description="Backend API for seizure detection and emergency response system",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["Contacts"])
app.include_router(emergency.router, prefix="/api/v1", tags=["Emergency"])
app.include_router(sensor_data.router, prefix="/api/v1", tags=["Sensor Data"])

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):
    await websocket_endpoint(websocket)


# Health check endpoints
@app.get("/health/live", tags=["Health"])
async def liveness():
    """Liveness probe for Kubernetes"""
    return {"status": "alive"}

@app.get("/health/ready", tags=["Health"])
async def readiness():
    """Readiness probe for Kubernetes"""
    # Check database connection
    # Check Redis connection
    # Check external services
    return {"status": "ready"}

@app.get("/health/status", tags=["Health"])
async def health_status():
    """Detailed health status"""
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Seizure Detection API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health/status"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )