import { createContext } from "react";
import { UserManager, WebStorageStateStore } from "oidc-client-ts";
import { Config } from "./Config";

export interface OIDCAuth {
    authorize(): Promise<void>;
    signout(): Promise<void>;
    userManager: UserManager;
}

export const OIDCContext = createContext<OIDCAuth>(null);

export function OIDCContextWrapper({ children }: { children: any }) {
    const config = {
        authority: Config.OIDC_ISSUER,
        client_id: Config.OIDC_CLIENT_ID,
        redirect_uri: window.location.origin + "/loginCallback",
        post_logout_redirect_uri: window.location.origin,
        response_type: "code",
        scope: "openid profile email offline_access", 
        userStore: new WebStorageStateStore({ store: window.localStorage })
    };

    const userManager = new UserManager(config);

    const oidcAuth: OIDCAuth = {
        authorize: () => userManager.signinRedirect(),
        signout: () => userManager.signoutRedirect(),
        userManager
    };

    return <OIDCContext.Provider value={oidcAuth}>{children}</OIDCContext.Provider>;
}
