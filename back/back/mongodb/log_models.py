from typing import List
from uuid import UUID

from pydantic import AliasChoices, Field

from back.mongodb.base import PortableDatetime, RezelBaseModel


class IpamLogBucket(RezelBaseModel):
    id: UUID = Field(validation_alias=AliasChoices("id", "_id"))
    from_date: PortableDatetime = Field(...)
    to_date: PortableDatetime = Field(...)
    logs: list["IpamLog"] = Field([])


class IpamLog(RezelBaseModel):
    timestamp: PortableDatetime = Field(...)
    source: str = Field(...)
    message: str = Field(...)
