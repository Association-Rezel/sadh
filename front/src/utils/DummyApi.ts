// import { User, ApiInterface, Order, Device, DHCPLease, PortRule, Box, Membership, ONT, MembershipFlow, AppointmentSlot, Appointment, AppointmentType, Residence, User, CommandeAccesInfo, CRMiseEnService } from "./types";

// export class DummyApi implements ApiInterface {
//     sendCommandeAccesInfo(info: CommandeAccesInfo): Promise<Response> {
//         throw new Error("Method not implemented.");
//     }
//     sendCRMiseEnService(info: CRMiseEnService): Promise<Response> {
//         throw new Error("Method not implemented.");
//     }
//     uploadFile(url: string, data: FormData): Promise<void> {
//         throw new Error("Method not implemented.");
//     }
//     fetchFile(url: string): Promise<Blob> {
//         throw new Error("Method not implemented.");
//     }
//     fetchUserBox(user_zitadel_sub: string): Promise<Box> {
//         throw new Error("Method not implemented.");
//     }
//     registerUserBox(user_zitadel_sub: string, serial_number: string, mac_address: string, telecomian: boolean): Promise<Box> {
//         throw new Error("Method not implemented.");
//     }
//     submitAppointmentSlots(zitadel_sub: string, slots: AppointmentSlot[]): Promise<Appointment[]> {
//         return Promise.resolve([]);
//     }
//     fetchUser(user_zitadel_sub: string): Promise<User> {
//         throw new Error("Method not implemented.");
//     }
//     fetchUsers(): Promise<User[]> {
//         throw new Error("Method not implemented.");
//     }
//     fetchMembershipAppointments(membership_id: string): Promise<Appointment[]> {
//         return Promise.resolve([]);
//     }
//     fetchAppointments(): Promise<Appointment[]> {
//         return Promise.resolve([
//             {
//                 appointment_id: "string",
//                 slot: {
//                     start: new Date("2023-09-09T10:00:00"),
//                     end: new Date("2023-09-09T11:00:00")
//                 },
//                 type: AppointmentType.RACCORDEMENT,
//                 status: AppointmentStatus.VALIDATED,
//             }
//         ]);
//     }
//     modifyAppointmentStatus(appointment_id: string, appointment: Appointment): Promise<Appointment> {
//         throw new Error("Method not implemented.");
//     }
//     deleteAppointment(appointment_id: string): Promise<void> {
//         throw new Error("Method not implemented.");
//     }
//     fetchMyAppointments(): Promise<Appointment[]> {
//         throw new Error("Method not implemented.");
//     }
//     submitMyAppointmentSlots(slots: AppointmentSlot[]): Promise<Appointment[]> {
//         throw new Error("Method not implemented.");
//     }
//     fetchAppointmentSlots(weekOffset: number): Promise<AppointmentSlot[][]> {
//         throw new Error("Method not implemented.");
//     }
//     updateMembership(membership_id: string, membership: Membership): Promise<Membership> {
//         throw new Error("Method not implemented.");
//     }
//     modifyMembershipFlow(flow_id: string, membershipFlow: MembershipFlow): Promise<MembershipFlow> {
//         throw new Error("Method not implemented.");
//     }
//     fetchMembershipFlow(membership_id: string): Promise<MembershipFlow> {
//         return Promise.resolve({
//             flow_id:"01ee49c6-9952-46e9-bea5-ce267c191a41",
//             membership_id:"01ee49c6-9952-46e9-bea5-ce267c191a41",
//             erdv_information:"RDV2-KLEY-550-20230830-1\n\nLigne FI-4697-6424",
//             erdv_id:"F10-DGO-48796025-0000017086267-ERDV",
//             present_for_appointment:"Séverin",
//             ref_commande:"KLEY-550-20230830-2",
//             ref_prestation:"VIA01000000205475045",
//             ont_lent:true,
//             box_lent:true,
//             box_information:"MAC : ??",
//             dolibarr_information:"",
//             cmd_acces_sent:true,
//             cr_mes_sent:false,
//             comment:"",
//             paid_caution:false,
//             paid_first_month:true,
//             contract_signed:true
//         });
//     }
//     registerONT(user_zitadel_sub: string, serial_number: string, software_version: string): Promise<ONT> {
//         throw new Error("Method not implemented.");
//     }
//     fetchUser(user_zitadel_sub: string): Promise<User> {
//         return Promise.resolve({
//             zitadel_sub: "7897",
//             is_admin: true,
//             name: "itsme",
//             email: "me@example.com",
//             phone: "00 00 00 00 00"
//         });
//     }
//     fetchMemberships(): Promise<Membership[]> {
//         return Promise.resolve([]);
//     }
//     fetchMembership(user_zitadel_sub: string): Promise<Membership> {
//         return Promise.resolve({
//             membership_id:"azertyuiop",
//             user_id:"azertyuiop",
//             chambre:{
//                 residence:Residence.ALJT,
//                 name:"123"
//             },
//             status:1,
//             unsubscribe_reason:""
//         });
//     }
//     fetchONT(user_zitadel_sub: string): Promise<ONT> {
//         return Promise.resolve({
//             serial_number: "ALCL:F887917B",
//             position_PM: "A3",
//             netbox_id: "20"
//         });
//     }
//     fetchMyMembership(): Promise<Membership> {
//         return this.fetchMembership("getAppState().user.zitadel_sub");
//     }
//     addMyMembership(membership: any): Promise<void> {
//         throw new Error("Method not implemented.");
//     }
//     modifyMyMembership(membership: any): Promise<void> {
//         throw new Error("Method not implemented.");
//     }
//     deleteOpenPort(id: number): Promise<void> {
//         return null;
//     }
//     [x: string]: any;

