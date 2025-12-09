import asyncio
from collections.abc import Awaitable, Callable
from datetime import datetime

from common_models.base import RezelBaseModel
from common_models.hermes_models import Box
from common_models.user_models import (
    DepositStatus,
    MembershipStatus,
    MembershipType,
    User,
)
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from back.core.dolibarr import create_dolibarr_user
from back.core.hermes import get_box_from_user, get_users_on_box
from back.core.ipam_logging import IpamLog, create_log
from back.core.pon import get_ont_from_box
from back.messaging.mails import (
    send_email_validated_ftth,
    send_email_validated_wifi,
    send_mail_appointment_validated,
    send_mail_new_adherent_on_box,
    send_mail_no_more_wifi_on_box,
    send_satisfaction_survey,
)
from back.messaging.matrix import send_matrix_message


class StatusUpdateEffect:
    description: str
    effect: Callable[[User, AsyncIOMotorDatabase], Awaitable[User | None] | None]

    def __init__(
        self,
        description: str,
        effect: Callable[[User, AsyncIOMotorDatabase], Awaitable[User | None] | None],
    ) -> None:
        self.description = description
        self.effect = effect


class StatusUpdateCondition:
    description: str
    condition: Callable[[User, AsyncIOMotorDatabase], Awaitable[bool] | bool]

    def __init__(
        self,
        description: str,
        condition: Callable[[User, AsyncIOMotorDatabase], Awaitable[bool] | bool],
    ) -> None:
        self.description = description
        self.condition = condition


class StatusUpdate:
    def __init__(
        self,
        membership_type: MembershipType,
        from_status: MembershipStatus,
        to_status: MembershipStatus,
        conditions: list[StatusUpdateCondition],
        effects: list[StatusUpdateEffect],
    ) -> None:
        self.membership_type = membership_type
        self.from_status = from_status
        self.to_status = to_status
        self.conditions = conditions
        self.effects = effects

    async def check_conditions(
        self, user: User, db: AsyncIOMotorDatabase
    ) -> list[StatusUpdateCondition]:
        """
        Check the conditions for the status update to be possible.
        Returns a list of conditions that failed.
        """
        if user.membership is None:
            return [
                StatusUpdateCondition("User has no membership", lambda _, __: False)
            ]

        if user.membership.status != self.from_status:
            return [
                StatusUpdateCondition(
                    "User is not in the correct status", lambda _, __: False
                )
            ]

        not_met = []

        for condition in self.conditions:
            try:
                result = condition.condition(user, db)
                # If this is a coroutine, await it
                if asyncio.iscoroutine(result):
                    result = await result

                if not result:
                    not_met.append(condition)

            except Exception as e:
                send_matrix_message(
                    f"❌ Erreur lors de la vérification des conditions pour {user.email}",
                    f"Condition : {condition.description}",
                    f"Erreur : {e}",
                )
                raise e

        # Return the list of conditions that failed
        return not_met

    async def apply_effects(self, user: User, db: AsyncIOMotorDatabase) -> User:
        """
        Apply the effects of the status update.

        Returns the updated user after the effects have been applied.
        """
        run_effects = []
        for effect in self.effects:
            try:
                result = effect.effect(user, db)
                # If this is a coroutine, await it
                if asyncio.iscoroutine(result):
                    result = await result

                # If the effect updated the user, update the user object
                if isinstance(result, User):
                    user = result

                run_effects.append(effect)
            except Exception as e:
                send_matrix_message(
                    f"❌ Erreur lors de l'application de l'effet pour {user.email}",
                    f"Effet : {effect.description}",
                    "Les effets suivants ont été appliqués :",
                    *[f"  ✔️ {effect.description}" for effect in run_effects],
                    "Les effets suivants n'ont PAS été appliqués :",
                    *[
                        f"  ❌ {effect.description}"
                        for effect in self.effects
                        if effect not in run_effects
                    ],
                    f"Erreur : {e}",
                )
                raise e

        return user


class StatusUpdateInfo(RezelBaseModel):
    from_status: MembershipStatus
    to_status: MembershipStatus
    conditions: list[str]
    conditions_not_met: list[str]
    effects: list[str]

    @staticmethod
    async def from_status_update(
        db: AsyncIOMotorDatabase, user: User, update: StatusUpdate
    ) -> "StatusUpdateInfo":
        return StatusUpdateInfo(
            from_status=update.from_status,
            to_status=update.to_status,
            conditions=[condition.description for condition in update.conditions],
            effects=[effect.description for effect in update.effects],
            conditions_not_met=[
                condition.description
                for condition in await update.check_conditions(user, db)
            ],
        )


