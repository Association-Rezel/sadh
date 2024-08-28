"""All routers are imported here."""

from pathlib import Path

for file in Path(__file__).parent.glob("*.py"):
    if file.name != "__init__.py":
        __import__(f"back.server.routers.{file.stem}")
