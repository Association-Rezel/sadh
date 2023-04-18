"""Environment definitions for the back-end."""

from os import getenv

from dotenv import load_dotenv

class Env:
    """Check environment variables types and constraints."""
    database_url: str

    def __init__(self) -> None:
        load_dotenv()
        _u = getenv("DATABASE_URL")
        if not _u:
            raise EnvironmentError("DATABASE_URL is not set")
        # SQLAlchemy doesn't support postgres://, only postgresql://
        # https://stackoverflow.com/questions/62688256/sqlalchemy-exc-nosuchmoduleerror-cant-load-plugin-sqlalchemy-dialectspostgre#62688717
        if _u.startswith('postgresql://'):
            _u = _u.replace("postgres://", "postgresql://", 1)
        self.database_url = _u

ENV = Env()
