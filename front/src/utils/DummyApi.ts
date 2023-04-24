import { User, ApiInterface, Order } from "./types";

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
            },
            {
                id: 2,
                isAdmin: false,
                name: "tata",
            },
            {
                id: 3,
                isAdmin: false,
                name: "tutu",
            },
        ];
    }
    async fetchMe(): Promise<User> {
        return {
            id: 7897,
            isAdmin: true, // TODO change to an admin
            name: "itsme",
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
}
