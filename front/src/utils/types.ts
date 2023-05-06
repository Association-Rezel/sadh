export interface User {
    id: number;
    isAdmin: boolean;
    name: string;
    residence: string;
}

export interface Order {
    id: number;
    date: string;
    name: string;
    paymentMethod: string;
    amount: number
}

export interface Device {
    id: number;
    name: string;
    ip: string;
    mac: string;
}

export interface DHCPLease {
    id? : number;
    name: string;
    description: string;
    ip: string;
    mac: string;
}

export interface Box {
    id: number;
    ip: string;
    owner: User;
    SSID: string;
    passwordHash: string;
    connectedDevices: number;
    openPorts: PortRule[];
}

export interface PortRule {
    id: number;
    service: string;
    internPort: number;
    externPort: number;
    protocol: string;
    isActive: boolean;
}


export interface ApiInterface {
    [x: string]: any;
    logout(): void;
    login(): void;
    refreshState(): unknown;
    token: string;
    fetchUsers(): Promise<User[]>;
    fetchBoxes(): Promise<Box[]>;
    fetchMyBox(id: number): Promise<Box>;
    updateMyBox(box: Box): Promise<void>;
    fetchMe(): Promise<User>;
    fetchOrders(): Promise<Order[]>;
    fetchDHCPLeases(): Promise<DHCPLease[]>;
    fetchDHCPLease(id:number): Promise<DHCPLease>;
    addDHCPLease(device:DHCPLease): Promise<void>;
    deleteDHCPLease(id:number): Promise<void>;
    fetchConnectedDevices(): Promise<Device[]>;
    fetchOpenPorts(): Promise<PortRule[]>;
    addOpenPort(port:PortRule): Promise<void>;
}


