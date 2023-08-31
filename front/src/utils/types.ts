export interface User {
    keycloak_id: string;
    is_admin: boolean;
    email: string;
    name: string;
    phone: string;
}

export enum Status {
    PENDING_VALIDATION = 1,
    VALIDATED,
    REJECTED,
    ACTIVE,
    PENDING_UNSUBSCRIPTION,
    UNSUBSCRIBED
}

export interface Chambre {
    residence: string;
    name: string;
}

export interface Subscription {    
    subscription_id: string;
    user_id: string;
    chambre: Chambre;
    status: Status;
    unsubscribe_reason: string;
}

export interface SubscriptionFlow {
    subscription_id: string;
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

export interface Box {
    id: number;
    ip: string;
    owner: User;
    SSID: string;
    passwordHash: string;
    connectedDevices: number;
    openPorts: PortRule[];
}

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


export interface ApiInterface {
    [x: string]: any;
    logout(): void;
    login(): void;
    loginRedirect(redirectUri:string): void;
    refreshState(): unknown;
    token: string;
    fetchUsers(): Promise<User[]>;
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
    modifySubscriptionFlow(subscription_id: string, subscriptionFlow: SubscriptionFlow): Promise<SubscriptionFlow>;
}


