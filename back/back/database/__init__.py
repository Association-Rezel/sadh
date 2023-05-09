"""All database models are defined here."""
from back.database import models
from back.database.main import Base, Session, engine, get_db

Base.metadata.create_all(bind=engine)
