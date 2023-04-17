from pydantic import BaseModel


class User(BaseModel):
    """A user model"""

    user_id: str

    class Config:
        """Config"""

        schema_extra = {"example": {"user_id": "123456789"}}
