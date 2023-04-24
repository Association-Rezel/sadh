import { Config } from "./Config";
import { User, ApiInterface, Order } from "./types";

const myFetcher = async (url: string) => {
    const response = await fetch(Config.API_URL + url);
    return await response.json();
};

export class RemoteApi implements ApiInterface {
    async fetchUsers(): Promise<User[]> {
        try {
            return await myFetcher("/users");
        } catch (e) {
            return [];
        }
    }
    async fetchMe(): Promise<User> {
        try {
            return await myFetcher("/user");
        } catch (e) {
            return null;
        }
    }
    async fetchOrders(): Promise<Order[]> {
        try {
            return await myFetcher("/orders");
        } catch (e) {
            return [];
        }
    }
}
