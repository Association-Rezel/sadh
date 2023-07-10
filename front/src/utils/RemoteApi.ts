import { User, ApiInterface, Order, Device, DHCPLease, Box, PortRule } from "./types";
import { Config } from "./Config";
import { getAppState, updateAppState } from "./AppState";
import { keycloak } from "./keycloak";


export class RemoteApi implements ApiInterface {
    [x: string]: any;

    fetchBoxes(): Promise<Box[]> {
        throw new Error("Method not implemented.");
    }
    fetchMyBox(id: number): Promise<Box> {
        throw new Error("Method not implemented.");
    }
    updateMyBox(box: Box): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async fetchOpenPorts(): Promise<PortRule[]> {
        return await this.fetchOrDefault("/box/openPorts", []);
    }
    async setOpenPort(port: PortRule): Promise<void> {
        return await this.fetchOrDefault("/box/setOpenPort/"+port, null);
    }
    async deleteOpenPort(id: number): Promise<void> {
        return await this.fetchOrDefault("/box/deleteOpenPort/"+id, null);
    }
    async fetchDHCPLeases(): Promise<DHCPLease[]> {
        return await this.fetchOrDefault("/box/dhcpLeases", []);
    }
    async fetchDHCPLease(id: number): Promise<DHCPLease> {
        return await this.fetchOrDefault("/box/dhcpLease/"+id, null);
    }
    async addDHCPLease(device: DHCPLease): Promise<void> {
        return await this.fetchOrDefault("/box/addDhcpLease/"+device, null);
    }
    async deleteDHCPLease(id: number): Promise<void> {
        return await this.fetchOrDefault("/box/deleteDhcpLease/"+id, null);
    }
    token: string;

    async logout(): Promise<void> {
        updateAppState({ logged: false, user: null, token: "" });
    }

    async login(): Promise<void> {
        keycloak.login();
    }

    async myFetcher(url: string, auth: boolean = false) {
        let config = undefined;
        if (auth) {
            if (!this.token)
                throw new Error("Tried to make an authenticated request without being logged in");

            config = {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + this.token,
                    'Content-Type': 'application/json'
                }
            };
        }

        const response = await fetch(Config.API_URL + url, config);
        return await response.json();
    }

    async fetchOrDefault<T>(url: string, defaultValue: T, auth: boolean = false): Promise<T> {
        /*
        En cas d'erreur, la valeur par défaut est renvoyée.
         */
        try {
            return await this.myFetcher(url, auth);
        } catch (e) {
            return defaultValue;
        }
    }

    async refreshState() {
        const user = await this.fetchMe();
        console.log("user", user);
        if (user?.id) {
            updateAppState({ user: user })
        } else
            updateAppState({ logged: false, user: null, token: "" });
    }

    async fetchUsers(): Promise<User[]> {
        return await this.fetchOrDefault("/users", []);
    }

    async fetchMe(): Promise<User> {
        return await this.fetchOrDefault("/auth/user", null, true);
    }

    async fetchOrders(): Promise<Order[]> {
        return await this.fetchOrDefault("/orders", []);
    }


    async fetchConnectedDevices(): Promise<Device[]> {
        return await this.fetchOrDefault("/box/connectedDevices", []);
    }
}
