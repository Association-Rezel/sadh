"""All database models are defined here."""
import back.database.models as models
from back.database.main import Base, engine, get_db

Base.metadata.create_all(bind=engine)
