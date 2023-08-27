"""Netbox client errors."""


class NetBoxConnectionError(OSError):
    """Raised when the NetBox API is not reachable."""

    def __init__(self) -> None:
        """Raised when the NetBox API is not reachable."""
        super().__init__("Can't connect to netbox : maybe the API is down or invalid environment configuration.")


class DifferentIpTypeError(ValueError):
    """Raised when two ips types are not the same."""

    def __init__(self, x: str, y: str) -> None:
        """Raised when two ips types are not the same."""
        super().__init__(f"{x} and {y} must be of the same type")


class PortOutOfRangeError(ValueError):
    """Raised port not in [1 - 65535]."""

    def __init__(self, value: int) -> None:
        """Raised port not in [1 - 65535]."""
        super().__init__(f"Port must be in in [1 - 65535] : Got {value}.")


class UnexpectedNetboxSchemaError(ValueError):
    """Raised when the NetBox schema is not consistent with what we expect."""

    def __init__(self, description: str) -> None:
        """Raised when the NetBox schema is not consistent with what we expect."""
        super().__init__(f"Unexpected netbox schema : {description}")
