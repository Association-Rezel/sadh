import { User, ApiInterface, Order, Device, DHCPLease, PortRule, Box } from "./types";
import {getAppState, updateAppState} from "./AppState";

export class DummyApi implements ApiInterface {
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
        id: 1,
        isAdmin: false,
        name: "Denis Fouchard",
        residence: "ALJT",
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
                id: 1,
                isAdmin: false,
                name: "toto",
                residence: "Kley",
            },
            {
                id: 2,
                isAdmin: false,
                name: "tata",
                residence: "Kley",
            },
            {
                id: 3,
                isAdmin: false,
                name: "tutu",
                residence: "ALJT",
            },
        ];
    }
    async fetchMe(): Promise<User> {
        return {
            id: 7897,
            isAdmin: true,
            name: "itsme",
            residence: "Kley",
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

    async addOpenPort(port: PortRule): Promise<void> {
        const ports = await this.fetchOpenPorts();
        port.id = ports.length;
        ports.push(port);
    }
}
