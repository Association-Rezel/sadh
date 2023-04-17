"""Define database connection and session factory."""
from os import getenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


db_url = getenv("DATABASE_URL")
if not db_url:
    raise ValueError("DATABASE_URL is not set")

engine = create_engine(db_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Injectable dependency for getting a database session."""
    database_session = SessionLocal()
    try:
        yield database_session
    finally:
        database_session.close()