class StatusUpdateManager:
    updates: list[StatusUpdate]

    def __init__(self) -> None:
        self.updates = []

        ###############################################
        # FTTH

        self.register_update(
            MembershipType.FTTH,
            MembershipStatus.REQUEST_PENDING_VALIDATION,
            MembershipStatus.VALIDATED,
            [
                StatusUpdateCondition(
                    "La caution a été payée",
                    lambda user, _: (
                        user.membership.deposit_status == DepositStatus.PAID
                        if user.membership
                        else False
                    ),
                ),
                StatusUpdateCondition(
                    "L'abonnement pour le premier mois a été payée",
                    lambda user, _: (
                        user.membership.paid_first_month if user.membership else False
                    ),
                ),
                StatusUpdateCondition(
                    "La cotisation a été payée",
                    lambda user, _: (
                        user.membership.paid_membership if user.membership else False
                    ),
                ),
                StatusUpdateCondition(
                    "Le contrat a été signé",
                    lambda user, _: (
                        user.membership.contract_signed if user.membership else False
                    ),
                ),
            ],
            [
                StatusUpdateEffect(
                    "Passage de l'abonnement à l'état VALIDATED",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.VALIDATED
                    ),
                ),
                StatusUpdateEffect(
                    " ".join(
                        [
                            "Envoi d'un email pour demander de renseigner les disponibilités",
                            "pour le créneau de rendez-vous, ainsi que de venir récupèrer les",
                            "équipements",
                        ]
                    ),
                    lambda user, _: send_email_validated_ftth(user),
                ),
                StatusUpdateEffect(
                    "Ajout de l'adhérent dans dolibarr",
                    create_dolibarr_user,
                ),
            ],
        )

        self.register_update(
            MembershipType.FTTH,
            MembershipStatus.VALIDATED,
            MembershipStatus.SENT_CMD_ACCES,
            [
                StatusUpdateCondition(
                    "L'utilisateur a un ONT assigné",
                    _check_user_has_ont,
                ),
                StatusUpdateCondition(
                    "L'utilisateur a une box assignée",
                    _check_user_has_box,
                ),
                StatusUpdateCondition(
                    "L'utilisateur a un ID e-rdv",
                    lambda user, _: bool(user.membership and user.membership.erdv_id),
                ),
                StatusUpdateCondition(
                    "L'utilisateur a un rendez-vous validé",
                    lambda user, _: bool(
                        user.membership and user.membership.appointment
                    ),
                ),
                StatusUpdateCondition(
                    "Le CMD_ACCES a été envoyé (manuellement)",
                    lambda user, _: bool(
                        user.membership and user.membership.cmd_acces_sent
                    ),
                ),
            ],
            [
                StatusUpdateEffect(
                    "Passage de l'abonnement à l'état SENT_CMD_ACCES",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.SENT_CMD_ACCES
                    ),
                ),
            ],
        )

        self.register_update(
            MembershipType.FTTH,
            MembershipStatus.SENT_CMD_ACCES,
            MembershipStatus.APPOINTMENT_VALIDATED,
            [
                StatusUpdateCondition(
                    "⚠️ Vérifier MANUELLEMENT que le CrCMD a été reçu",
                    lambda user, _: True,
                ),
                StatusUpdateCondition(
                    "Ref prestation Orange renseignée (VIAxxxx)",
                    lambda user, _: bool(
                        user.membership and user.membership.ref_prestation
                    ),
                ),
            ],
            [
                StatusUpdateEffect(
                    "Passage de l'abonnement à l'état APPOINTMENT_VALIDATED",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.APPOINTMENT_VALIDATED
                    ),
                ),
                StatusUpdateEffect(
                    " ".join(
                        [
                            "Envoi d'un email pour expliquer le déroulé de l'intervention,",
                            "indiquer la position au PM et le mot de passe du Wi-Fi",
                        ]
                    ),
                    send_mail_appointment_validated,
                ),
            ],
        )

        self.register_update(
            MembershipType.FTTH,
            MembershipStatus.APPOINTMENT_VALIDATED,
            MembershipStatus.ACTIVE,
            [
                StatusUpdateCondition(
                    "⚠️ Vérifier MANUELLEMENT que l'adhérent a bien accès à Internet",
                    lambda user, _: True,
                ),
            ],
            [
                StatusUpdateEffect(
                    "Passage de l'abonnement à l'état ACTIVE",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.ACTIVE
                    ),
                ),
                StatusUpdateEffect(
                    "Mise à jour de la date de début d'abonnement à aujourd'hui",
                    _set_adhesion_date_today,
                ),
            ],
        )

        self.register_update(
            MembershipType.FTTH,
            MembershipStatus.ACTIVE,
            MembershipStatus.PENDING_INACTIVE,
            [],
            [
                StatusUpdateEffect(
                    "Passage de l'abonnement à l'état PENDING_INACTIVE",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.PENDING_INACTIVE
                    ),
                ),
            ],
        )

        self.register_update(
            MembershipType.FTTH,
            MembershipStatus.PENDING_INACTIVE,
            MembershipStatus.INACTIVE,
            [],
            [
                StatusUpdateEffect(
                    "Passage de l'abonnement à l'état INACTIVE",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.INACTIVE
                    ),
                ),
                StatusUpdateEffect(
                    "Envoi d'un questionnaire de satisfaction",
                    lambda user, _: send_satisfaction_survey(user),
                ),
                StatusUpdateEffect(
                    "Mise à jour du statut d'étudiant boursier à False",
                    _set_scholarship_student_to_false,
                ),
            ],
        )

        ###############################################
        # WIFI

        self.register_update(
            MembershipType.WIFI,
            MembershipStatus.REQUEST_PENDING_VALIDATION,
            MembershipStatus.ACTIVE,
            [
                StatusUpdateCondition(
                    "L'abonnement pour le premier mois a été payée",
                    lambda user, _: (
                        user.membership.paid_first_month if user.membership else False
                    ),
                ),
                StatusUpdateCondition(
                    "La cotisation a été payée",
                    lambda user, _: (
                        user.membership.paid_membership if user.membership else False
                    ),
                ),
                StatusUpdateCondition(
                    "Le contrat a été signé",
                    lambda user, _: (
                        user.membership.contract_signed if user.membership else False
                    ),
                ),
                StatusUpdateCondition(
                    "L'utilisateur a un unet assigné",
                    lambda user, _: bool(user.membership and user.membership.unetid),
                ),
            ],
            [
                StatusUpdateEffect(
                    "Passage de l'abonnement à l'état ACTIVE",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.ACTIVE
                    ),
                ),
                StatusUpdateEffect(
                    " ".join(
                        [
                            "Envoi d'un email au PROPRIETAIRE de la box",
                            "pour l'informer qu'un autre Wi-Fi a été configuré pour un",
                            "nouvel adhérent, et lui indiquant de ne plus éteindre la box.",
                        ]
                    ),
                    send_mail_new_adherent_on_box,
                ),
                StatusUpdateEffect(
                    " ".join(
                        [
                            "Envoi d'un email à l'adhérent pour lui indiquer",
                            "le SSID et le mot de passe du nouveau Wi-Fi.",
                        ]
                    ),
                    send_email_validated_wifi,
                ),
                StatusUpdateEffect(
                    "Ajout de l'adhérent dans dolibarr",
                    create_dolibarr_user,
                ),
            ],
        )

        self.register_update(
            MembershipType.WIFI,
            MembershipStatus.ACTIVE,
            MembershipStatus.INACTIVE,
            [
                StatusUpdateCondition(
                    "L'utilisateur a un UNetProfile assigné",
                    lambda user, _: user.membership is not None
                    and user.membership.unetid is not None,
                )
            ],
            [
                StatusUpdateEffect(
                    "Passage de l'abonnement à l'état INACTIVE",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.INACTIVE
                    ),
                ),
                StatusUpdateEffect(
                    " ".join(
                        [
                            "S'il s'agit du dernier adhérent Wi-Fi sur la box,",
                            "envoi d'un email au PROPRIETAIRE de la box pour lui indiquer",
                            "qu'il n'y a plus personne (donc plus de remboursement partiel)",
                        ]
                    ),
                    _send_mail_if_no_more_wifi_on_box,
                ),
                StatusUpdateEffect(
                    "Suppression du UNetProfile de l'adhérent",
                    delete_unet_of_wifi_adherent,
                ),
                StatusUpdateEffect(
                    "Envoi d'un questionnaire de satisfaction",
                    lambda user, _: send_satisfaction_survey(user),
                ),
                StatusUpdateEffect(
                    "Mise à jour du statut d'étudiant boursier à False",
                    _set_scholarship_student_to_false,
                ),
            ],
        )

    def register_update(
        self,
        membership_type: MembershipType,
        from_status: MembershipStatus,
        to_status: MembershipStatus,
        conditions: list[StatusUpdateCondition],
        effects: list[StatusUpdateEffect],
    ):
        self.updates.append(
            StatusUpdate(
                membership_type,
                from_status,
                to_status,
                conditions,
                effects,
            )
        )

    def get_possible_updates_from(
        self,
        membership_type: MembershipType,
        from_status: MembershipStatus,
    ) -> list[StatusUpdate]:
        return [
            update
            for update in self.updates
            if update.from_status == from_status
            and membership_type in update.membership_type
        ]


