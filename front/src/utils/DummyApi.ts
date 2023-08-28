import { User, ApiInterface, Order, Device, DHCPLease, PortRule, Box, Subscription, ONT } from "./types";
import {getAppState, updateAppState} from "./AppState";

export class DummyApi implements ApiInterface {
    registerONT(user_keycloak_id: string, serial_number: string, software_version: string): Promise<ONT> {
        throw new Error("Method not implemented.");
    }
    fetchUser(user_keycloak_id: string): Promise<User> {
        throw new Error("Method not implemented.");
    }
    fetchSubscription(user_keycloak_id: string): Promise<Subscription> {
        throw new Error("Method not implemented.");
    }
    fetchONT(user_keycloak_id: string): Promise<ONT> {
        throw new Error("Method not implemented.");
    }
    loginRedirect(redirectUri: string): void {
        throw new Error("Method not implemented.");
    }
    fetchMySubscription(): Promise<Subscription> {
        throw new Error("Method not implemented.");
    }
    addMySubscription(subscription: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    modifyMySubscription(subscription: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteOpenPort(id: number): Promise<void> {
        return null;
    }
    [x: string]: any;

    setOpenPort(port: PortRule): Promise<void> {
        return null;
    }
    token: string;
    dhcpList : DHCPLease[] = [ {
        id: 1,
        name: "Device 1",
        description: "Description 1",
        ip: "255:255:255:255",
        mac: "00:00:00:00:00:00",
    },
    {
        id: 2,
        name: "Device 2",
        description: "Description 2 blalfl lkfld kld d lkdlf",
        ip: "255:255:255:2",
        mac: "00:00:00:00:00:01",
    }];

    deviceList: Device[] = [{
        id: 1,
        name: "Device 1",
        ip: "255:255:255:255",
        mac: "00:00:00:00:00:00",
    },
    {
        id: 2,
        name: "Device 2",
        ip: "255:255:255:2",
        mac: "00:00:00:00:00:01",
    }
    ];
    openPortsList: PortRule[] = [
        {
            id:0, 
            isActive:true, 
            service:'Minecraft Server', 
            internPort:25565, 
            externPort:25565, 
            protocol:'TCP'
        },
        {
            id:1, 
            isActive:false, 
            service:'Mon NAS', 
            internPort:420, 
            externPort:69, 
            protocol:'UDP'
        }

        ];
    
    user1 : User = {
        keycloak_id: "1",
        is_admin: false,
        name: "Denis Fouchard",
        email: "denis@exaple.com",
    };
    
    box : Box = 
        {id: 1,
        owner: this.user1,
        ip: "187.98.13.29",
        SSID: "Box de Denis",
        passwordHash: "123456789",
        connectedDevices: this.deviceList.length,
        openPorts: this.openPortsList
    };


    async addDHCPLease(dhcp: DHCPLease): Promise<void> {
        dhcp.id=Math.floor(Math.random()*10000);
        this.dhcpList.push(dhcp);
        console.log(this.dhcpList)
        
    }

    async deleteDHCPLease(id: number): Promise<void> {
        const newDhcpList = []
        for (var dhcpLease of this.dhcpList) {
            if (dhcpLease.id !== id) {
                newDhcpList.push(dhcpLease);
            }
        }
        this.dhcpList = newDhcpList;
    }
        /*
    import {ApiInterface, Device, Order, User} from "./types";
    import {updateAppState} from "./AppState";


    /*
        Implémentation locale de l'API pour les tests
    */
    

    async logout(): Promise<void> {
        updateAppState({logged: false, user: null, token: ""});
    }

    async login(): Promise<void> {
        updateAppState({logged: true, user: await this.fetchMe(), token: "token-keycloak-dummy"});
    }

    refreshState(): void {
    }

    async fetchUsers(): Promise<User[]> {
        return [
            {
                keycloak_id: "1",
                is_admin: false,
                name: "toto",
                email: "toto@example.com",
            },
            {
                keycloak_id: "2",
                is_admin: false,
                name: "tata",
                email: "tata@example.com",
            },
            {
                keycloak_id: "3",
                is_admin: false,
                name: "tutu",
                email: "tutu@example.com",
            },
        ];
    }
    async fetchMe(): Promise<User> {
        return {
            keycloak_id: "7897",
            is_admin: true,
            name: "itsme",
            email: "itsme@example.com",
        };
    }

    async fetchMyBox(id: number): Promise<Box> {
        return this.box;
    }

    async updateMyBox(box: Box): Promise<void> {
        this.box = box;
    }

    async fetchBoxes(): Promise<Box[]> {
        return [this.box];
    }

    async fetchOrders(): Promise<Order[]> {
        return [
            {
                id: 1,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 2,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 3,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 4,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 5,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
            {
                id: 6,
                date: "16 Mar, 2019",
                name: "Elvis Presley",
                paymentMethod: "VISA ⠀•••• 3719",
                amount: 312.44,
            },
        ];
    }

    async fetchDHCPLeases(): Promise<DHCPLease[]> {
        return this.dhcpList;
    }

    async fetchDevices(): Promise<Device[]> {
        return this.deviceList;
    }

    async fetchDHCPLease(id:number): Promise<DHCPLease> {
        const dhcpLeases = await this.fetchDHCPLeases();
        
        for (var dhcpLease of dhcpLeases) {
            if (dhcpLease.id === id) {
                return dhcpLease;
            }
        }
    }

    async fetchConnectedDevices(): Promise<Device[]> {
        const devices = await this.fetchDevices();
        return devices;
    }

    async fetchOpenPorts(): Promise<PortRule[]> {

        return this.openPortsList;
    }

    async setOpenPorts(ports: PortRule[]): Promise<void> {
        this.openPortsList = ports;
        return Promise.resolve();
    }

    async addOpenPort(port: PortRule): Promise<void> {
        const ports = await this.fetchOpenPorts();
        port.id = ports.length;
        ports.push(port);
    }

    
}
