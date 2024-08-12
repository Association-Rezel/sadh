import csv
import json
import uuid
from datetime import datetime
from re import A
from typing import List, Optional

from back.mongodb.user_models import (
    Address,
    Appointment,
    AppointmentSlot,
    AppointmentType,
    DepositStatus,
    EquipmentStatus,
    Membership,
    MembershipStatus,
    Residence,
    User,
)

# keycloak_id,name,email,is_active,is_admin,phone,subscription_id,user_id,chambre,status,unsubscribe_reason,flow_id,subscription_id,erdv_information,erdv_id,present_for_appointment,ref_commande,ref_prestation,ont_lent,box_lent,box_information,dolibarr_information,cmd_acces_sent,cr_mes_sent,comment,paid_caution,paid_first_month,contract_signed,appointment_id,subscription_id,slot_start,slot_end,status,type


def convert_csv_to_mongodb_users(csv_file_path: str):
    with open(csv_file_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        data = list(reader)

    users: List[User] = []

    for user in data:
        if user["substatus"] not in ["4", "2"]:
            continue

        active = user["substatus"] == "4"

        addressdata = json.loads(user["chambre"])

        app = None
        if user["appstatus"] == "2":
            app = Appointment(
                slot=AppointmentSlot(
                    start=datetime.fromisoformat(user["slot_start"]),
                    end=datetime.fromisoformat(user["slot_end"]),
                ),
                type=AppointmentType.RACCORDEMENT,
            )

        users.append(
            User(
                id=uuid.uuid4(),
                email=user["email"],
                phone_number=user["phone"],
                first_name=" ".join(user["name"].split(" ")[:-1]),
                last_name=user["name"].split(" ")[-1],
                availability_slots=set(),
                membership=Membership(
                    init=None,
                    unetid=None,
                    status=MembershipStatus.ACTIVE if active else MembershipStatus.VALIDATED,
                    equipment_status=EquipmentStatus.LENT if active else EquipmentStatus.PENDING_PROVISIONING,
                    deposit_status=DepositStatus.PAID if active else DepositStatus.NOT_DEPOSITED,
                    address=Address(
                        residence=Residence(addressdata["residence"]),
                        appartement_id=addressdata["name"],
                    ),
                    comment=user["comment"],
                    erdv_id=user["erdv_id"],
                    ref_commande=user["ref_commande"],
                    ref_prestation=user["ref_prestation"],
                    cmd_acces_sent=user["cmd_acces_sent"] == "t",
                    cr_mes_sent=user["cr_mes_sent"] == "t",
                    paid_first_month=user["paid_first_month"] == "t",
                    contract_signed=user["contract_signed"] == "t",
                    appointment=app,
                ),
            )
        )

    print("db.users.insertMany([")
    for user in users:
        print(user.model_dump_json().replace("\"id\"", "\"_id\""))
        print(",")
    print("])")


if "__main__" == __name__:
    convert_csv_to_mongodb_users("/home/severin/db.csv")
