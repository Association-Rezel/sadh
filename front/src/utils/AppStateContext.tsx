import { createContext, useContext, useEffect, useState } from "react";
import { User } from "./types/types";
import { Api } from "./Api";
import { ZitadelContext } from "./ZitadelContext";
import { Config } from "./Config";
import { User as OIDCUser } from "oidc-client-ts";

// The AppState interface contains useful information about the current user
export interface AppState {
    loaded: boolean,
    admin?: boolean,
    user?: User,
}

// A default app state that will be used when no state exists in localStorage
const defaultAppState: AppState = {
    loaded: false,
};

interface AppStateContextValueWrapper {
    appState: AppState,
    updateAppState: (newState: Partial<AppState>) => void,
    resetAppState: () => void
    syncFromZitadelContext?: () => void
};

// We first create a context that will hold the app state and a function to update it
// We temporarily set the app state to the default state, but the AppStateWrapper component
// will update it with the actual state from localStorage
export const AppStateContext = createContext<AppStateContextValueWrapper>({
    appState: defaultAppState,
    updateAppState: () => { },
    resetAppState: () => { }
});

// This component is a wrapper around the entire app that provides the AppStateContext
export function AppStateWrapper({ children }: { children: any }) {
    const [appStateState, setAppStateState] = useState(defaultAppState);
    const zitadelAuth = useContext(ZitadelContext);

    const syncFromZitadelContext = () =>
        zitadelAuth.userManager.getUser().then((user) => {
            if (!user || user.expired) {
                setAppStateState({ loaded: true });
            }
            else {
                const admin: boolean =
                    user.profile[`urn:zitadel:iam:org:project:roles`]
                    ?.[Config.ZITADEL_ROLE_SITE_ADMIN]
                    ?.[Config.ZITADEL_ORG_ID] !== undefined;

                Api.token = user.access_token;
                Api.refreshToken = () => zitadelAuth.userManager.signinSilent();
                Api.fetchMe().then((me) => {
                    setAppStateState({ user: me, admin: admin, loaded: true });
                });
            }
        });

    // Sync the Zitadel auth state with the app state
    useEffect(() => {

        syncFromZitadelContext();

    }, [zitadelAuth.userManager]);

    const contextValue: AppStateContextValueWrapper = {
        appState: appStateState,
        updateAppState: (newState: Partial<AppState>) => {
            setAppStateState({ ...appStateState, ...newState });
        },
        resetAppState: () => {
            setAppStateState(defaultAppState);
        },
        syncFromZitadelContext: syncFromZitadelContext
    }

    return <AppStateContext.Provider value={contextValue}>
        {children}
    </AppStateContext.Provider>
}