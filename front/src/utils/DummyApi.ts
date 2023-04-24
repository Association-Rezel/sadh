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
                name: "toto",
                residence: "Kley",
            },
            {
                id: 2,
                isAdmin: false,
                name: "tata",
                residence: "Kley",
            },
            {
                id: 3,
                isAdmin: false,
                name: "tutu",
                residence: "ALJT",
            },
        ];
    }
    async fetchMe(): Promise<User> {
        return {
            id: 7897,
            isAdmin: true, // TODO change to an admin
            name: "itsme",
            residence: "Kley",
        };
    }
}
