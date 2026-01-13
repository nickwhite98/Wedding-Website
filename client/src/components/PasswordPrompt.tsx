import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { colors } from "../theme";

interface PasswordPromptProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PasswordPrompt = ({
  open,
  onSuccess,
  onCancel,
}: PasswordPromptProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (password === correctPassword) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPassword("");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError(false);
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.cream,
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: "'Brightwall', cursive",
          color: colors.heading,
          textAlign: "center",
        }}
      >
        Admin Access
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ mb: 2, textAlign: "center", color: colors.body }}
          >
            Enter the admin password to continue
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            helperText={error ? "Incorrect password" : ""}
            placeholder="Password"
            sx={{
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": {
                  borderColor: colors.olive,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={handleClose}
            sx={{
              color: colors.body,
              "&:hover": {
                backgroundColor: "rgba(61, 79, 92, 0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: colors.olive,
              "&:hover": {
                backgroundColor: colors.eucalyptus,
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
