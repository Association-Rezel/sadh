"""Define database connection and session factory."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from back.env import ENV

engine = create_engine(ENV.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Injectable dependency for getting a database session."""
    database_session = SessionLocal()
    try:
        yield database_session
    finally:
        database_session.close()
