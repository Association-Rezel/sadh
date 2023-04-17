"""All database models are defined here."""
from back.database.main import get_db, Base, engine  # noqa: F401
import back.database.models as models  # noqa: F401

Base.metadata.create_all(bind=engine)
