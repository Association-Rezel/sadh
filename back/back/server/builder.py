"""Build the server."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware

from back.env import ENV
from back.mongodb.db import close_db, init_db
from back.server.routers.appointments import router as router_appointments
from back.server.routers.auth import router_auth
from back.server.routers.devices import router as router_devices
from back.server.routers.documenso import router as router_documenso
from back.server.routers.logging import router as router_logging
from back.server.routers.net import router as router_net
from back.server.routers.nix import router as router_nix
from back.server.routers.ptah import router as router_ptah
from back.server.routers.partial_refunds import router as router_partial_refunds
from back.server.routers.pms import router as router_pms
from back.server.routers.users import router as router_users
from back.server.routers.helloasso import router as router_helloasso_notif
from back.server.routers.features import router as router_features
from back.utils.logger import init_logger

logger = logging.getLogger(__name__)


def root() -> RedirectResponse:
    """Redirect to the docs."""
    # Regist to /docs but taking in account that the root is not neceseselraliry / for the api
    return RedirectResponse(url="/docs")


def build() -> FastAPI:
    """Build the app from interfaces."""
    init_logger()
    app = FastAPI()
    app.openapi_version = "3.0.3"

    if ENV.deploy_env in ["dev", "local"]:
        origins = [
            "http://localhost:6100",
            "https://sadh.dev.fai.rezel.net",
            "https://fai.rezel.net",
            "https://sadh.fai.rezel.net",
        ]
    else:
        origins = [
            "https://fai.rezel.net",
            "https://sadh.fai.rezel.net",
        ]

    logger.debug("Allowed origins: %s", origins)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(
        SessionMiddleware,
        secret_key=ENV.starlette_session_secret,
        https_only=(ENV.deploy_env not in ["dev", "local"]),
        same_site="lax",
        max_age=ENV.session_expiration_time_seconds,
    )

    app.add_event_handler("startup", init_db)
    app.add_event_handler("shutdown", close_db)

    app.get("/")(root)

    app.include_router(router_auth)
    app.include_router(router_appointments)
    app.include_router(router_devices)
    app.include_router(router_documenso)
    app.include_router(router_logging)
    app.include_router(router_net)
    app.include_router(router_nix)
    app.include_router(router_ptah)
    app.include_router(router_partial_refunds)
    app.include_router(router_pms)
    app.include_router(router_users)
    app.include_router(router_features)
    app.include_router(router_helloasso_notif)

    logger.info("Server built")

    return app
