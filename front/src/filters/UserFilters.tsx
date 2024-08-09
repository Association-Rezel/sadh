import { Residence, MembershipStatus, User } from "../utils/types/types";

export interface UserFilter {
    filter(user: User): boolean;
}

export class ResidencesFilter implements UserFilter {
    private residence: Residence;

    constructor(residence: Residence) {
        this.residence = residence;
    }

    filter(user: User): boolean {
        return user.membership?.address.residence === this.residence;
    }
}

export class StatusFilter implements UserFilter {
    private status: MembershipStatus;

    constructor(status: MembershipStatus) {
        this.status = status;
    }

    filter(user: User): boolean {
        return user.membership?.status === this.status;
    }
}

export function filterUsers(users: User[], filters: UserFilter[]): User[] {
    let filteredUsers = users;
    filters.forEach((filter) => {
        filteredUsers = filteredUsers.filter((user) => filter.filter(user));
    });
    return filteredUsers;
}