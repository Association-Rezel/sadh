import asyncio
import threading
from typing import List

from nio import AsyncClient

from back.env import ENV


def send_matrix_message(*lines: str) -> None:
    threading.Thread(
        target=asyncio.run, args=(async_send_matrix_message(*lines),)
    ).start()


async def async_send_matrix_message(*lines: str) -> None:
    client = AsyncClient("https://matrix.rezel.net", ENV.matrix_user)
    await client.login(ENV.matrix_password)

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