async def _check_user_has_box(user: User, db: AsyncIOMotorDatabase) -> bool:
    return bool(await get_box_from_user(db, user))


async def _check_user_has_ont(user: User, db: AsyncIOMotorDatabase) -> bool:
    box = await get_box_from_user(db, user)
    if not box:
        return False
    return bool(await get_ont_from_box(db, box))


async def _update_membership_status(
    db: AsyncIOMotorDatabase, user: User, status: MembershipStatus
) -> User:
    if not user.membership:
        raise ValueError("User has no membership")

    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$set": {"membership.status": status}},
        return_document=ReturnDocument.AFTER,
    )

    return User.model_validate(userdict)


async def _send_mail_if_no_more_wifi_on_box(
    user: User, db: AsyncIOMotorDatabase
) -> None:
    boxdict = await get_box_from_user(db, user)
    if not boxdict:
        raise ValueError("User has no box")

    box = Box.model_validate(boxdict)

    if len(box.unets) == 2:  # Main unet + user who will become inactive
        send_mail_no_more_wifi_on_box((await get_users_on_box(db, box))[0])


async def delete_unet_of_wifi_adherent(user: User, db: AsyncIOMotorDatabase) -> None:
    if (
        not user.membership
        or not user.membership.unetid
        or user.membership.type != MembershipType.WIFI
    ):
        raise ValueError("User has no membership or no unetid or not a WIFI membership")

    boxdict = await db.boxes.find_one({"unets.unet_id": user.membership.unetid})
    if not boxdict:
        raise ValueError("User has no box")
    box = Box.model_validate(boxdict)

    Box.model_validate(
        await db.boxes.find_one_and_update(
            {"mac": str(box.mac)},
            {"$pull": {"unets": {"unet_id": user.membership.unetid}}},
            return_document=ReturnDocument.AFTER,
        )
    )

    await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$unset": {"membership.unetid": ""}},
    )

    # Log the deletion of the unet and freeing of the IP addresses and blocks
    deleted_unet = next(
        unet for unet in box.unets if unet.unet_id == user.membership.unetid
    )
    await create_log(
        db,
        IpamLog(
            timestamp=datetime.now(),
            source="sadh-back",
            message=" ".join(
                [
                    f"Deleted Unet {user.membership.unetid} which had {deleted_unet.network.wan_ipv4.ip}",
                    f"and {deleted_unet.network.ipv6_prefix} assigned.",
                ]
            ),
        ),
    )

    main_unet_user = User.model_validate(
        await db.users.find_one({"membership.unetid": box.main_unet_id})
    )
    if main_unet_user.membership and main_unet_user.membership.attached_wifi_adherents:
        for attached_wifi_adherent in main_unet_user.membership.attached_wifi_adherents:
            if attached_wifi_adherent.user_id == user.id:
                attached_wifi_adherent.to_date = datetime.today()

        await db.users.find_one_and_update(
            {"_id": str(main_unet_user.id)},
            {
                "$set": {
                    "membership.attached_wifi_adherents": [
                        adh.model_dump(mode="json")
                        for adh in main_unet_user.membership.attached_wifi_adherents
                    ],
                }
            },
        )


async def _set_adhesion_date_today(user: User, db: AsyncIOMotorDatabase) -> User:
    if not user.membership:
        raise ValueError("User has no membership")
    user.membership.start_date = datetime.now()
    await db.users.update_one(
        {"_id": str(user.id)},
        {"$set": {"membership.start_date": user.membership.start_date}},
    )
    return user


async def _set_scholarship_student_to_false(
    user: User, db: AsyncIOMotorDatabase
) -> User:
    if not user.membership:
        raise ValueError("User has no membership")
    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$set": {"scholarship_student": False}},
        return_document=ReturnDocument.AFTER,
    )
    return User.model_validate(userdict)
