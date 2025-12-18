import { Box, UnetProfile } from "./hermes_types";
import { IpamLog } from "./log_types";
import { ONTInfo, PMInfo, RawDBONT, RegisterONT } from "./pon_types";

export enum MembershipStatus {
    REQUEST_PENDING_VALIDATION = 100,
    VALIDATED = 200,
    SENT_CMD_ACCES = 300,
    APPOINTMENT_VALIDATED = 400,
    ACTIVE = 500,
    PENDING_INACTIVE = 600,
    INACTIVE = 700
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
    ESPECE = "ESPECE",
    HELLOASSO = "HELLOASSO"
}

export enum MembershipType {
    FTTH = "FTTH",
    WIFI = "WIFI"
}

export interface MembershipInitialization {
    payment_method_first_month: PaymentMethod;
    payment_method_membership: PaymentMethod;
    payment_method_deposit?: PaymentMethod;
    main_unet_id?: string;
}

export interface AttachedWifiAdherent {
    user_id: string;
    from_date: Date;
    to_date?: Date;
    comment: string;
}

export interface Membership {
    status: MembershipStatus;
    type: MembershipType;
    address: Address;
    comment: string;
    erdv_id?: string;
    ref_commande?: string;
    ref_prestation?: string;
    equipment_status: EquipmentStatus;
    deposit_status: DepositStatus;
    cmd_acces_sent: boolean;
    cr_mes_sent: boolean;
    annul_acces_sent: boolean;
    paid_first_month: boolean;
    paid_membership: boolean;
    contract_signed: boolean;
    appointment?: Appointment;
    init?: MembershipInitialization;
    unetid?: string;
    documenso_contract_id?: number;
    documenso_adherent_url?: string;
    documenso_president_url?: string;
    deleted_date?: Date;
    start_date?: Date;
    attached_wifi_adherents: AttachedWifiAdherent[];
}

export interface User {
    id: string;
    email: string;
    phone_number?: string;
    iban?: string;
    first_name: string;
    last_name: string;
    membership?: Membership;
    availability_slots: AppointmentSlot[];
    dolibarr_id?: string;
    prev_memberships: Membership[];
    scholarship_student: boolean;
    phone_number_verified: boolean;
}

export interface MembershipRequest {
    type: MembershipType;
    address: Address;
    ssid?: string;
    phone_number?: string;
    iban?: string;
    payment_method_first_month: PaymentMethod;
    payment_method_membership: PaymentMethod;
    payment_method_deposit?: PaymentMethod;
}

export function isSameSlot(slot1: AppointmentSlot | null, slot2: AppointmentSlot | null) {
    return slot1?.start.getTime() == slot2?.start.getTime() && slot1?.end.getTime() == slot2?.end.getTime();
}

export interface StatusUpdateInfo {
    from_status: MembershipStatus;
    to_status: MembershipStatus;
    conditions: string[];
    conditions_not_met: string[];
    effects: string[];
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

// Voir https://gitlab.com/rezel/faipp/nix/-/blob/master/nix/main.py
export interface AnnulAccesInfo {
    residence: string,
    ref_interne_rezel_commande: string,
    ref_appartement: string,
    e_rdv: string,
    ref_pto: string,
    ref_prestation_prise: string,
    date_annulation: string,
    numero_sequence: string
}


export interface PartialRefund {
    id: string;
    membership_start: Date;
    user_id: string;
    month: number;
    comment: string;
    wifi_adherents: string[];
    paid: boolean;
    refunded_amount: number;
}
