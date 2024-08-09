import { useContext, useEffect } from "react";
import { ZitadelContext } from "../../utils/ZitadelContext";

export enum LoginPageMode {
    DEFAULT,
    REGISTER
}

export function LoginPageComponent({loginMode = LoginPageMode.DEFAULT}: {loginMode: LoginPageMode}) {
    let zitadelAuth = useContext(ZitadelContext);

    useEffect(() => {
        if(loginMode == LoginPageMode.REGISTER) {
            zitadelAuth.userManager.signinRedirect({ prompt: "create" });
        } else {
            zitadelAuth.userManager.signinRedirect();
        }
    });

    return (
        <p>
            Vous allez être redirigé vers le service de connexion...
        </p>
    );
}

export const LoginPage = () => <LoginPageComponent loginMode={LoginPageMode.DEFAULT} />;
export const RegisterPage = () => <LoginPageComponent loginMode={LoginPageMode.REGISTER} />;