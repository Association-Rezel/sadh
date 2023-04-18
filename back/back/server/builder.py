"""Build the server."""
import logging
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from back.server.user import router as user_router
from back.server.auth import router as auth_router


logger = logging.getLogger("uvicorn")


def root():
    """Redirect to the docs."""
    return RedirectResponse(url="/docs")


def build() -> FastAPI:
    """Build the app from interfaces."""
    app = FastAPI()
    origins = ["*"]

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

    logger.info('Server built')

    return app
