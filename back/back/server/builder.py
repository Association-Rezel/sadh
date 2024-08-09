"""Build the server."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from back.env import ENV
from back.mongodb.db import close_db, init_db
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

    if ENV.deploy_env in ["dev", "local"]:
        origins = [
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:8000",
            "https://sadh.dev.fai.rezel.net",
            "https://fai.rezel.net",
            "https://sadh.fai.rezel.net",
        ]
    else:
        origins = [
            "https://fai.rezel.net",
        ]

    logger.debug("Allowed origins: %s", origins)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_event_handler("startup", init_db)
    app.add_event_handler("shutdown", close_db)

    app.get("/")(root)

    ROUTEURS.register(app)
    logger.info("Server built")

    return app
