from typing import Optional

from pydantic import AliasChoices, BaseModel, Field, field_validator
from pydantic_core.core_schema import FieldValidationInfo


class ONT(BaseModel):
    serial_number: str = Field(...)
    software_version: str = Field(...)
    box_mac_address: str = Field(...)
    position_in_pon: int = Field(...)
    position_in_subscriber_panel: Optional[str] = Field(default=None)


class PON(BaseModel):
    olt_interface: str = Field(...)
    olt_id: str = Field(...)
    mec128_offset: int = Field(...)
    number_of_ports: int = Field(...)
    rack: int = Field(...)
    tiroir: int = Field(...)
    ont_list: list[ONT] = Field(default_factory=list)

    @field_validator("ont_list", mode="after")
    def check_ont_list(cls, v: list[ONT], info: FieldValidationInfo):
        if len(v) > info.data["number_of_ports"]:
            raise ValueError("The number of ONTs is greater than the number of ports")

        for ont in v:
            if ont.position_in_pon > info.data["number_of_ports"]:
                raise ValueError(f"The position of the ONT {ont.serial_number} is greater than the number of ports")

        return v


class PM(BaseModel):
    id: str = Field(validation_alias=AliasChoices("id", "_id"))
    description: str = Field(...)
    pon_list: list[PON] = Field(default_factory=list)


####
# Models used to communicate from the frontend, but not stored as is in the database
####


class ONTInfos(BaseModel):
    serial_number: str = Field(...)
    software_version: str = Field(...)
    box_mac_address: str = Field(...)
    mec128_position: str = Field(...)
    olt_interface: str = Field(...)
    pm_description: str = Field(...)
    position_in_subscriber_panel: Optional[str] = Field(default=None)
    pon_rack: int = Field(...)
    pon_tiroir: int = Field(...)


class PMInfos(BaseModel):
    id: str = Field(..., validation_alias=AliasChoices("id", "_id"))
    description: str = Field(...)


class RegisterONT(BaseModel):
    serial_number: str = Field(...)
    software_version: str = Field(...)
    box_mac_address: str = Field(...)
    pm_id: str = Field(...)
