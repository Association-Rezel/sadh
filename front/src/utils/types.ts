export interface User {
    id: number;
    isAdmin: boolean;
    name: string;
    residence: string;
}

export interface ApiInterface {
    fetchUsers(): Promise<User[]>;
    fetchMe(): Promise<User>;
}
