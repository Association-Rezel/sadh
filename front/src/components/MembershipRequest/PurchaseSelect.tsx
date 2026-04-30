import {
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    ListItemButton,
} from "@mui/material";


export default function PurchaseSelect({ availableItems = [], itemsChecked, setItemsChecked, disabled = false }: {
    availableItems: { itemId: string, displayName: string, price: number }[],
    setItemsChecked: (fn: (prev: string[]) => string[]) => void,
    itemsChecked: string[],
    disabled?: boolean,
}) {
    const handleToggle = (item: string) => () => {
        if (disabled) return;
        setItemsChecked((prev) => {
            if (prev.includes(item)) {
                return prev.filter((i) => i !== item);
            }
            return [...prev, item];
        });
    };

    return <List>
        {availableItems.map((value) => {
            const labelId = `checkbox-list-label-${value}`;

            return (
                <ListItem
                    key={value.itemId}
                    disablePadding
                >
                    <ListItemButton onClick={handleToggle(value.itemId)} dense disabled={disabled}>
                        <ListItemIcon>
                            <Checkbox
                                edge="start"
                                checked={itemsChecked.includes(value.itemId)}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': labelId }}
                            />
                        </ListItemIcon>
                        <ListItemText id={labelId} primary={`${value.displayName} (${value.price} €)`}/>
                    </ListItemButton>
                </ListItem>
            );
        })}
    </List>
}