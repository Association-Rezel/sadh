import { useEffect, useState } from "react";
import { User } from "./types";
import { Api } from "./Api";

export const useUser = () => {
    const [user, setUser] = useState<User>(null);
    useEffect(() => {
        Api.fetchMe().then((me) => {
            setUser(me);
        });
    }, []);
    return user;
};
