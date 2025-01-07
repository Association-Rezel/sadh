import re
from typing import Optional

from common_models.base import RezelBaseModel
from common_models.pon_models import ONTOperationalData
from pydantic import AliasChoices, Field, field_validator


class ONTInfo(RezelBaseModel):
    serial_number: str = Field(...)
    software_version: str = Field(...)
    box_mac_address: str = Field(...)
    mec128_position: str = Field(...)
    olt_interface: str = Field(...)
    pm_description: str = Field(...)
    position_in_subscriber_panel: Optional[str] = Field(default=None)
    pon_rack: int = Field(...)
    pon_tiroir: int = Field(...)
    operational_data: Optional[ONTOperationalData] = Field(default=None)
    configured_in_olt: Optional[bool] = Field(default=None)


class PMInfo(RezelBaseModel):
    id: str = Field(..., validation_alias=AliasChoices("id", "_id"))
    description: str = Field(...)


class RegisterONT(RezelBaseModel):
    serial_number: str = Field(...)
    software_version: str = Field(...)
    pm_id: str = Field(...)
    position_pm: Optional[str] = Field(None)

    @field_validator("position_pm", mode="before")
    @classmethod
    def parse_position_pm(cls, v):
        if not v:
            return None

        if not re.match(r"[A-Z][1-8]", v):
            raise ValueError("Invalid position position PM (should match /[A-Z][1-8]/)")

        return v
