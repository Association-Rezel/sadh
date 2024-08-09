import { Box } from "./hermes_types";
import { ONTInfos, PMInfos, RegisterONT } from "./pon_types";

export enum MembershipStatus {
    REQUEST_PENDING_VALIDATION = 1,
    VALIDATED = 2,
    REJECTED = 3,
    ACTIVE = 4,
    PENDING_INACTIVE = 5,
    INACTIVE = 6
}

export enum EquipmentStatus {
    PENDING_PROVISIONING = 1,
    PROVISIONED = 2,
    LENT = 3,
    PARTIALLY_RETURNED = 4,
    RETURNED = 5
}

export enum DepositStatus {
    NOT_DEPOSITED = 1,
    PAID = 2,
    REFUNDED = 3
}

export enum Residence {
    ALJT = "ALJT",
    TWENTY_CAMPUS = "TWENTY_CAMPUS",
    HACKER_HOUSE = "HACKER_HOUSE",
    KLEY = "KLEY"
}

export interface Address {
    residence: Residence;
    appartement_id: string;
}

export interface AppointmentSlot {
    start: Date;
    end: Date;
}

export enum AppointmentType {
    RACCORDEMENT = 1
}

export interface Appointment {
    slot: AppointmentSlot;
    type: AppointmentType;
}

export enum PaymentMethod {
    CHEQUE = "CHEQUE",
    VIREMENT = "VIREMENT",
    ESPECE = "ESPECE"
}

export interface MembershipInitialization {
    payment_method_first_month: PaymentMethod;
    payment_method_deposit: PaymentMethod;
}

export interface Membership {
    status: MembershipStatus;
    address: Address;
    comment: string;
    erdv_id?: string;
    ref_commande?: string;
    ref_prestation?: string;
    equipment_status: EquipmentStatus;
    deposit_status: DepositStatus;
    cmd_acces_sent: boolean;
    cr_mes_sent: boolean;
    paid_first_month: boolean;
    contract_signed: boolean;
    appointment?: Appointment;
    init?: MembershipInitialization;
    unetid?: string;
}

export interface User {
    sub: string;
    email: string;
    phone_number?: string;
    first_name: string;
    last_name: string;
    membership?: Membership;
    availability_slots: AppointmentSlot[];
}

export interface MembershipRequest {
    address: Address;
    phone_number: string;
    payment_method_first_month: PaymentMethod;
    payment_method_deposit: PaymentMethod;
}

export function isSameSlot(slot1: AppointmentSlot | null, slot2: AppointmentSlot | null) {
    return slot1?.start.getTime() == slot2?.start.getTime() && slot1?.end.getTime() == slot2?.end.getTime();
}

// Voir https://gitlab.com/rezel/faipp/nix/-/blob/master/nix/main.py
export interface CommandeAccesInfo {
    nom_adherent: string,
    prenom_adherent: string,
    email_adherent: string,
    telephone_adherent: string,
    residence: string,
    date_installation: string,
    e_rdv: string,
    pm_rack: string,
    pm_tiroir: string,
    pm_port: string,
    ref_interne_rezel_commande: string,
    ref_appartement: string,
    ref_pto: string,
    pto_existant: boolean,
    numero_sequence: string
}

// Voir https://gitlab.com/rezel/faipp/nix/-/blob/master/nix/main.py
export interface CRMiseEnService {
    ref_interne_rezel_commande: string,
    residence: string,
    ref_appartement: string,
    ref_prestation_prise: string,
    date_mise_en_service: string,
    ref_pto: string,
    numero_sequence: string
}

export interface ApiInterface {
    refreshToken(): void;
    token: string;
    fetchFile(url: string): Promise<Blob>;
    uploadFile(url: string, data: FormData): Promise<void>;
    refreshToken(): void;
    fetchUsers(): Promise<User[]>;
    fetchAppointmentSlots(weekOffset: number): Promise<AppointmentSlot[][]>;
    updateMyAvailabilities: (availabilities: AppointmentSlot[]) => Promise<User>;
    fetchMe(): Promise<User>;
    submitMyMembershipRequest(request: MembershipRequest): Promise<User>;
    fetchUser(user_zitadel_sub: string): Promise<User>;
    updateUser(user_zitadel_sub: string, update: Partial<User>): Promise<User>;
    fetchPMs(): Promise<PMInfos[]>;
    fetchONT(user_zitadel_sub: string): Promise<ONTInfos>;
    registerONT(user_zitadel_sub: string, register: RegisterONT): Promise<ONTInfos>;
    updateMembership(membership_id: string, membership: Partial<Membership>): Promise<User>;
    fetchFile(url: string): Promise<Blob>;
    fetchUserBox(user_zitadel_sub: string): Promise<Box>;
    registerUserBox(user_zitadel_sub: string, box_type: string, mac_address: string, telecomian: boolean): Promise<Box>;
    sendCommandeAccesInfo(info: CommandeAccesInfo): Promise<Response>;
    sendCRMiseEnService(info: CRMiseEnService): Promise<Response>;
}