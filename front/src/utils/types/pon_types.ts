export interface ONTInfo {
    serial_number: string;
    software_version: string;
    box_mac_address: string;
    mec128_position: string;
    olt_interface: string;
    pm_description: string;
    position_in_subscriber_panel: string;
    pon_rack: number;
    pon_tiroir: number;
}

export interface PMInfo {
    id: string;
    description: string;
}

export interface RegisterONT {
    serial_number: string;
    software_version: string;
    pm_id: string;
}
