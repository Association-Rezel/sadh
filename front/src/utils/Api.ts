import {Config} from "./Config";

export class Api {
    static async fetchUsers() {
        const response = await fetch(Config.API_URL + "/users")
        return await response.json();
    }
}