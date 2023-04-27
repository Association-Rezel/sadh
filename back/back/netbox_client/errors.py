class NetBoxConnectionError(OSError):
    """Raised when the NetBox API is not reachable."""

    def __init__(self) -> None:
        super().__init__("Can't connect to netbox : maybe the API is down or invalid environment configuration.")