//     setOpenPort(port: PortRule): Promise<void> {
//         return null;
//     }
//     token: string;
//     dhcpList : DHCPLease[] = [ {
//         id: 1,
//         name: "Device 1",
//         description: "Description 1",
//         ip: "255:255:255:255",
//         mac: "00:00:00:00:00:00",
//     },
//     {
//         id: 2,
//         name: "Device 2",
//         description: "Description 2 blalfl lkfld kld d lkdlf",
//         ip: "255:255:255:2",
//         mac: "00:00:00:00:00:01",
//     }];

//     deviceList: Device[] = [{
//         id: 1,
//         name: "Device 1",
//         ip: "255:255:255:255",
//         mac: "00:00:00:00:00:00",
//     },
//     {
//         id: 2,
//         name: "Device 2",
//         ip: "255:255:255:2",
//         mac: "00:00:00:00:00:01",
//     }
//     ];
//     openPortsList: PortRule[] = [
//         {
//             id:0, 
//             isActive:true, 
//             service:'Minecraft Server', 
//             internPort:25565, 
//             externPort:25565, 
//             protocol:'TCP'
//         },
//         {
//             id:1, 
//             isActive:false, 
//             service:'Mon NAS', 
//             internPort:420, 
//             externPort:69, 
//             protocol:'UDP'
//         }

//         ];
    
//     user1 : User = {
//         sub: "1",
//         admin: false,
//         name: "Denis Fouchard",
//         email: "denis@exaple.com",
//         phone: "00 00 00 00 00"
//     };
    
//     box : Box = null;
        


//     async addDHCPLease(dhcp: DHCPLease): Promise<void> {
//         dhcp.id=Math.floor(Math.random()*10000);
//         this.dhcpList.push(dhcp);
        
//     }

//     async deleteDHCPLease(id: number): Promise<void> {
//         const newDhcpList = []
//         for (var dhcpLease of this.dhcpList) {
//             if (dhcpLease.id !== id) {
//                 newDhcpList.push(dhcpLease);
//             }
//         }
//         this.dhcpList = newDhcpList;
//     }
//         /*
//     import {ApiInterface, Device, Order, User} from "./types";
//     import {updateAppState} from "./AppState";


