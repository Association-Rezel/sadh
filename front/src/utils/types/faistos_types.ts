enum Frequency {
    GHZ_2_4 = "2.4 GHz",
    GHZ_5 = "5 GHz"
}

type WIRED = { type: "WIRED" };
type WIRELESS = { type: "WIRELESS"; frequency?: Frequency };

type ConnectionType = WIRED | WIRELESS;

export enum DeviceState {
    CONNECTED = "CONNECTED",
    SOME_STALE = "SOME_STALE",
    ALL_STALE = "ALL_STALE"
}

export interface ConnectedDevice {
    hostname: string | null;
    mac: string;
    ipv4s: string[];
    ipv6s: string[];
    connection_type: ConnectionType;
    state: DeviceState;
    use_dhcp: boolean;
}