"""All database models are defined here."""
from back.database import models
from back.database.main import Base, Session, SessionLocal, engine

Base.metadata.create_all(bind=engine)
