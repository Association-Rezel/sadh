export interface User {
    id: number;
    isAdmin: boolean;
}

export interface ApiInterface {
    fetchUsers(): Promise<User[]>;
    fetchMe(): Promise<User>;
}
