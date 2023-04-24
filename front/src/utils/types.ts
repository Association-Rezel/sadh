export interface User {
    id: number;
    isAdmin: boolean;
    name: string;
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
    fetchOrders(): Promise<Order[]>
}
