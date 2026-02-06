import {
    User,
    Membership,
    AppointmentSlot,
    Appointment,
    CommandeAccesInfo,
    CRMiseEnService,
    AnnulAccesInfo,
    MembershipRequest,
    StatusUpdateInfo,
    MembershipStatus,
    AttachedWifiAdherent,
    PartialRefund,
    HelloAssoCheckoutInitResponse,
    HelloAssoCheckoutStatusResponse
} from "./types/types";
import { ONTInfo, PMInfo, RawDBONT, RegisterONT } from "./types/pon_types";
import { Box, UnetProfile } from "./types/hermes_types";
import { IpamLog } from "./types/log_types";
import { toast } from "react-toastify";
import type { AuthStatusResponse, JwtUserData } from "./types/auth";

export class BackendResponseError extends Error {
    constructor(message: string, public code: number) {
        super(message);
        this.name = "BackendResponseError";
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
    return value;
}

class Api {
    async myFetcher(url: string, body: object | null, method: string, responseType: 'download', downloadFilename: string): Promise<void>;
    async myFetcher(url: string, body: object | null, method: string, responseType: 'raw'): Promise<Response>;
    async myFetcher<T>(url: string, body?: object | null, method?: string, responseType?: 'json'): Promise<T>;
    async myFetcher<T>(
        url: string,
        body: object | null = null,
        method: string = "GET",
        responseType: 'json' | 'download' | 'raw' = 'json',
        downloadFilename: string = 'file'
    ): Promise<T | Response | void> {
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
        } else {
            config = { method: "GET" };
        }

        const response = await fetch("/api" + url, config);

        if (response.status === 401) {
            toast.error("Session expired, please log in again.");
        }
        if (!response.ok) {
            const details = await response.text();
            throw new BackendResponseError(details, response.status);
        }

