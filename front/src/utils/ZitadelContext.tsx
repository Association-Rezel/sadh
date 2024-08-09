import { createContext, useEffect } from "react";
import { ZitadelConfig, createZitadelAuth } from "@zitadel/react";
import { UserManager } from "oidc-client-ts";
import { Config } from "./Config";
import { Api } from "./Api";


export interface ZitadelAuth {
    authorize(): Promise<void>;
    signout(): Promise<void>;
    userManager: UserManager;
}

export const ZitadelContext = createContext<ZitadelAuth>(null);

// Inspired by https://zitadel.com/docs/examples/login/react
export function ZitadelContextWrapper({ children }: { children: any }) {
    const config: ZitadelConfig = {
        authority: "https://sso.fai.rezel.net/",
        client_id: Config.ZITADEL_CLIENT_ID,
        redirect_uri: window.location.origin + "/loginCallback",
        post_logout_redirect_uri: window.location.origin,
        scope: `openid profile email offline_access urn:zitadel:iam:org:id:${Config.ZITADEL_ORG_ID} urn:zitadel:iam:org:project:role:${Config.ZITADEL_ROLE_SITE_ADMIN}`,
    };
    const zitadel = createZitadelAuth(config);

    return <ZitadelContext.Provider value={zitadel}>
        {children}
    </ZitadelContext.Provider>
}