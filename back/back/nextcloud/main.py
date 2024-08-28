"""Nextcloud main module."""


import os
import tempfile

import nextcloud_client

from back.env import ENV


class NextCloudClient:
    """Nextcloud client."""

    def __init__(self) -> None:
        """Nextcloud client."""
        self.nc = nextcloud_client.Client.from_public_link(
            ENV.nextcloud_share_url, ENV.nextcloud_share_password
        )

    def put_file(self, filename: str) -> None:
        """Put file content."""
        sended = 5
        ex = None
        while sended > 0:
            try:
                self.nc.drop_file(filename)
                sended = 0
            except Exception as e:
                sended -= 1
                ex = e
        if ex is not None:
            raise ex

    def get_file(self, filename: str) -> tuple[str, tempfile.TemporaryDirectory]:
        """Get file filename in a temporary file."""
        tmp_dir = tempfile.TemporaryDirectory()
        tmp_filename = os.path.join(tmp_dir.name, filename)
        self.nc.get_file(filename, tmp_filename)
        return tmp_filename, tmp_dir
