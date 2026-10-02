from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.health import router as health_router
from app.api.routes.blockchain import router as blockchain_router
from app.services.blockchain_service import BlockchainService

# Route standard logging to sys.stdout
logging.basicConfig(stream=sys.stdout, level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure Uvicorn logs route to stdout so cloud platforms tag as [info]
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        log = logging.getLogger(name)
        for handler in log.handlers:
            if hasattr(handler, "setStream"):
                handler.setStream(sys.stdout)
    yield


app = FastAPI(
    title="SSC Transparency Blockchain Service",
    description="Internal FastAPI Web3 service for Supreme Student Council transaction hashing, smart contract recording, and verification.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["root"])
def root_status():
    service = BlockchainService()
    net = service.get_network_info()
    return {
        "status": "ok",
        "service": "SSC Transparency Blockchain Service",
        "version": "1.0.0",
        "network": net,
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "network": "/api/blockchain/network",
            "record_transaction": "POST /api/blockchain/transactions",
            "verify_transaction": "POST /api/blockchain/verify",
            "lookup_transaction": "GET /api/blockchain/transactions/{hash_or_id}",
        },
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


app.include_router(health_router)
app.include_router(blockchain_router)
