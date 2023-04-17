"""Main wrapper."""
from back.server.builder import build


def make_app():
    """Make application."""
    return build()
