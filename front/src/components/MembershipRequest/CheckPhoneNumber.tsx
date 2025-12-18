import { useAuthContext } from "../../pages/auth/AuthContext";
import Api from "../../utils/Api";
import { Button, Stack, TextField } from "@mui/material";
import { useState, useEffect } from "react";


export default function CheckPhoneNumber() {
    const { user, setUser } = useAuthContext();
    const cooldown_time = 10000; 
    const [code, setCode] = useState("");
    const [ now, setNow ] = useState(Date.now());
    const [lastSmsDate, setLastSmsDate] = useState(Date.now() - cooldown_time);
    const [wrongCode, setWrongCode] = useState(true);
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 500);
    },
    []);

    const is_cooldown_ready = () => {
        return (now - lastSmsDate) >= cooldown_time;
    }

    const remaining = () => {
        return Math.ceil((cooldown_time - (now - lastSmsDate)) / 1000);
    }

    const generateCode = async () => {
        setLastSmsDate(Date.now());
        try {
            const user = await Api.generateVerificationCode();
            setUser({ ...user });
        }
        catch (error) { 
            alert(error.message);
        }
    }

    const sendCode = async (code) => {
        try {
            const user = await Api.checkVerificationCode(code);
            setUser({ ...user });
            if (!user.phone_number_verified){setWrongCode(false);}
        }
        catch (error) { 
            alert(error.message);
        }
    }

    const changeIfNumber = (str: string) => {
        if (/^\d*$/.test(str)){
            setCode(str);
        }
    }



    return (
        <>
            <Stack direction="column" spacing = {2} sx={{
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 8,
                    }}>
                <h2>Verification Numéro de Téléphone</h2>
                <Button variant="contained" onClick={generateCode} disabled={!is_cooldown_ready()}>Envoyer le code de verification au { user?.phone_number ? user.phone_number : "" } {remaining()>0 ? `${remaining()}s` : ""}</Button>
                <TextField
                    label="Code de verification"
                    variant="outlined"
                    onChange={(e)=>changeIfNumber(e.target.value)}
                    style = {{ width: "200px"}}
                    value={code}
                    slotProps={{
                        input: {
                            inputProps: {style: { textAlign: 'center', fontSize: 30}, maxLength: 6, }
                        }
                    }}
                />
                <Button variant="contained" onClick={() => sendCode(code) } disabled={code.length !== 6}>Verifier le code</Button>
                {wrongCode && <p style={{color:"red"}}>Code incorrect, réessayez</p>}
                <h3>Si vous rencontrez des difficultés, merci d'envoyer un mail à fai@rezel.net</h3>
            </Stack>
        </>
    );
};

