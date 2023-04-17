import {Config} from "./Config";
import {User} from "./types";

export class RemoteApi {
    async fetchUsers(): Promise<User[]> {
        const response = await fetch(Config.API_URL + "/users")
        return await response.json();
    }
}