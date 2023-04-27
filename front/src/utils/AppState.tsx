import React, {createContext, useEffect, useState} from "react";
import {User} from "./types";
import {Api} from "./Api";

export interface State {
    logged: boolean,
    user?: User,
    token?: string
}

const defaultState: State = {
    logged: false,
    user: undefined,
    token: undefined
};

// https://reactjs.org/docs/context.html
export const AppStateContext = createContext<State>(defaultState);
export let setAppState = (e: State | ((state: State) => State)) => {
    console.error("GLOBAL_setAppState not set");
    console.error(e);
};

export const updateAppState = (e: Partial<State>) => {
    setAppState((state: State) => ({...state, ...e}));
};

export let getAppState = () => defaultState;

export function AppStateWrapper({children}: { children: any }) {

    function getInitialState(): State {
        const state = localStorage.getItem('appState');
        const resultState = state ? JSON.parse(state) : defaultState;
        Api.token = resultState.token;
        return resultState;
    }

    const [appState, _setAppState] = useState<State>(getInitialState());

    getAppState = () => appState;

    useEffect(() => {
        localStorage.setItem('appState', JSON.stringify(appState))
        Api.token = appState.token;
    }, [appState]);


    setAppState = _setAppState;


    // TODO : remplacer par une solution plus propre de gestion de l'état ?
    // Redux c'est un peu overkill cependant IMHO

    //@ts-ignore
    window.GLOBAL_setAppState = setAppState;


    useEffect(() => {
        Api.fetchMe().then((me) => {
            updateAppState({user: me})
        });
    }, []);

    return <AppStateContext.Provider value={appState}>
        {children}
    </AppStateContext.Provider>
}