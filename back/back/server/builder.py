"""Build the server."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from back.utils.logger import init_logger
from back.utils.router_manager import ROUTEURS

logger = logging.getLogger(__name__)


def root() -> RedirectResponse:
    """Redirect to the docs."""
    return RedirectResponse(url="/docs")


def build() -> FastAPI:
    """Build the app from interfaces."""
    init_logger()
    app = FastAPI()
    origins = [
        "http://localhost:5173", 
        "http://localhost:8080", 
        "http://localhost:8000",
        "https://fai.rezel.net",
        "https://faipp.rezel.net"
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5173"
    ]
    

    app.get("/")(root)

    ROUTEURS.register(app)
    logger.info("Server built")

    return app
