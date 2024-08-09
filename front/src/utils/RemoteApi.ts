import { User, ApiInterface, Membership, AppointmentSlot, Appointment, CommandeAccesInfo, CRMiseEnService, MembershipRequest } from "./types/types";
import { Config } from "./Config";
import { ONTInfos, PMInfos, RegisterONT } from "./types/pon_types";
import { Box } from "./types/hermes_types";


export class RemoteApi implements ApiInterface {
    token: string;

    async refreshToken() {
        // If token is not set, ZitadelContext has not set this method
        if (this.token === undefined) {
            return;
        }

        // Should have been defined by ZitadelAuthContext
        throw new Error("refreshToken not implemented");
    }

    async myFetcher(url: string, auth: boolean = false, rawResponse: boolean = false, isRetry: boolean = false) {
        let config = undefined;
        if (auth) {
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
        if(response.status === 401 && !isRetry) {
            await this.refreshToken();
            return this.myFetcher(url, auth, rawResponse, true);
        }

        if (rawResponse) {
            return response;
        }

        if (!response.ok) {
            throw new Error("Error while fetching " + url + " : " + response.statusText);
        }
        return await response.json();
    }

    async myAuthenticatedRequest(url: string, body: any, method: string = "POST", rawResponse: boolean = false, isRetry: boolean = false) {
        let config: RequestInit = {
            method: method,
            credentials: 'include',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body, (_key, value) => (value instanceof Set ? [...value] : value)),
        };

        const response = await fetch(Config.API_URL + url, config);

        if(response.status === 401 && !isRetry) {
            await this.refreshToken();
            return this.myAuthenticatedRequest(url, body, method, rawResponse, true);
        }

        if (rawResponse) {
            return response;
        }

        if (!response.ok) {
            throw new Error("Error while fetching " + url + " : " + response.statusText);
        }
        return await response.json();
    }

    async uploadFile(url: string, data: FormData, isRetry: boolean = false) {
        let config: RequestInit = {
            method: "POST",
            credentials: 'include',
            headers: {
                'Authorization': 'Bearer ' + this.token,
            },
            body: data,
        };

        const response = await fetch(Config.API_URL + url, config);

        if (response.status === 401 && !isRetry) {
            await this.refreshToken();
            return this.uploadFile(url, data, true);
        }

        if (!response.ok) {
            throw new Error("Error while fetching " + url + " : " + response.statusText);
        }
        return await response.json();
    }

    async fetchFile(url: string, isRetry: boolean = false): Promise<Blob> {
        const config: RequestInit = {
            method: "GET",
            credentials: 'include',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            },
        };

        const response = await fetch(Config.API_URL + url, config);

        if (response.status === 401 && !isRetry) {
            await this.refreshToken();
            return this.fetchFile(url, true);
        }

        if (!response.ok) {
            throw new Error("Error while fetching " + url + " : " + response.statusText);
        }
        return await response.blob();
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

    parseAppointmentSlot(data: any): AppointmentSlot {
        if (data !== null) {
            data.start = new Date(Date.parse(data.start));
            data.end = new Date(Date.parse(data.end));
        }

        return data;
    }

    parseAppointment(data: any): Appointment {
        if (data !== null) {
            data.slot = this.parseAppointmentSlot(data.slot);
        }

        return data;
    }

    parseUser(data: any): User {
        if (data?.availability_slots) {
            data.availability_slots = data.availability_slots.map((slot: any) => this.parseAppointmentSlot(slot));
        }

        if (data?.membership?.appointment) {
            data.membership.appointment = this.parseAppointment(data.membership.appointment);
        }

        return data;
    }

    async fetchMe(): Promise<User> {
        return this.parseUser(await this.fetchOrDefault("/users/me", null, true));
    }

    async submitMyMembershipRequest(request: MembershipRequest): Promise<User> {
        return this.parseUser(await this.myAuthenticatedRequest("/users/me/membershipRequest", request, "POST"));
    }

    async fetchAppointmentSlots(weekOffset: number): Promise<AppointmentSlot[][]> {
        const data = await this.myFetcher("/appointments/weekSlots?weekOffset=" + weekOffset, true);
        return data.map((week: any) => week.map((slot: any) => this.parseAppointmentSlot(slot)));
    }

    async updateMyAvailabilities(availabilities: AppointmentSlot[]): Promise<User> {
        return this.parseUser(await this.myAuthenticatedRequest("/users/me/availability", availabilities, "POST"));
    }

    // ADMIN

    async fetchUsers(): Promise<User[]> {
        const users = await this.fetchOrDefault("/users", null, true);
        return users.map((user: any) => this.parseUser(user));
    }

    async fetchUser(user_zitadel_sub: string): Promise<User> {
        return this.parseUser(await this.fetchOrDefault("/users/" + user_zitadel_sub, null, true));
    }

    async fetchPMs(): Promise<PMInfos[]> {
        return await this.fetchOrDefault("/pms", [], true);
    }

    async fetchONT(user_zitadel_sub: string): Promise<ONTInfos> {
        return await this.fetchOrDefault("/users/" + user_zitadel_sub + "/ont", null, true);
    }

    async registerONT(user_zitadel_sub: string, register: RegisterONT): Promise<ONTInfos> {
        return await this.myAuthenticatedRequest("/users/" + user_zitadel_sub + "/ont", register, "POST");
    }

    async updateUser(user_zitadel_sub: string, update: Partial<User>): Promise<User> {
        return this.parseUser(await this.myAuthenticatedRequest(`/users/${user_zitadel_sub}`, update, "PATCH"));
    }

    async updateMembership(user_zitadel_sub: string, membership: Partial<Membership>): Promise<User> {
        return this.parseUser(await this.myAuthenticatedRequest(`/users/${user_zitadel_sub}/membership`, membership, "PATCH"));
    }

    async fetchUserBox(user_zitadel_sub: string): Promise<Box> {
        return await this.fetchOrDefault("/users/" + user_zitadel_sub + "/box", null, true);
    }

    async registerUserBox(user_zitadel_sub: string, box_type: string, mac_address: string, telecomian: boolean): Promise<Box> {
        return await this.myAuthenticatedRequest("/users/" + user_zitadel_sub + "/box?box_type=" + box_type + "&mac_address=" + mac_address + "&telecomian=" + telecomian, null, "POST");
    }

    async sendCommandeAccesInfo(info: CommandeAccesInfo): Promise<Response> {
        return await this.myAuthenticatedRequest("/nix/generer_commande_acces", info, "POST", true);
    }

    async sendCRMiseEnService(info: CRMiseEnService): Promise<Response> {
        return await this.myAuthenticatedRequest("/nix/generer_cr_mise_en_service", info, "POST", true);
    }
}
