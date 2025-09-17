import { User, Membership, AppointmentSlot, Appointment, CommandeAccesInfo, CRMiseEnService, AnnulAccesInfo, MembershipRequest, StatusUpdateInfo, MembershipStatus, AttachedWifiAdherent, PartialRefund } from "./types/types";
import { Config } from "./Config";
import { ONTInfo, PMInfo, RawDBONT, RegisterONT } from "./types/pon_types";
import { Box, UnetProfile } from "./types/hermes_types";
import { IpamLog } from "./types/log_types";
import { toast } from "react-toastify";
import type { AuthStatusResponse, JwtUserData } from "./types/auth";
import { DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES } from "react";

export class BackendResponseError extends Error {
    constructor(message: string, public code: number) {
        super(message);
        this.name = "RequestError";
    }

    toString() {
        return "HTTP " + this.code + " : " + this.message;
    }
}

const jsonReplacer = (_key: string, value: any): any => {
    if (value instanceof Set) {
        return [...value];
    }
    if (value instanceof Date) {
        return value.getTime() / 1000;
    }

    if (Array.isArray(value)) {
        return value.map(item => jsonReplacer(_key, item));
    }

    if (typeof value === 'object' && value !== null) {
        let newValue: Record<string, any> = {};
        for (const key in value) {
            newValue[key] = jsonReplacer(key, (value as Record<string, any>)[key]);
        }
        return newValue;
    }

    return value;
}

