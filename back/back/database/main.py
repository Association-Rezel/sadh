"""Define database connection and session factory."""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from back.env import ENV

engine = create_engine(ENV.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Injectable dependency for getting a database session."""
    database_session = SessionLocal()
    try:
        yield database_session
    finally:
        database_session.close()

