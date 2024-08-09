import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { Button, IconButton, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Api } from "../../utils/Api";
import { AppointmentSlot, isSameSlot } from "../../utils/types/types";
import { default as AppointmentSlotComponent } from "./AppointmentSlot";

export default function AppointmentSelection({ onSubmitSelection }: { onSubmitSelection: any }) {
    const [slots, setSlots] = useState<AppointmentSlot[][]>([]);
    const [selectedSlots, setSelectedSlots] = useState<AppointmentSlot[]>([]);
    const [weekOffset, setWeekOffset] = useState<number>(1);

    useEffect(() => {
        Api.fetchAppointmentSlots(weekOffset).then((data) => {
            if (data === null) {
                alert("Erreur lors de la récupération des créneaux. Veuillez essayer de recharger la page.");
                return;
            }
            setSlots(data);
        }).catch((error) => {
            alert("Erreur lors de la récupération des créneaux. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
    }, [weekOffset]);

    const slotSelected = (slot: AppointmentSlot) => {
        if (selectedSlots.some(s => isSameSlot(s, slot))) {
            setSelectedSlots(selectedSlots.filter((s) => !isSameSlot(s, slot)));
        } else {
            setSelectedSlots([...selectedSlots, slot]);
        }
    }

    return (
        <div className="mt-10 flex flex-col items-center">
            <Typography variant="h2" marginBottom="20px">Raccordement à la fibre</Typography>
            <div className="flex lg:flex-row flex-col gap-8 justify-center">
                <div className="mx-10 self-center">
                    <IconButton color="primary" onClick={() => setWeekOffset(weekOffset - 1)} disabled={weekOffset <= 1}>
                        <ArrowBack fontSize="large" />
                    </IconButton>
                </div>
                {slots.map((day, index) => (
                    <div className="flex flex-col gap-6" key={index}>
                        <Typography variant="h6">{day[0].start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</Typography>
                        {day.map((slot) => <AppointmentSlotComponent key={slot.start.getTime()} slot={slot} selectedSlots={selectedSlots} onChange={slotSelected} />)}
                    </div>
                ))}
                <div className="mx-10 self-center">
                    <IconButton color="primary" onClick={() => setWeekOffset(weekOffset + 1)}>
                        <ArrowForward fontSize="large" />
                    </IconButton>
                </div>
            </div>
            <div className="max-w-2xl mt-12 mx-4">
                <Typography variant="body1" align="justify" >
                    Séléctionne au moins 3 créneaux sur lesquels tu es disponible.
                    <br />
                    <br />
                    Nous te contacterons pour te confirmer le créneau de ton rendez-vous,
                    selon les disponibilités des membres de Rezel et des techniciens Orange.
                    <br />
                    <br />
                    Le technicien peut se présenter à n'importe quel moment durant le créneau,
                    et l'installation peut durer jusqu'à une heure, même si cela déborde sur
                    la fin du créneau.
                </Typography>
            </div>
            <div className="flex flex-row gap-4 justify-center my-8">
                <Button variant="contained" disabled={selectedSlots.length < 3} onClick={() => onSubmitSelection(selectedSlots)}>Envoyer</Button>
            </div>
        </div>
    )
}