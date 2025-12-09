from common_models.user_models import User
from motor.motor_asyncio import AsyncIOMotorDatabase


async def get_all_scholarship_students(db: AsyncIOMotorDatabase) -> list[User]:
    """
    Returns all users that are scholarship students
    """
    users = [
        User.model_validate(user)
        for user in await db.users.find({"scholarship_student": True}).to_list(None)
    ]
    return users


async def reset_all_scholarship_students(db: AsyncIOMotorDatabase) -> None:
    """
    Reset all scholarship students
    """
    await db.users.update_many(
        {"scholarship_student": True}, {"$set": {"scholarship_student": False}}
    )
