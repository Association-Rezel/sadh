export interface User {
    id: number;
    isAdmin: boolean;
    name: string;
}

export interface ApiInterface {
    fetchUsers(): Promise<User[]>;
    fetchMe(): Promise<User>;
}
