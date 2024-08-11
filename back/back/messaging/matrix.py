import asyncio
import threading
from typing import List

from nio import AsyncClient

from back.env import ENV


class MatrixClientFactory:
    client: AsyncClient

    async def create_client(self):
        self.client = AsyncClient("https://matrix.rezel.net", ENV.matrix_user)
        await self.client.login(ENV.matrix_password)

    async def get_client(self):
        if not hasattr(self, "client"):
            await self.create_client()

        return self.client


def send_matrix_message(*lines: str) -> None:
    threading.Thread(target=asyncio.run, args=(async_send_matrix_message(*lines),)).start()


async def async_send_matrix_message(*lines: str) -> None:
    matrix_client = MatrixClientFactory()
    client = await matrix_client.get_client()

    await client.room_send(
        room_id=ENV.matrix_room,
        message_type="m.room.message",
        content={
            "format": "org.matrix.custom.html",
            "msgtype": "m.text",
            "body": "\n".join(lines),
            "formatted_body": "\n".join(lines),
        },
    )

    await client.close()
