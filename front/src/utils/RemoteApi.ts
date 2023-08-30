import { User, ApiInterface, Order, Device, DHCPLease, Box, PortRule, Subscription, ONT, SubscriptionFlow } from "./types";
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
        return await this.fetchOrDefault("/box/setOpenPort/" + port, null);
    }
    async deleteOpenPort(id: number): Promise<void> {
        return await this.fetchOrDefault("/box/deleteOpenPort/" + id, null);
    }
    async fetchDHCPLeases(): Promise<DHCPLease[]> {
        return await this.fetchOrDefault("/box/dhcpLeases", []);
    }
    async fetchDHCPLease(id: number): Promise<DHCPLease> {
        return await this.fetchOrDefault("/box/dhcpLease/" + id, null);
    }
    async addDHCPLease(device: DHCPLease): Promise<void> {
        return await this.fetchOrDefault("/box/addDhcpLease/" + device, null);
    }
    async deleteDHCPLease(id: number): Promise<void> {
        return await this.fetchOrDefault("/box/deleteDhcpLease/" + id, null);
    }
    token: string;

    async logout(): Promise<void> {
        updateAppState({ logged: false, user: null, token: "" });
    }

    async loginRedirect(redirectUri: string): Promise<void> {
        keycloak.login({ redirectUri: redirectUri });
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
        if (!response.ok) {
            throw new Error("Error while fetching " + url + " : " + response.statusText);
        }
        return await response.json();
    }

    async myAuthenticatedRequest(url: string, body: any, method: string = "POST") {
        if (!this.token)
            throw new Error("Tried to make an authenticated request without being logged in");

        let config: RequestInit = {
            method: method,
            credentials: 'include',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        };

        const response = await fetch(Config.API_URL + url, config);
        if (!response.ok) {
            throw new Error("Error while fetching " + url + " : " + response.statusText);
        }
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
        if (user?.keycloak_id) {
            updateAppState({ user: user });
            this.fetchMySubscription().then((subscription) => {
                updateAppState({ subscription: subscription })
            });
        } else {
            updateAppState({ logged: false, user: null, token: "" });
        }
    }

    async fetchUsers(): Promise<User[]> {
        return await this.fetchOrDefault("/users", null, true);
    }

    async fetchMe(): Promise<User> {
        return await this.fetchOrDefault("/users/me", null, true);
    }

    async fetchMySubscription(): Promise<Subscription> {
        return await this.fetchOrDefault("/users/me/subscription", null, true);
    }

    async addMySubscription(subscription: any): Promise<void> {
        let sub = await this.fetchOrDefault("/users/me/subscription", null, true);
        if (sub) {
            throw new Error("Subscription already exists");
        }
        let response = await this.myAuthenticatedRequest("/users/me/subscription", subscription)
        console.log("Response", response);
    }

    async modifyMySubscription(subscription: any): Promise<void> {
        let sub = await this.fetchOrDefault("/users/me/subscription", null, true);
        if (!sub) {
            throw new Error("Subscription does not exists");
        }
        console.log("Subscription", subscription);
        let response = await this.myAuthenticatedRequest("/users/me/subscription", subscription, "PUT")
        console.log("Response", response);
    }

    async fetchOrders(): Promise<Order[]> {
        return await this.fetchOrDefault("/orders", []);
    }


    async fetchConnectedDevices(): Promise<Device[]> {
        return await this.fetchOrDefault("/box/connectedDevices", []);
    }

    async fetchUser(user_keycloak_id: string): Promise<User> {
        return await this.fetchOrDefault("/users/" + user_keycloak_id, null, true);
    }

    async fetchONT(user_keycloak_id: string): Promise<ONT> {
        return await this.fetchOrDefault("/users/" + user_keycloak_id + "/ont", null, true);
    }

    async fetchSubscription(user_keycloak_id: string): Promise<Subscription> {
        return await this.fetchOrDefault("/users/" + user_keycloak_id + "/subscription", null, true);
    }

    async registerONT(user_keycloak_id: string, serial_number: string, software_version: string): Promise<ONT> {
        return await this.myAuthenticatedRequest("/users/" + user_keycloak_id + "/ont?serial_number=" + serial_number + "&software_version=" + software_version, null, "POST");
    }

    async fetchSubscriptionFlow(subscription_id: string): Promise<SubscriptionFlow> {
        return await this.fetchOrDefault("/subscriptions/" + subscription_id + "/subscription_flow", null, true);
    }

    async modifySubscriptionFlow(subscription_id: string, subscriptionFlow: SubscriptionFlow): Promise<SubscriptionFlow> {
        return await this.myAuthenticatedRequest("/subscriptions/" + subscription_id + "/subscription_flow", subscriptionFlow, "PUT");
    }
}
