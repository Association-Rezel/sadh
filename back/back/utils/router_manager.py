"""Build the server."""
import logging

from fastapi import APIRouter, FastAPI

logger = logging.getLogger(__name__)


class Routeurs:
    """Routers manager."""

    __routers: dict[str, APIRouter]

    def __init__(self) -> None:
        """Router manager."""
        self.__routers = {}

    def new(self, prefix: str) -> APIRouter:
        """Create a new router."""
        route = f"/{prefix}"
        if prefix in self.__routers:
            raise ValueError(f"Router {prefix} already exists")  # noqa: TRY003, EM102
        router = APIRouter(prefix=route, tags=[prefix])
        self.__routers = {**self.__routers, prefix: router}
        return router

    def register(self, app: FastAPI) -> None:
        """Register all routers."""
        for route, router in self.__routers.items():
            logger.info("Adding router %s", route)
            app.include_router(router)


ROUTEURS = Routeurs()
