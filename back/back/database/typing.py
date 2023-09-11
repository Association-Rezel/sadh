from typing import TYPE_CHECKING, List, Optional

from sqlalchemy.orm import Mapped

from back.database.main import Base

# To avoid circular imports, we mask the type of the mapped columns at runtime.
if TYPE_CHECKING:
    from back.database.appointments import DBAppointment
    from back.database.subscription_flows import DBSubscriptionFlow
    from back.database.subscriptions import DBSubscription
    from back.database.users import DBUser

    MappedSub = Mapped[DBSubscription]
    MappedOptionalSub = Mapped[Optional[DBSubscription]]
    MappedFlow = Mapped[DBSubscriptionFlow]
    MappedAppointments = Mapped[List[DBAppointment]]
    MappedUser = Mapped[DBUser]
else:
    MappedSub = MappedFlow = MappedUser = Mapped[Base]
    MappedOptionalSub = Mapped[Optional[Base]]
    MappedAppointments = Mapped[List[Base]]
