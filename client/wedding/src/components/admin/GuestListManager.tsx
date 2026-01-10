import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { colors } from "../../theme";

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Invitation {
  id: number;
  primaryEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  plusOne: boolean;
  guests: Guest[];
}

export const GuestListManager = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [currentInvitationId, setCurrentInvitationId] = useState<number | null>(null);

  // Form state for invitation
  const [invitationForm, setInvitationForm] = useState({
    primaryEmail: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    plusOne: false,
  });

  // Form state for guest
  const [guestForm, setGuestForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/api/invitations");
      if (!response.ok) throw new Error("Failed to fetch invitations");
      const data = await response.json();
      setInvitations(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (invitation?: Invitation) => {
    if (invitation) {
      setEditingInvitation(invitation);
      setInvitationForm({
        primaryEmail: invitation.primaryEmail || "",
        address: invitation.address || "",
        city: invitation.city || "",
        state: invitation.state || "",
        zip: invitation.zip || "",
        plusOne: invitation.plusOne,
      });
    } else {
      setEditingInvitation(null);
      setInvitationForm({
        primaryEmail: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        plusOne: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInvitation(null);
  };

  const handleSaveInvitation = async () => {
    try {
      const url = editingInvitation
        ? `http://localhost:3001/api/invitations/${editingInvitation.id}`
        : "http://localhost:3001/api/invitations";

      const method = editingInvitation ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invitationForm),
      });

      if (!response.ok) throw new Error("Failed to save invitation");

      await fetchInvitations();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invitation");
    }
  };

  const handleDeleteInvitation = async (id: number) => {
    if (!confirm("Are you sure? This will delete all guests and RSVPs for this invitation.")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/invitations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete invitation");
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete invitation");
    }
  };

  const handleOpenGuestDialog = (invitationId: number) => {
    setCurrentInvitationId(invitationId);
    setGuestForm({ firstName: "", lastName: "", email: "" });
    setGuestDialogOpen(true);
  };

  const handleCloseGuestDialog = () => {
    setGuestDialogOpen(false);
    setCurrentInvitationId(null);
  };

  const handleSaveGuest = async () => {
    if (!currentInvitationId) return;

    try {
      const response = await fetch("http://localhost:3001/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...guestForm,
          invitation: { connect: { id: currentInvitationId } },
        }),
      });

      if (!response.ok) throw new Error("Failed to add guest");

      await fetchInvitations();
      handleCloseGuestDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add guest");
    }
  };

  const handleDeleteGuest = async (guestId: number) => {
    if (!confirm("Are you sure you want to delete this guest?")) return;

    try {
      const response = await fetch(`http://localhost:3001/api/guests/${guestId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete guest");
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete guest");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress sx={{ color: colors.olive }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ color: colors.cognac }}>
          Guest List ({invitations.length} invitations)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: colors.olive,
            "&:hover": { backgroundColor: colors.eucalyptus },
          }}
        >
          New Invitation
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Guests</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Plus One</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  {invitation.guests.map((guest) => (
                    <Box key={guest.id} sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                      <Typography variant="body2">
                        {guest.firstName} {guest.lastName}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteGuest(guest.id)}
                        sx={{ ml: 1, color: colors.burntSienna }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    onClick={() => handleOpenGuestDialog(invitation.id)}
                    sx={{ mt: 1, color: colors.olive }}
                  >
                    + Add Guest
                  </Button>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{invitation.primaryEmail || "-"}</Typography>
                  <Typography variant="caption" sx={{ color: colors.softNavy }}>
                    {invitation.address && `${invitation.address}, ${invitation.city}, ${invitation.state} ${invitation.zip}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  {invitation.plusOne ? (
                    <Chip label="Yes" color="success" size="small" />
                  ) : (
                    <Chip label="No" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(invitation)} sx={{ color: colors.olive }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteInvitation(invitation.id)} sx={{ color: colors.burntSienna }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Invitation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingInvitation ? "Edit Invitation" : "New Invitation"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Primary Email"
            value={invitationForm.primaryEmail}
            onChange={(e) => setInvitationForm({ ...invitationForm, primaryEmail: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Address"
            value={invitationForm.address}
            onChange={(e) => setInvitationForm({ ...invitationForm, address: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="City"
              value={invitationForm.city}
              onChange={(e) => setInvitationForm({ ...invitationForm, city: e.target.value })}
              sx={{ flex: 2 }}
            />
            <TextField
              label="State"
              value={invitationForm.state}
              onChange={(e) => setInvitationForm({ ...invitationForm, state: e.target.value })}
              sx={{ flex: 1 }}
            />
            <TextField
              label="ZIP"
              value={invitationForm.zip}
              onChange={(e) => setInvitationForm({ ...invitationForm, zip: e.target.value })}
              sx={{ flex: 1 }}
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={invitationForm.plusOne}
                onChange={(e) => setInvitationForm({ ...invitationForm, plusOne: e.target.checked })}
              />
            }
            label="Allow Plus One"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveInvitation} variant="contained" sx={{ backgroundColor: colors.olive }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Guest Dialog */}
      <Dialog open={guestDialogOpen} onClose={handleCloseGuestDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Guest</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="First Name"
            value={guestForm.firstName}
            onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={guestForm.lastName}
            onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email (optional)"
            value={guestForm.email}
            onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGuestDialog}>Cancel</Button>
          <Button onClick={handleSaveGuest} variant="contained" sx={{ backgroundColor: colors.olive }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
