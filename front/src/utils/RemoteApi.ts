import { User, ApiInterface, Membership, AppointmentSlot, Appointment, CommandeAccesInfo, CRMiseEnService, MembershipRequest, StatusUpdateInfo, MembershipStatus } from "./types/types";
import { Config } from "./Config";
import { ONTInfo, PMInfo, RawDBONT, RegisterONT } from "./types/pon_types";
import { Box, UnetProfile } from "./types/hermes_types";
import { IpamLog } from "./types/log_types";

const jsonReplacer = (_key: string, value: any) => {
    if (value instanceof Set) {
        return [...value];
    }
    if (value instanceof Date) {
        return value.getTime() / 1000;
    }
    
    // Recursive on each property of the object
    if (typeof value === 'object') {
        for (const key in value) {
            value[key] = jsonReplacer(key, value[key]);
        }
    }

    return value;
}

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
            const details = await response.text();
            throw new Error("HTTP" + response.statusText + " : " + details);
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
            body: JSON.stringify(body, jsonReplacer),
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
            const details = await response.text();
            throw new Error("HTTP " + response.statusText + " : " + details);
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
            console.error(e);
            return defaultValue;
        }
    }

    parseAppointmentSlot(data: any): AppointmentSlot {
        if (data !== null) {
            data.start = new Date(data.start * 1000);
            data.end = new Date(data.end * 1000);
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

    parseIpamLog(data: any): IpamLog {
        data.timestamp = data.timestamp && new Date(data.timestamp * 1000);
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

    async fetchMyUnet(): Promise<UnetProfile> {
        return await this.fetchOrDefault("/users/me/unet", null, true);
    }

    async updateMyUnet(unet: UnetProfile): Promise<UnetProfile> {
        return await this.myAuthenticatedRequest("/users/me/unet", unet, "PATCH");
    }

    // ADMIN

    async fetchUsers(): Promise<User[]> {
        const users = await this.fetchOrDefault("/users", [], true);
        return users.map((user: any) => this.parseUser(user));
    }

    async fetchUser(user_id: string): Promise<User> {
        return this.parseUser(await this.fetchOrDefault("/users/" + user_id, null, true));
    }

    async fetchPMs(): Promise<PMInfo[]> {
        return await this.fetchOrDefault("/pms", [], true);
    }

    async fetchONT(user_id: string): Promise<ONTInfo> {
        return await this.fetchOrDefault("/users/" + user_id + "/ont", null, true);
    }

    async registerONT(user_id: string, register: RegisterONT): Promise<ONTInfo> {
        return await this.myAuthenticatedRequest("/users/" + user_id + "/ont", register, "POST");
    }

    async updateUser(user_id: string, update: Partial<User>): Promise<User> {
        return this.parseUser(await this.myAuthenticatedRequest(`/users/${user_id}`, update, "PATCH"));
    }

    async updateMembership(user_id: string, membership: Partial<Membership>): Promise<User> {
        return this.parseUser(await this.myAuthenticatedRequest(`/users/${user_id}/membership`, membership, "PATCH"));
    }

    async deleteMembership(user_id: string): Promise<User> {
        return this.parseUser(await this.myAuthenticatedRequest(`/users/${user_id}/membership`, null, "DELETE"));
    }

    async fetchUserBox(user_id: string): Promise<Box> {
        return await this.fetchOrDefault("/users/" + user_id + "/box", null, true);
    }

    async registerUserBox(user_id: string, box_type: string, mac_address: string, telecomian: boolean): Promise<Box> {
        return await this.myAuthenticatedRequest("/users/" + user_id + "/box?box_type=" + box_type + "&mac_address=" + mac_address + "&telecomian=" + telecomian, null, "POST");
    }

    async sendCommandeAccesInfo(info: CommandeAccesInfo): Promise<Response> {
        return await this.myAuthenticatedRequest("/nix/generer_commande_acces", info, "POST", true);
    }

    async sendCRMiseEnService(info: CRMiseEnService): Promise<Response> {
        return await this.myAuthenticatedRequest("/nix/generer_cr_mise_en_service", info, "POST", true);
    }

    async fetchNextMembershipStatus(user_id: string): Promise<StatusUpdateInfo> {
        return await this.fetchOrDefault("/users/" + user_id + "/next-membership-status", null, true);
    }

    async updateMembershipStatus(user_id: string, status: MembershipStatus): Promise<User> {
        return this.parseUser(await this.myAuthenticatedRequest(`/users/${user_id}/next-membership-status?next_status=${status}`, "POST"));
    }

    async fetchAllSSIDs(): Promise<string[]> {
        return await this.myFetcher("/net/ssids", true);
    }

    async fetchValidSSID(ssid: string): Promise<boolean> {
        return await this.myFetcher(`/net/valid_ssid/${ssid}`, true);
    }

    async fetchONTs(): Promise<RawDBONT[]> {
        return await this.fetchOrDefault("/devices/ont", [], true);
    }

    async fetchBoxes(): Promise<Box[]> {
        return await this.fetchOrDefault("/devices/box", [], true);
    }

    async fetchBoxByUnetID(main_unet_id: string): Promise<Box> {
        return await this.fetchOrDefault("/devices/box/by_unet_id/" + main_unet_id, null, true);
    }

    async createUnetOnBox(id: string, macAddress: string, isTelecomian: boolean): Promise<Box> {
        return await this.myAuthenticatedRequest(`/users/${id}/unet?mac_address=${macAddress}&telecomian=${isTelecomian}`, null, "POST");
    }

    async generateNewContract(user_id: string): Promise<void> {
        await this.myAuthenticatedRequest(`/users/${user_id}/generate_new_contract`, null, "POST");
    }

    async refreshContract(user_id: string): Promise<User> {
        return this.parseUser(await this.myAuthenticatedRequest(`/documenso/refresh/${user_id}`, null, "POST"));
    }

    async deleteONT(serial_number: string): Promise<ONTInfo> {
        return await this.myAuthenticatedRequest("/devices/ont/" + serial_number, null, "DELETE");
    }

    async deleteBox(mac_address: string): Promise<Box> {
        return await this.myAuthenticatedRequest("/devices/box/" + mac_address, null, "DELETE");
    }

    async deleteUnet(user_id: string): Promise<Box> {
        return await this.myAuthenticatedRequest("/users/" + user_id + "/unet", null, "DELETE");
    }

    async updateBoxMacAddress(mac_address: string, new_mac_address: string): Promise<Box> {
        return await this.myAuthenticatedRequest(`/devices/box/${mac_address}/mac/${new_mac_address}`, null, "PATCH");
    }

    async forceOntRegistration(serial_number: string): Promise<ONTInfo> {
        return await this.myAuthenticatedRequest(`/devices/ont/${serial_number}/register_in_olt`, null, "POST");
    }

    async fetchAllONTSummary(): Promise<string> {
        return await this.fetchOrDefault("/net/get-all-ont-summary", "Cannot fetch", true);
    }

    async fetchIpamLogs(start: Date, end: Date): Promise<IpamLog[]> {
        const data = await this.fetchOrDefault(`/logging/ipam?start=${Math.floor(start.getTime() / 1000)}&end=${Math.floor(end.getTime() / 1000)}`, [], true);
        return data.map((usage: any) => this.parseIpamLog(usage));
    }

    async createIpamLog(message: string, source: string): Promise<void> {
        await this.myAuthenticatedRequest(`/logging/ipam?message=${message}&source=${source}`, null, "POST");
    }

    async transferDevices(user_id: string, target_user_id: string): Promise<void> {
        await this.myAuthenticatedRequest(`/users/${user_id}/transfer-devices?target_user_id=${target_user_id}`, null, "POST");
    }

    async fetchAllUsersOnBox(mac_address: string): Promise<User[]> {
        const users = await this.fetchOrDefault(`/devices/box/${mac_address}/users`, [], true);
        return users.map((user: any) => this.parseUser(user));
    }
}