        if (responseType === 'download') {
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.setAttribute('download', downloadFilename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(objectUrl);
            return;
        }

        if (responseType === 'raw') {
            return response;
        }

        const text = await response.text();
        return text ? (JSON.parse(text) as T) : ({} as T);
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

    async generateVerificationCode(): Promise<User> {
        return this.parseUser(await this.myFetcher("/users/me/generateVerificationCode"));
    }

    async checkVerificationCode(code: string): Promise<User> {
        return this.parseUser(await this.myFetcher("/users/me/checkVerificationCode?code=" + code));
    }

    async isOvhEnabled(): Promise<boolean> {
        return await this.myFetcher<boolean>("/features/phone-number-check");
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
        return await this.fetchOrDefault<UnetProfile | null>("/users/me/unet", null);
    }

    async updateMyUnet(unet: UnetProfile): Promise<UnetProfile> {
        return await this.myFetcher<UnetProfile>("/users/me/unet", unet, "PATCH");
    }

    // ADMIN

    async fetchUsers(): Promise<User[]> {
        const users = await this.fetchOrDefault<User[]>("/users", []);
        return users.map((user: any) => this.parseUser(user));
    }

    async fetchUser(user_id: string): Promise<User | null> {
        return this.parseUser(await this.fetchOrDefault<User | null>("/users/" + user_id, null));
    }

    async fetchPMs(): Promise<PMInfo[]> {
        return await this.fetchOrDefault<PMInfo[]>("/pms", []);
    }

    async fetchONT(user_id: string): Promise<ONTInfo | null> {
        return await this.fetchOrDefault<ONTInfo | null>("/users/" + user_id + "/ont", null);
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

    async fetchUserBox(user_id: string): Promise<Box | null> {
        return await this.fetchOrDefault<Box | null>("/users/" + user_id + "/box", null);
    }

    async registerUserBox(user_id: string, box_type: string, ptah_profile: string, mac_address: string, telecomian: boolean): Promise<Box> {
        const url = `/users/${user_id}/box?box_type=${box_type}&ptah_profile=${ptah_profile}&mac_address=${mac_address}&telecomian=${telecomian}`;
        return await this.myFetcher<Box>(url, null, "POST");
    }

    async sendCommandeAccesInfo(info: CommandeAccesInfo): Promise<Response> {
        return await this.myFetcher("/nix/generer_commande_acces", info, "POST", 'raw');
    }

    async sendCRMiseEnService(info: CRMiseEnService): Promise<Response> {
        return await this.myFetcher("/nix/generer_cr_mise_en_service", info, "POST", 'raw');
    }

    async sendAnnulAcces(info: AnnulAccesInfo): Promise<Response> {
        return await this.myFetcher("/nix/generer_annul_access", info, "POST", 'raw');
    }

    async getPtahProfilesNameList(): Promise<string[]> {
        return await this.myFetcher<string[]>("/ptah/ptah_profiles/names");
    }

    async downloadPtahImage(mac: string, ptah_profile: string): Promise<void> {
        await this.myFetcher(`/ptah/build/${mac}/${ptah_profile}`, null, 'POST', 'download', 'ptah.bin');
    }

    async fetchNextMembershipStatus(user_id: string): Promise<StatusUpdateInfo | null> {
        return await this.fetchOrDefault<StatusUpdateInfo | null>("/users/" + user_id + "/next-membership-status", null);
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

    async fetchBoxByUnetID(main_unet_id: string): Promise<Box | null> {
        return await this.fetchOrDefault<Box | null>("/devices/box/by_unet_id/" + main_unet_id, null);
    }

    async createUnetOnBox(id: string, macAddress: string, isTelecomian: boolean): Promise<Box> {
        return await this.myFetcher<Box>(`/users/${id}/unet?mac_address=${macAddress}&telecomian=${isTelecomian}`, null, "POST");
    }

    async generateNewContract(user_id: string): Promise<void> {
        await this.myFetcher(`/users/${user_id}/generate_new_contract`, null, "POST");
    }

    async refreshContract(user_id: string): Promise<User> {
        return this.parseUser(await this.myFetcher(`/documenso/refresh/${user_id}`, null, "POST"));
    }

    async payUserPartialRefunds(user_id: string): Promise<void> {
        await this.myFetcher(`/users/${user_id}/pay-user-partial-refunds`, null, "POST");
    }

    async fetchAllScholarshipStudents(): Promise<User[]> {
        const users = await this.fetchOrDefault<User[]>("/users/scholarship-student", []);
        return users.map((user: any) => this.parseUser(user));
    }

    async resetAllScholarshipStudents(): Promise<void> {
        await this.myFetcher("/users/scholarship-student/reset", null, "POST");
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

    async updateBoxPtahProfile(mac_address: string, new_ptah_profile: string): Promise<Box> {
        return await this.myFetcher<Box>(`/devices/box/${mac_address}/ptah_profile/${new_ptah_profile}`, null, "PATCH");
    }

    async forceOntRegistration(serial_number: string): Promise<ONTInfo> {
        return await this.myFetcher<ONTInfo>(`/devices/ont/${serial_number}/register_in_olt`, null, "POST");
    }

    async fetchAllONTSummary(): Promise<string> {
        return await this.fetchOrDefault<string>("/net/get-all-ont-summary", "Cannot fetch");
    }

    async fetchIpamLogs(start: Date, end: Date): Promise<IpamLog[]> {
        const url = `/logging/ipam?start=${Math.floor(start.getTime() / 1000)}&end=${Math.floor(end.getTime() / 1000)}`;
        const data = await this.fetchOrDefault<object[]>(url, []);
        return data.map((usage: any) => this.parseIpamLog(usage));
    }

    async createIpamLog(message: string, source: string): Promise<void> {
        await this.myFetcher(`/logging/ipam?message=${message}&source=${source}`, null, "POST");
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

    async helloAssoInitCheckout(checkoutItemsIds: string[]): Promise<HelloAssoCheckoutInitResponse> {
        // TOOD: make helloassocheckoutinitrequest type
        return await this.myFetcher<HelloAssoCheckoutInitResponse>(`/helloasso/init_checkout`, { checkout_item_ids: checkoutItemsIds }, "POST");
    }

    async getCheckoutStatus(checkoutId: number): Promise<HelloAssoCheckoutStatusResponse> {
        return await this.myFetcher<HelloAssoCheckoutStatusResponse>(`/helloasso/get_checkout_status/${checkoutId}`);
    }
}

export default new Api();
