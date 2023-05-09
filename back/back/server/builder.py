"""Build the server."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from back.netbox_client.main import NetBoxClient
from back.server.auth import router as auth_router
from back.server.box import router as box_router
from back.server.user import router as user_router
from back.utils.logger import init_logger

logger = logging.getLogger(__name__)


def root() -> RedirectResponse:
    """Redirect to the docs."""
    return RedirectResponse(url="/docs")


def build() -> FastAPI:
    """Build the app from interfaces."""
    init_logger()
    app = FastAPI()
    origins = ["http://localhost:5173", "http://localhost:8080", "http://localhost:8000"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.get("/")(root)
    app.include_router(user_router)
    app.include_router(auth_router)
    app.include_router(box_router)

    logger.info("Server built")

    NetBoxClient()

    return app
