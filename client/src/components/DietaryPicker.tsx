import { Autocomplete, Box, Checkbox, Chip, TextField } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { DIETARY_OPTIONS } from "../services/rsvp.service";

interface Props {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  label?: string;
}

function parseValue(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function serialize(values: string[]): string {
  return values.map((v) => v.trim()).filter(Boolean).join(", ");
}

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export const DietaryPicker = ({
  value,
  onChange,
  disabled,
  label = "Dietary restrictions (optional)",
}: Props) => {
  return (
    <Box sx={{ maxWidth: 360 }}>
      <Autocomplete
        multiple
        freeSolo
        disableCloseOnSelect
        size="small"
        disabled={disabled}
        options={DIETARY_OPTIONS as unknown as string[]}
        value={parseValue(value)}
        onChange={(_, next) => onChange(serialize(next as string[]))}
        renderOption={(props, option, { selected }) => {
          const { key, ...rest } = props as typeof props & { key: string };
          return (
            <li key={key} {...rest}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                size="small"
                checked={selected}
                sx={{ mr: 1, p: 0.5 }}
              />
              {option}
            </li>
          );
        }}
        renderTags={(values, getTagProps) =>
          values.map((option, index) => {
            const { key, ...rest } = getTagProps({ index });
            return <Chip key={key} label={option} size="small" {...rest} />;
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={parseValue(value).length === 0 ? "None" : ""}
          />
        )}
      />
    </Box>
  );
};
