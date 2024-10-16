from datetime import datetime
from typing import List
from uuid import UUID

import pytz
from pydantic import AliasChoices, BaseModel, Field, field_validator


class IpamLogBucket(BaseModel):
    id: UUID = Field(validation_alias=AliasChoices("id", "_id"))
    from_date: datetime = Field(...)
    to_date: datetime = Field(...)
    logs: List["IpamLog"] = Field([])

    @field_validator("from_date", "to_date", mode="after")
    @classmethod
    def parse_datetime(cls, v) -> datetime:
        """Parse datetime from iso string or datetime."""
        if isinstance(v, datetime):
            return v.astimezone(pytz.timezone("Europe/Paris"))
        if isinstance(v, float) or isinstance(v, int):
            # We use Europe/Paris timezone so that when it is formatted to string
            # (e.g. in emails or matrix messages) it is displayed in the correct timezone
            # It does NOT change the value of the datetime object, just the way it is displayed
            # when using python.
            # The front-end is being communicated the datetime as a timestamp, so it will
            # display it in the timezone of the browser.
            return datetime.fromtimestamp(v, tz=pytz.timezone("Europe/Paris"))

        raise ValueError("Invalid datetime format")

    class Config:
        json_encoders = {
            datetime: lambda d: d.timestamp(),
        }


class IpamLog(BaseModel):
    timestamp: datetime = Field(...)
    source: str = Field(...)
    message: str = Field(...)

    @field_validator("timestamp", mode="after")
    @classmethod
    def parse_datetime(cls, v) -> datetime:
        """Parse datetime from iso string or datetime."""
        if isinstance(v, datetime):
            return v.astimezone(pytz.timezone("Europe/Paris"))
        if isinstance(v, float) or isinstance(v, int):
            # We use Europe/Paris timezone so that when it is formatted to string
            # (e.g. in emails or matrix messages) it is displayed in the correct timezone
            # It does NOT change the value of the datetime object, just the way it is displayed
            # when using python.
            # The front-end is being communicated the datetime as a timestamp, so it will
            # display it in the timezone of the browser.
            return datetime.fromtimestamp(v, tz=pytz.timezone("Europe/Paris"))

        raise ValueError("Invalid datetime format")

    class Config:
        json_encoders = {
            datetime: lambda d: d.timestamp(),
        }