class Api {
    async myFetcher<T>(url: string, body: object | null = null, method: string = "GET", rawResponse: boolean = false): Promise<T> {
        let config: RequestInit | undefined = undefined;

        if (body !== null && method === "GET") {
            method = "POST";
        }

        if (method !== "GET") {
            config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body, jsonReplacer),
            };
        }

        const response = await fetch("/api" + url, config);

        if (response.status === 401) {
            toast.error("Session expired, please log in again.");
        }
        if (!response.ok) {
            const details = await response.text();
            throw new BackendResponseError(details, response.status);
        }
        if (rawResponse) {
            return response as T;
        } else {
            return await response.json() as T;
        }
    }

    async fetchOrDefault<T>(url: string, defaultValue: T): Promise<T> {
        try {
            return await this.myFetcher<T>(url);
        } catch (e: any) {
            if (e.code !== 404 && e instanceof Error) {
                console.error(e.message);
            }
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

    parseAttachedWifiAdherent(data: any): AttachedWifiAdherent {
        if (data !== null) {
            data.from_date = new Date(data.from_date * 1000);
            data.to_date = data.to_date && new Date(data.to_date * 1000);
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

        if (data?.membership?.attached_wifi_adherents) {
            data.membership.attached_wifi_adherents = data.membership.attached_wifi_adherents.map((adherent: any) => this.parseAttachedWifiAdherent(adherent));
        }

        if (data?.membership?.start_date) {
            data.membership.start_date = new Date(data.membership.start_date * 1000);
        }

        if (data?.membership?.deleted_date) {
            data.membership.deleted_date = new Date(data.membership.deleted_date * 1000);
        }

        return data;
    }

    parseIpamLog(data: any): IpamLog {
        data.timestamp = data.timestamp && new Date(data.timestamp * 1000);
        return data;
    }

    parsePartialRefund(data: any): PartialRefund {
        data.membership_start = new Date(data.membership_start * 1000);
        return data;
    }

    async fetchMe(): Promise<User | null> {
        const user = await this.myFetcher<AuthStatusResponse<User>>("/users/me");
        if (!user.logged_in || !user.user) {
            return null;
        }
        return this.parseUser(user.user);
    }

    async submitMyMembershipRequest(request: MembershipRequest): Promise<User> {
        return this.parseUser(await this.myFetcher("/users/me/membershipRequest", request));
    }

    async fetchAppointmentSlots(weekOffset: number): Promise<AppointmentSlot[][]> {
        const data = await this.myFetcher<object[][]>("/appointments/weekSlots?weekOffset=" + weekOffset);
        return data.map((week: any) => week.map((slot: any) => this.parseAppointmentSlot(slot)));
    }

    async updateMyAvailabilities(availabilities: AppointmentSlot[]): Promise<User> {
        return this.parseUser(await this.myFetcher("/users/me/availability", availabilities));
    }

    async fetchMyUnet(): Promise<UnetProfile | null> {
        return await this.fetchOrDefault<UnetProfile>("/users/me/unet", null);
    }

    async updateMyUnet(unet: UnetProfile): Promise<UnetProfile> {
        return await this.myFetcher<UnetProfile>("/users/me/unet", unet, "PATCH");
    }

    // ADMIN

    async fetchUsers(): Promise<User[]> {
        const users = await this.fetchOrDefault<User[]>("/users", []);
        return users.map((user: any) => this.parseUser(user));
    }

    async fetchUser(user_id: string): Promise<User> {
        return this.parseUser(await this.fetchOrDefault<User>("/users/" + user_id, null));
    }

    async fetchPMs(): Promise<PMInfo[]> {
        return await this.fetchOrDefault<PMInfo[]>("/pms", []);
    }

    async fetchONT(user_id: string): Promise<ONTInfo> {
        return await this.fetchOrDefault<ONTInfo>("/users/" + user_id + "/ont", null);
    }

    async registerONT(user_id: string, register: RegisterONT): Promise<ONTInfo> {
        return await this.myFetcher<ONTInfo>("/users/" + user_id + "/ont", register);
    }

    async updateUser(user_id: string, update: Partial<User>): Promise<User> {
        return this.parseUser(await this.myFetcher(`/users/${user_id}`, update, "PATCH"));
    }

    async updateMembership(user_id: string, membership: Partial<Membership>): Promise<User> {
        return this.parseUser(await this.myFetcher(`/users/${user_id}/membership`, membership, "PATCH"));
    }

    async deleteMembership(user_id: string): Promise<User> {
        return this.parseUser(await this.myFetcher(`/users/${user_id}/membership`, null, "DELETE"));
    }

    async fetchUserBox(user_id: string): Promise<Box> {
        return await this.fetchOrDefault<Box>("/users/" + user_id + "/box", null);
    }

    async registerUserBox(user_id: string, box_type: string, mac_address: string, telecomian: boolean): Promise<Box> {
        return await this.myFetcher<Box>("/users/" + user_id + "/box?box_type=" + box_type + "&mac_address=" + mac_address + "&telecomian=" + telecomian, null, "POST");
    }

    async sendCommandeAccesInfo(info: CommandeAccesInfo): Promise<Response> {
        return await this.myFetcher<Response>("/nix/generer_commande_acces", info, "POST", true);
    }

    async sendCRMiseEnService(info: CRMiseEnService): Promise<Response> {
        return await this.myFetcher<Response>("/nix/generer_cr_mise_en_service", info, "POST", true);
    }

    async sendAnnulAcces(info: AnnulAccesInfo): Promise<Response> {
        return await this.myFetcher<Response>("/nix/generer_annul_access", info, "POST", true);
    }

    async fetchNextMembershipStatus(user_id: string): Promise<StatusUpdateInfo> {
        return await this.fetchOrDefault<StatusUpdateInfo>("/users/" + user_id + "/next-membership-status", null);
    }

    async updateMembershipStatus(user_id: string, status: MembershipStatus): Promise<User> {
        return this.parseUser(await this.myFetcher(`/users/${user_id}/next-membership-status?next_status=${status}`, null, "POST"));
    }

    async fetchAllSSIDs(): Promise<string[]> {
        return await this.myFetcher<string[]>("/net/ssids");
    }

    async fetchValidSSID(ssid: string): Promise<boolean> {
        return await this.myFetcher<boolean>(`/net/valid_ssid/${ssid}`);
    }

    async fetchONTs(): Promise<RawDBONT[]> {
        return await this.fetchOrDefault<RawDBONT[]>("/devices/ont", []);
    }

    async fetchBoxes(): Promise<Box[]> {
        return await this.fetchOrDefault<Box[]>("/devices/box", []);
    }

    async fetchBoxByUnetID(main_unet_id: string): Promise<Box> {
        return await this.fetchOrDefault<Box>("/devices/box/by_unet_id/" + main_unet_id, null);
    }

    async createUnetOnBox(id: string, macAddress: string, isTelecomian: boolean): Promise<Box> {
        return await this.myFetcher<Box>(`/users/${id}/unet?mac_address=${macAddress}&telecomian=${isTelecomian}`, null, "POST");
    }

    async generateNewContract(user_id: string): Promise<void> {
        await this.myFetcher(`/users/${user_id}/generate_new_contract`, null);
    }

    async refreshContract(user_id: string): Promise<User> {
        return this.parseUser(await this.myFetcher(`/documenso/refresh/${user_id}`, null, "POST"));
    }

    async payUserPartialRefunds(user_id: string): Promise<void> {
        await this.myFetcher(`/users/${user_id}/pay-user-partial-refunds`, null, "POST");
    }

    async deleteONT(serial_number: string): Promise<ONTInfo> {
        return await this.myFetcher(`/devices/ont/${serial_number}`, null, "DELETE");
    }

    async deleteBox(mac_address: string): Promise<Box> {
        return await this.myFetcher<Box>(`/devices/box/${mac_address}`, null, "DELETE");
    }

    async transferUnet(unet_id: string, target_mac_address: string): Promise<UnetProfile> {
        return await this.myFetcher(`/net/transfer-unet/${unet_id}/to/${target_mac_address}`, null, "POST");
    }

    async deleteUnet(user_id: string): Promise<Box> {
        return await this.myFetcher<Box>(`/users/${user_id}/unet`, null, "DELETE");
    }

    async updateBoxMacAddress(mac_address: string, new_mac_address: string): Promise<Box> {
        return await this.myFetcher<Box>(`/devices/box/${mac_address}/mac/${new_mac_address}`, null, "PATCH");
    }

    async forceOntRegistration(serial_number: string): Promise<ONTInfo> {
        return await this.myFetcher<ONTInfo>(`/devices/ont/${serial_number}/register_in_olt`, null, "POST");
    }

    async fetchAllONTSummary(): Promise<string> {
        return await this.fetchOrDefault<string>("/net/get-all-ont-summary", "Cannot fetch");
    }

    async fetchIpamLogs(start: Date, end: Date): Promise<IpamLog[]> {
        const data = await this.fetchOrDefault<object[]>(`/logging/ipam?start=${Math.floor(start.getTime() / 1000)}&end=${Math.floor(end.getTime() / 1000)}`, []);
        return data.map((usage: any) => this.parseIpamLog(usage));
    }

    async createIpamLog(message: string, source: string): Promise<void> {
        await this.myFetcher(`/logging/ipam?message=${message}&source=${source}`, null);
    }

    async transferDevices(user_id: string, target_user_id: string): Promise<void> {
        await this.myFetcher(`/users/${user_id}/transfer-devices?target_user_id=${target_user_id}`, null, "POST");
    }

    async fetchAllUsersOnBox(mac_address: string): Promise<User[]> {
        const users = await this.fetchOrDefault<object[]>(`/devices/box/${mac_address}/users`, []);
        return users.map((user: any) => this.parseUser(user));
    }

    async fetchAllPartialRefunds(): Promise<PartialRefund[]> {
        const data = await this.myFetcher<object[]>("/partial-refunds");
        return data.map((refund: any) => this.parsePartialRefund(refund));
    }

    async updatePartialRefund(partial_refund: PartialRefund): Promise<PartialRefund> {
        return this.parsePartialRefund(await this.myFetcher("/partial-refunds", partial_refund, "PATCH"));
    }

    async computePartialRefunds(): Promise<object> {
        return await this.myFetcher<object>("/partial-refunds/compute", null, "POST");
    }

    async deletePartialRefund(id: string): Promise<void> {
        await this.myFetcher(`/partial-refunds/${id}`, null, "DELETE");
    }

    async checkAuthStatusForPath(path: 'user' | 'admin'): Promise<JwtUserData | null> {
        const response = await this.myFetcher<AuthStatusResponse<JwtUserData>>(`/auth/status/${path}`);
        if (!response.logged_in || !response.user) {
            return null;
        }
        return response.user;
    }
}

export default new Api();
