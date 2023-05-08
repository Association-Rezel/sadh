class NetBoxConnectionError(OSError):
    """Raised when the NetBox API is not reachable."""

    def __init__(self) -> None:
        super().__init__("Can't connect to netbox : maybe the API is down or invalid environment configuration.")


class DifferentIpTypeError(ValueError):
    """Raised when two ips types are not the same."""

    def __init__(self, x: str, y: str) -> None:
        super().__init__(f"{x} and {y} must be of the same type")


class PortOutOfRangeError(ValueError):
    """Raised port not in [1 - 65535]."""

    def __init__(self, value: int) -> None:
        super().__init__(f"Port must be in in [1 - 65535] : Got {value}.")
