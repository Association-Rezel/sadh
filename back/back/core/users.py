from back.interfaces import User


def get_users(db) -> list[User]:
    return [User(id=1, last_name="Doe", first_name="John"), User(id=2, last_name="Doe", first_name="Jane")]
