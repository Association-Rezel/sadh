"""Build the server."""
from fastapi import FastAPI
from fastapi.responses import RedirectResponse


from back.server.user import router as user_router


def root():
    return RedirectResponse(url="/docs")


def build() -> FastAPI:
    """Build the app from interfaces."""
    app = FastAPI()

    app.get("/")(root)
    app.include_router(user_router)

    return app
