import {ApiInterface, Device, Order, User} from "./types";
import {updateAppState} from "./AppState";


/*
    Implémentation locale de l'API pour les tests
*/
export class DummyApi implements ApiInterface {
    token: string;

    async logout(): Promise<void> {
        updateAppState({logged: false, user: null, token: ""});
    }

    async login(): Promise<void> {
        updateAppState({logged: true, user: await this.fetchMe(), token: "token-keycloak-dummy"});
    }

    refreshState(): void {
    }

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
            isAdmin: true,
            name: "itsme",
            residence: "Kley",
        };
    }

    async fetchOrders(): Promise<Order[]> {
        return [
            {
                id: 1,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 2,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 3,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 4,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 5,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 6,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
        ];
    }

    async fetchDevices(): Promise<Device[]> {
        return [
            {
                id: 1,
                name: "Device 1",
                description: "Description 1",
                ip: "255:255:255:255",
                mac: "00:00:00:00:00:00",
            },
            {
                id: 2,
                name: "Device 2",
                description: "Description 2 blalfl lkfld kld d lkdlf",
                ip: "255:255:255:2",
                mac: "00:00:00:00:00:01",
            },
        ]
    }

}
