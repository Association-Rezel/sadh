import asyncio
from collections.abc import Awaitable, Callable

from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from pymongo import ReturnDocument

from back.core.hermes import get_box_from_user
from back.core.pon import get_ont_from_box
from back.messaging.mails import send_email_validated, send_mail_appointment_validated
from back.mongodb.user_models import DepositStatus, MembershipStatus, User


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
        from_status: MembershipStatus,
        to_status: MembershipStatus,
        conditions: list[StatusUpdateCondition],
        effects: list[StatusUpdateEffect],
    ) -> None:
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

        called_conditions = [
            condition.condition(user, db) for condition in self.conditions
        ]

        # Now await the coroutines
        for i, condition in enumerate(called_conditions):
            if asyncio.iscoroutine(condition):
                called_conditions[i] = await condition

        # Return the list of conditions that failed
        return [
            self.conditions[i]
            for i, condition in enumerate(called_conditions)
            if not condition
        ]

    async def apply_effects(self, user: User, db: AsyncIOMotorDatabase) -> User:
        """
        Apply the effects of the status update.

        Returns the updated user after the effects have been applied.
        """
        for effect in self.effects:
            result = effect.effect(user, db)
            # If this is a coroutine, await it
            if asyncio.iscoroutine(result):
                result = await result

            # If the effect updated the user, update the user object
            if isinstance(result, User):
                user = result

        return user


class StatusUpdateInfo(BaseModel):
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
        self.register_update(
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
                    "La cotisation pour le premier mois a été payée",
                    lambda user, _: (
                        user.membership.paid_first_month if user.membership else False
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
                    "Passage de l'adhésion à l'état VALIDATED",
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
                    lambda user, _: send_email_validated(user),
                ),
            ],
        )

        self.register_update(
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
            ],
            [
                StatusUpdateEffect(
                    "Passage de l'adhésion à l'état SENT_CMD_ACCES",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.SENT_CMD_ACCES
                    ),
                ),
                StatusUpdateEffect(
                    "Le CMD ACCES doit être généré et envoyé MANUELLEMENT. Aucune action automatique n'est prévue.",
                    lambda user, db: None,
                ),
            ],
        )

        self.register_update(
            MembershipStatus.SENT_CMD_ACCES,
            MembershipStatus.APPOINTMENT_VALIDATED,
            [
                StatusUpdateCondition(
                    "⚠️ Vérifier MANUELLEMENT que le CrCMD a été reçu",
                    lambda user, _: True,
                ),
            ],
            [
                StatusUpdateEffect(
                    "Passage de l'adhésion à l'état APPOINTMENT_VALIDATED",
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
                    "Passage de l'adhésion à l'état ACTIVE",
                    lambda user, db: _update_membership_status(
                        db, user, MembershipStatus.ACTIVE
                    ),
                ),
            ],
        )

    def register_update(
        self,
        from_status: MembershipStatus,
        to_status: MembershipStatus,
        conditions: list[StatusUpdateCondition],
        effects: list[StatusUpdateEffect],
    ):
        self.updates.append(StatusUpdate(from_status, to_status, conditions, effects))

    def get_possible_updates_from(
        self, from_status: MembershipStatus
    ) -> list[StatusUpdate]:
        return [update for update in self.updates if update.from_status == from_status]


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
