import { User, ApiInterface } from "./types";

export class DummyApi implements ApiInterface {
    /*
    Implémentation locale de l'API pour les tests
     */
    async fetchUsers(): Promise<User[]> {
        return [
            {
                id: 1,
                isAdmin: false,
            },
            {
                id: 2,
                isAdmin: false,
            },
            {
                id: 3,
                isAdmin: false,
            },
        ];
    }
    async fetchMe(): Promise<User> {
        return {
            id: 7897,
            isAdmin: true, // TODO change to an admin
        };
    }
}
