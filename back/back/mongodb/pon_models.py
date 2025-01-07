import re
from typing import Optional, Self

from pydantic import AliasChoices, Field, field_validator, model_validator

from back.mongodb.base import PortableDatetime, PortableMac, RezelBaseModel


class ONTOperationalData(RezelBaseModel):
    path: str
    admin_status: bool
    operational_status: bool
    dbm_level: str
    estimation_distance: str
    last_operational_up: Optional[PortableDatetime]
    last_fetched: PortableDatetime


class ONT(RezelBaseModel):
    serial_number: str = Field(...)
    software_version: str = Field(...)
    box_mac_address: PortableMac = Field(...)
    position_in_pon: int = Field(...)
    position_in_subscriber_panel: Optional[str] = Field(default=None)
    operational_data: Optional[ONTOperationalData] = Field(default=None)
    configured_in_olt: Optional[bool] = Field(default=None)


class PON(RezelBaseModel):
    olt_interface: str = Field(...)
    olt_id: str = Field(...)
    mec128_offset: int = Field(...)
    number_of_ports: int = Field(...)
    rack: int = Field(...)
    tiroir: int = Field(...)
    ont_list: list[ONT] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_ont_list(self) -> Self:
        if len(self.ont_list) > self.number_of_ports:
            raise ValueError("The number of ONTs is greater than the number of ports")

        for ont in self.ont_list:  # pylint: disable=not-an-iterable
            if ont.position_in_pon > self.number_of_ports:
                raise ValueError(
                    f"The position of the ONT {ont.serial_number} is greater than the number of ports"
                )
        return self


class PM(RezelBaseModel):
    id: str = Field(validation_alias=AliasChoices("id", "_id"))
    description: str = Field(...)
    pon_list: list[PON] = Field(default_factory=list)


####
# Models used to communicate from the frontend, but not stored as is in the database
####


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
