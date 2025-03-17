import { createContext, useContext, useEffect, useState } from "react";
import { User } from "./types/types";
import { Api } from "./Api";
import { OIDCContext } from "./OIDCContext";
import { Config } from "./Config";
import { User as OIDCUser } from "oidc-client-ts";

export interface AppState {
    loaded: boolean;
    admin?: boolean;
    user?: User;
}

const defaultAppState: AppState = {
    loaded: false,
};

interface AppStateContextValueWrapper {
    appState: AppState;
    updateAppState: (partialUpdate: Partial<AppState>) => void;
    resetAppState: () => void;
    syncFromOIDCContext?: () => void;
}

// We first create a context that will hold the app state and a function to update it
// We temporarily set the app state to the default state, but the AppStateWrapper component
// will update it with the actual state from localStorage

export const AppStateContext = createContext<AppStateContextValueWrapper>({
    appState: defaultAppState,
    updateAppState: () => {},
    resetAppState: () => {},
});

// This component is a wrapper around the entire app that provides the AppStateContext
export function AppStateWrapper({ children }: { children: any }) {
    const [appStateState, setAppStateState] = useState(defaultAppState);
    const oidcAuth = useContext(OIDCContext);

    const syncFromOIDCContext = () => {
        oidcAuth?.userManager.getUser().then((user: OIDCUser | null) => {
            if (!user || user.expired) {
                setAppStateState({ loaded: true });
            } else {
                // Vérifie si l'utilisateur a l'entitlement "sadh-admin"
                const entitlements = user.profile.entitlements || [];
                const isAdmin = Array.isArray(entitlements) && entitlements.includes(Config.ADMIN_ENTITLEMENT);

                Api.token = user.access_token;
                Api.refreshToken = () => oidcAuth.userManager.signinSilent();
                Api.fetchMe().then((me) => {
                    setAppStateState({ user: me, admin: isAdmin, loaded: true });
                }).catch((err) => {
                    console.error("Erreur lors de la récupération de l'utilisateur:", err);
                    setAppStateState({ loaded: true });
                });
            }
        }).catch((err) => {
            console.error("Erreur lors de la synchronisation OIDC:", err);
            setAppStateState({ loaded: true });
        });
    };

    useEffect(() => {
        if (oidcAuth) {
            syncFromOIDCContext();
        }
    }, [oidcAuth?.userManager]);

    const contextValue: AppStateContextValueWrapper = {
        appState: appStateState,
        updateAppState: (newState: Partial<AppState>) => {
            setAppStateState({ ...appStateState, ...newState });
        },
        resetAppState: () => {
            setAppStateState(defaultAppState);
        },
        syncFromOIDCContext,
    };

    return (
        <AppStateContext.Provider value={contextValue}>
            {children}
        </AppStateContext.Provider>
    );
}