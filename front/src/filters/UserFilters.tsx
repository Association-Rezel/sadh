import { Residence, SubscriptionStatus, UserDataBundle } from "../utils/types";

export interface UserFilter{
    filter(Users: UserDataBundle[]): UserDataBundle[];
}

export class ResidencesFilter implements UserFilter{
    private residence: Residence;
    
    constructor(residence: Residence){
        this.residence = residence;
    }

    filter(Users: UserDataBundle[]): UserDataBundle[]{
        return Users.filter((User) => User.subscription?.chambre.residence === this.residence);
    }
}

export class StatusFilter implements UserFilter{
    private status: SubscriptionStatus;
    
    constructor(status: SubscriptionStatus){
        this.status = status;
    }

    filter(Users: UserDataBundle[]): UserDataBundle[]{
        return Users.filter((User) => User.subscription?.status === this.status);
    }
}

export function filterUsers(users: UserDataBundle[], filters: UserFilter[]): UserDataBundle[]{
    let filteredUsers = users;
    console.log("filters", filters);
    console.log("filteredUsers", filteredUsers);
    filters.forEach((filter) => {
        console.log("filteredUsers", filteredUsers);
        filteredUsers = filter.filter(filteredUsers);
    });
    return filteredUsers;
}