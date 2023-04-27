"""Logging configuration."""
import logging

from back.env import ENV


def init_logger():
    """Setup the logger."""
    level = ENV.log_level
    fastapi_formatter = logging.getLogger("uvicorn").handlers[0].formatter
    logger = logging.getLogger("back")
    logger.setLevel(level)
    logger.handlers = []
    logger.addHandler(logging.StreamHandler())
    logger.handlers[0].setFormatter(fastapi_formatter)
