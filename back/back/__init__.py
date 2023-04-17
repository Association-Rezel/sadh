"""Main wrapper."""
from back.server.builder import build
from dotenv import load_dotenv

def make_app():
    """Make application."""
    load_dotenv()
    return build()