//     /*
//         Implémentation locale de l'API pour les tests
//     */

//     refreshState(): void {
//     }

//     async fetchUsers(): Promise<User[]> {
//         return [
//             {
//                 sub: "1",
//                 admin: false,
//                 name: "toto",
//                 email: "toto@example.com",
//                 phone: "00 00 00 00 00"
//             },
//             {
//                 sub: "2",
//                 admin: false,
//                 name: "tata",
//                 email: "tata@example.com",
//                 phone: "00 00 00 00 00"
//             },
//             {
//                 sub: "3",
//                 admin: false,
//                 name: "tutu",
//                 email: "tutu@example.com",
//                 phone: "00 00 00 00 00"
//             },
//         ];
//     }
//     async fetchMe(): Promise<User> {
//         return {
//             sub: "7897",
//             name: "itsme",
//             email: "itsme@example.com",
//             phone: "00 00 00 00 00"
//         };
//     }

//     async fetchMyBox(id: number): Promise<Box> {
//         return this.box;
//     }

//     async updateMyBox(box: Box): Promise<void> {
//         this.box = box;
//     }

//     async fetchBoxes(): Promise<Box[]> {
//         return [this.box];
//     }

//     async fetchOrders(): Promise<Order[]> {
//         return [
//             {
//                 id: 1,
//                 date: "16 Mar, 2019",
//                 name: "Elvis Presley",
//                 paymentMethod: "VISA ⠀•••• 3719",
//                 amount: 312.44,
//             },
//             {
//                 id: 2,
//                 date: "16 Mar, 2019",
//                 name: "Elvis Presley",
//                 paymentMethod: "VISA ⠀•••• 3719",
//                 amount: 312.44,
//             },
//             {
//                 id: 3,
//                 date: "16 Mar, 2019",
//                 name: "Elvis Presley",
//                 paymentMethod: "VISA ⠀•••• 3719",
//                 amount: 312.44,
//             },
//             {
//                 id: 4,
//                 date: "16 Mar, 2019",
//                 name: "Elvis Presley",
//                 paymentMethod: "VISA ⠀•••• 3719",
//                 amount: 312.44,
//             },
//             {
//                 id: 5,
//                 date: "16 Mar, 2019",
//                 name: "Elvis Presley",
//                 paymentMethod: "VISA ⠀•••• 3719",
//                 amount: 312.44,
//             },
//             {
//                 id: 6,
//                 date: "16 Mar, 2019",
//                 name: "Elvis Presley",
//                 paymentMethod: "VISA ⠀•••• 3719",
//                 amount: 312.44,
//             },
//         ];
//     }

//     async fetchDHCPLeases(): Promise<DHCPLease[]> {
//         return this.dhcpList;
//     }

//     async fetchDevices(): Promise<Device[]> {
//         return this.deviceList;
//     }

//     async fetchDHCPLease(id:number): Promise<DHCPLease> {
//         const dhcpLeases = await this.fetchDHCPLeases();
        
//         for (var dhcpLease of dhcpLeases) {
//             if (dhcpLease.id === id) {
//                 return dhcpLease;
//             }
//         }
//     }

//     async fetchConnectedDevices(): Promise<Device[]> {
//         const devices = await this.fetchDevices();
//         return devices;
//     }

//     async fetchOpenPorts(): Promise<PortRule[]> {

//         return this.openPortsList;
//     }

//     async setOpenPorts(ports: PortRule[]): Promise<void> {
//         this.openPortsList = ports;
//         return Promise.resolve();
//     }

//     async addOpenPort(port: PortRule): Promise<void> {
//         const ports = await this.fetchOpenPorts();
//         port.id = ports.length;
//         ports.push(port);
//     }

    
// }
