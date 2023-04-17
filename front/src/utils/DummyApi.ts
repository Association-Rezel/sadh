import {ApiInterface} from "./Api";
import {User} from "./types";

export class DummyApi implements ApiInterface {
    /*
    Implémentation locale de l'API pour les tests
     */
    async fetchUsers(): Promise<User[]> {
        return [{id: 1}, {id: 2}, {id: 3}]
    }
}
