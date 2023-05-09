"""Logging configuration."""
import logging

from back.env import ENV


def init_logger() -> None:
    """Setup the logger."""
    level = ENV.log_level

    logger = logging.getLogger("back")
    logger.setLevel(level)
    logger.handlers = []
    logger.addHandler(logging.StreamHandler())

    try:
        # On essaye de récupérer le formatter de uvicorn.
        # ça ne fonctionne que si on a lancé avec python -m uvicorn ...
        uvicorn_formatter = logging.getLogger("uvicorn").handlers[0].formatter
        logger.handlers[0].setFormatter(uvicorn_formatter)
    except IndexError:
        logger.debug("/!\\ uvicorn log formatter not found")
