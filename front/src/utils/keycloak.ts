import Keycloak from "keycloak-js";
import {updateAppState} from "./AppState";
import {Api} from "./Api";
import { Config } from "./Config";

export const keycloak = new Keycloak({
    url: Config.KC_URL+'/auth',
    realm: 'users',
    clientId: 'back'
});



if (Config.API_DUMMY==false)
// TODO : que faire quand le token expire ?
keycloak.init({
    scope: 'openid phone',
    //token: localStorage.getItem("keycloak-token"),
    //onLoad: 'login-required'
}).then(function (authenticated) {
    if (authenticated) {
        // On arrive ici si on vient de se connecter
        updateAppState({logged: true, token: keycloak.token})
        //localStorage.setItem("keycloak-token",keycloak.token);
        Api.token = keycloak.token;
    }


    // On peut arriver ici si on est connecté mais qu'on ne vient pas de le faire.
    // Dans ce cas, une requête supplémentaire pour check :
    Api.refreshState();

}).catch(function () {
    // TODO : erreur de connexion
    updateAppState({logged: false, token: ""})
});

// TODO : (debug) enlever
//@ts-ignore
window.keycloak = keycloak;

/*
await fetch('http://localhost:8000/auth/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': 'Bearer ' + keycloak.token,
            'Content-Type': 'application/json'
        }
    })
 */