export interface WanIpv4 {
    vlan: number;
    ip: string;
}

export interface WanIpv6 {
    vlan: number;
    ip: string;
}

export interface LanIpv4 {
    address: string;
    vlan: number;
}

export interface UnetNetwork {
    wan_ipv4: WanIpv4;
    wan_ipv6: WanIpv6;
    ipv6_prefix: string;
    lan_ipv4: LanIpv4;
}

export interface WifiDetails {
    ssid: string;
    psk: string;
}

export interface Ipv4Portforwarding {
    wan_port: number;
    lan_ip: string;
    lan_port: number;
    protocol: string;
    name: string;
    desc: string;
}

export interface Ipv6Portopening {
    ip: string;
    port: number;
    protocol: string;
    name: string;
    desc: string;
}

export interface UnetFirewall {
    ipv4_port_forwarding: Ipv4Portforwarding[];
    ipv6_port_opening: Ipv6Portopening[];
}

export interface DnsServers {
    ipv4: string[];
    ipv6: string[];
}

export interface Dhcp {
    dns_servers: DnsServers;
}

export interface UnetProfile {
    unet_id: string;
    network: UnetNetwork;
    wifi: WifiDetails;
    firewall: UnetFirewall;
    dhcp: Dhcp;
}

export interface WanVlan {
    vlan_id: number;
    ipv4_gateway: string;
    ipv6_gateway: string;
}

export interface Box {
    type: string;
    main_unet_id: string;
    mac: string;
    unets: UnetProfile[];
    wan_vlan: WanVlan[];
}