export interface User {
    keycloak_id: string;
    is_admin: boolean;
    email: string;
    name: string;
    phone: string;
}

export enum SubscriptionStatus {
    PENDING_VALIDATION = 1,
    VALIDATED = 2,
    REJECTED = 3,
    ACTIVE = 4,
    PENDING_UNSUBSCRIPTION = 5,
    UNSUBSCRIBED = 0,
}

export enum Residence {
    ALJT = "ALJT",
    TWENTY_CAMPUS = "TWENTY_CAMPUS",
    HACKER_HOUSE = "HACKER_HOUSE",
    KLEY = "KLEY"
}

export interface Chambre {
    residence: string;
    name: string;
}

export interface Subscription {    
    subscription_id: string;
    chambre: Chambre;
    status: SubscriptionStatus;
    unsubscribe_reason: string;
}

export interface SubscriptionFlow {
    flow_id: string;
    erdv_id: string;
    erdv_information: string;
    present_for_appointment: string;
    ref_commande: string;
    ref_prestation: string;
    ont_lent: boolean;
    box_lent: boolean;
    box_information: string;
    dolibarr_information: string;
    cmd_acces_sent: boolean;
    cr_mes_sent: boolean;
    comment: string;
    paid_caution: boolean;
    paid_first_month: boolean;
    contract_signed: boolean;
}

export interface Order {
    id: number;
    date: string;
    name: string;
    paymentMethod: string;
    amount: number
}

export interface Device {
    id: number;
    name: string;
    ip: string;
    mac: string;
}

export interface DHCPLease {
    id? : number;
    name: string;
    description: string;
    ip: string;
    mac: string;
}

// export interface Box {
//     id: number;
//     ip: string;
//     owner: User;
//     SSID: string;
//     passwordHash: string;
//     connectedDevices: number;
//     openPorts: PortRule[];
// }

export interface ONT {
    serial_number: string;
    position_PM: string;
    netbox_id: string;
}

export interface PortRule {
    id?: number;
    service: string;
    internPort: number;
    externPort: number;
    protocol: string;
    isActive: boolean;
}

export interface AppointmentSlot {
    start: Date,
    end: Date,
}

export function isSameSlot(slot1: AppointmentSlot, slot2: AppointmentSlot) {
    return slot1.start.getTime() == slot2.start.getTime() && slot1.end.getTime() == slot2.end.getTime();
}

export enum AppointmentStatus {
    PENDING_VALIDATION = 1,
    VALIDATED = 2
}

export enum AppointmentType {
    RACCORDEMENT = 1,
}

export interface Appointment {
    appointment_id: string;
    slot: AppointmentSlot;
    status: AppointmentStatus;
    type: AppointmentType;
}

export interface UserDataBundle {
    user: User;
    subscription: Subscription;
    flow: SubscriptionFlow;
    appointments: Appointment[];
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
}

export interface BoxInterface {
    mac_address: string;
    ipv4s: string[];
    ipv6s: string[];
}

export interface Box {
    serial_number: string;
    if_adh: BoxInterface;
    if_adh_exte: BoxInterface;
    if_mgmt: BoxInterface;
    ssid: string;
}

export interface ApiInterface {
    [x: string]: any;
    logout(): void;
    login(): void;
    loginRedirect(redirectUri:string): void;
    refreshState(): unknown;
    token: string;
    fetchUsers(): Promise<User[]>;
    fetchSubscriptions(): Promise<Subscription[]>;
    fetchBoxes(): Promise<Box[]>;
    fetchMyBox(id: number): Promise<Box>;
    updateMyBox(box: Box): Promise<void>;
    fetchMe(): Promise<User>;
    fetchMySubscription(): Promise<Subscription>;
    addMySubscription(subscription: any): Promise<void>;
    modifyMySubscription(subscription: any): Promise<void>;
    fetchOrders(): Promise<Order[]>;
    fetchDHCPLeases(): Promise<DHCPLease[]>;
    fetchDHCPLease(id:number): Promise<DHCPLease>;
    addDHCPLease(device:DHCPLease): Promise<void>;
    deleteDHCPLease(id:number): Promise<void>;
    fetchConnectedDevices(): Promise<Device[]>;
    fetchOpenPorts(): Promise<PortRule[]>;
    setOpenPort(port:PortRule): Promise<void>;
    deleteOpenPort(id:number): Promise<void>;
    fetchUser(user_keycloak_id: string): Promise<User>;
    fetchSubscription(user_keycloak_id: string): Promise<Subscription>;
    fetchONT(user_keycloak_id: string): Promise<ONT>;
    registerONT(user_keycloak_id: string, serial_number: string, software_version: string): Promise<ONT>;
    fetchSubscriptionFlow(subscription_id: string): Promise<SubscriptionFlow>;
    modifySubscriptionFlow(flow_id: string, subscriptionFlow: SubscriptionFlow): Promise<SubscriptionFlow>;
    modifySubscription(subscription_id: string, subscription: Subscription): Promise<Subscription>;
    fetchAppointmentSlots(weekOffset: number): Promise<AppointmentSlot[][]>;
    submitMyAppointmentSlots(slots: AppointmentSlot[]): Promise<Appointment[]>;
    fetchMyAppointments(): Promise<Appointment[]>;
    fetchSubscriptionAppointments(subscription_id: string): Promise<Appointment[]>;
    fetchAppointments(): Promise<Appointment[]>;
    modifyAppointmentStatus(appointment_id: string, appointment: Appointment): Promise<Appointment>;
    deleteAppointment(appointment_id: string): Promise<void>;
    fetchUserDataBundles(): Promise<UserDataBundle[]>;
    fetchUserDataBundle(user_keycloak_id: string): Promise<UserDataBundle>;
    uploadFile(url: string, data: FormData): Promise<void>;
    fetchFile(url: string): Promise<Blob>;
    fetchUserBox(user_keycloak_id: string): Promise<Box>;
    registerUserBox(user_keycloak_id: string, serial_number: string, mac_address: string, telecomian: boolean): Promise<Box>;
    submitAppointmentSlots(keycloak_id: string, slots: AppointmentSlot[]): Promise<Appointment[]>;
    sendCommandeAccesInfo(info: CommandeAccesInfo): Promise<Response>;
    sendCRMiseEnService(info: CRMiseEnService): Promise<Response>;
}


