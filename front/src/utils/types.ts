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

export interface ApiInterface {
    fetchUsers(): Promise<User[]>;
    fetchMe(): Promise<User>;
    fetchOrders(): Promise<Order[]>;
    fetchDevices(): Promise<Device[]>;
}

export interface Device {
    id: number;
    name: string;
    description: string;
    ip: string;
    mac: string;
}
