import { AppointmentSlot as AppointmentSlotType, isSameSlot } from "../../utils/types/types";

export default function AppointmentSlot({ slot, selectedSlots, onChange }: { slot: AppointmentSlotType, selectedSlots: AppointmentSlotType[], onChange: any }) {
    let colorStyle: string;
    const isSelected = selectedSlots.some(s => isSameSlot(s, slot));

    const id = "slot-" + slot.start.getTime();
    slot.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
        + "<br /> "
        + "de " + slot.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        + " à " + slot.end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    colorStyle = isSelected ? "border-blue-300 text-blue-500 bg-blue-50" : "border-gray-500 text-gray-500 bg-gray-50 hover:border-gray-400 group";

    return (
        <div>
            <label className={`flex flex-row place-content-between gap-4 px-3 py-1 border-solid border-2 rounded ${colorStyle}`} htmlFor={id}>
                <span>
                    {slot.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                    <br />
                    {slot.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} 
                    &nbsp;- {slot.end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <input type="checkbox" id={id} name="slots" onChange={() => onChange(slot)} checked={isSelected} />
            </label>
        </div>
    );
}