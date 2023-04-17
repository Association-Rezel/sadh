from os import getenv
from back.interfaces import User


class Core:
    users: list[User]

    def __init__(self) -> None:
        if getenv("DEV"):
            self.users = [User(user_id="1")]
        else:
            self.users = []

    def get_users(self) -> list[User]:
        return self.users
