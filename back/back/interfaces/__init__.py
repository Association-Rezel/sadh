from pydantic import BaseModel


class User(BaseModel):
    """A user model"""

    id: str
    last_name: str
    first_name: str

    class Config:
        """Config"""

        schema_extra = {"example": {"id": "123456789", "first_name": "John", "last_name": "Doe"}}
