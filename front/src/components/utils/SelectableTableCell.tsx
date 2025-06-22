import React, { useState } from 'react';
import {
  TableCell,
  Popover,
  Checkbox,
  FormControlLabel,
  Box,
} from '@mui/material';

interface SelectableTableCellProps {
  selectedFields: string[];
  possibleFields: string[];
  onChange: (newSelected: string[]) => void;
  children: React.ReactNode;
}

const SelectableTableCell: React.FC<SelectableTableCellProps> = ({
  selectedFields,
  possibleFields,
  onChange,
  children,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const toggleField = (field: string) => {
    const updated = selectedFields.includes(field)
      ? selectedFields.filter(f => f !== field)
      : [...selectedFields, field];
    onChange(updated);
  };

  return (
    <>
      <TableCell onClick={handleClick} className="cursor-pointer hover:bg-gray-100">
        {children}
      </TableCell>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box p={2}>
          {possibleFields.map(field => (
            <>
                <FormControlLabel
                key={field}
                control={
                    <Checkbox
                    checked={selectedFields.includes(field)}
                    onChange={() => toggleField(field)}
                    />
                }
                label={field}
                />
                <br />
            </>
          ))}
        </Box>
      </Popover>
    </>
  );
};

export default SelectableTableCell;
