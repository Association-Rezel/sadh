"""Define database connection and session factory."""
from collections.abc import Generator

from pydantic import parse_obj_as
from sqlalchemy import JSON, create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.types import TypeDecorator

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


class PydanticType(TypeDecorator):
    """Pydantic type.

    SAVING:
    - Uses SQLAlchemy JSON type under the hood.
    - Acceps the pydantic model and converts it to a dict on save.
    - SQLAlchemy engine JSON-encodes the dict to a string.
    RETRIEVING:
    - Pulls the string from the database.
    - SQLAlchemy engine JSON-decodes the string to a dict.
    - Uses the dict to create a pydantic model.
    """

    impl = JSONB

    def __init__(self, pydantic_type) -> None:
        super().__init__()
        self.pydantic_type = pydantic_type

    def load_dialect_impl(self, dialect):
        # Use JSONB for PostgreSQL and JSON for other databases.
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(JSON())

    def process_bind_param(self, value, dialect):
        from fastapi.encoders import jsonable_encoder
        return jsonable_encoder(value) if value else None

    def process_result_value(self, value, dialect):
        return parse_obj_as(self.pydantic_type, value) if value else None
