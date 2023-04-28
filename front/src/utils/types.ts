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


export interface ApiInterface {
    token: string;
    fetchUsers(): Promise<User[]>;
    fetchMe(): Promise<User>;
    fetchOrders(): Promise<Order[]>;
    fetchDevices(): Promise<Device[]>;
    fetchDHCPLeases(): Promise<DHCPLease[]>;
    fetchDHCPLease(id:number): Promise<DHCPLease>;
    addDHCPLease(device:DHCPLease): Promise<void>;
    deleteDHCPLease(id:number): Promise<void>;
}


