import re
from datetime import datetime
from typing import Optional

import pytz
from netaddr import EUI, mac_unix_expanded
from pydantic import AliasChoices, BaseModel, Field, field_validator
from pydantic_core.core_schema import FieldValidationInfo


class ONTOperationalData(BaseModel):
    path: str
    admin_status: bool
    operational_status: bool
    dbm_level: str
    estimation_distance: str
    last_operational_up: Optional[datetime]
    last_fetched: datetime

    @field_validator("last_fetched", mode="after")
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

    @field_validator("last_operational_up", mode="after")
    @classmethod
    def parse_optional_datetime(cls, v) -> Optional[datetime]:
        """Parse datetime from iso string or datetime."""
        if v is None:
            return None
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


class ONT(BaseModel):
    serial_number: str = Field(...)
    software_version: str = Field(...)
    box_mac_address: EUI = Field(...)
    position_in_pon: int = Field(...)
    position_in_subscriber_panel: Optional[str] = Field(default=None)
    operational_data: Optional[ONTOperationalData] = Field(default=None)
    configured_in_olt: Optional[bool] = Field(default=None)

    @field_validator("box_mac_address", mode="before")
    @classmethod
    def parse_mac(cls, v):
        if isinstance(v, EUI):
            return EUI(v, dialect=mac_unix_expanded)

        if isinstance(v, str):
            mac_obj = EUI(v, dialect=mac_unix_expanded)
            if mac_obj is None:
                raise ValueError("Invalid MAC address")
            return mac_obj

        else:
            raise ValueError("Invalid MAC address")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            EUI: lambda mac: str(EUI(mac, dialect=mac_unix_expanded)),
        }


class PON(BaseModel):
    olt_interface: str = Field(...)
    olt_id: str = Field(...)
    mec128_offset: int = Field(...)
    number_of_ports: int = Field(...)
    rack: int = Field(...)
    tiroir: int = Field(...)
    ont_list: list[ONT] = Field(default_factory=list)

    @field_validator("ont_list", mode="after")
    @classmethod
    def check_ont_list(cls, v: list[ONT], info: FieldValidationInfo):
        if len(v) > info.data["number_of_ports"]:
            raise ValueError("The number of ONTs is greater than the number of ports")

        for ont in v:
            if ont.position_in_pon > info.data["number_of_ports"]:
                raise ValueError(
                    f"The position of the ONT {ont.serial_number} is greater than the number of ports"
                )

        return v


class PM(BaseModel):
    id: str = Field(validation_alias=AliasChoices("id", "_id"))
    description: str = Field(...)
    pon_list: list[PON] = Field(default_factory=list)


####
# Models used to communicate from the frontend, but not stored as is in the database
####


class ONTInfo(BaseModel):
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


class PMInfo(BaseModel):
    id: str = Field(..., validation_alias=AliasChoices("id", "_id"))
    description: str = Field(...)


class RegisterONT(BaseModel):
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
