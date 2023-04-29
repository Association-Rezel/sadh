"""Logging configuration."""
import logging

from back.env import ENV


def init_logger():
    """Setup the logger."""
    level = ENV.log_level

    logger = logging.getLogger("back")
    logger.setLevel(level)
    logger.handlers = []
    logger.addHandler(logging.StreamHandler())

    try:
        # On essaye de récupérer le formatter de uvicorn.
        # ça ne fonctionne que si on a lancé avec python -m uvicorn ...
        fastapi_formatter = logging.getLogger("uvicorn").handlers[0].formatter
        logger.handlers[0].setFormatter(fastapi_formatter)
    except Exception as e:
        logger.debug("/!\\ uvicorn log formatter not found")
