import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Stack,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { colors } from "../../theme";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  isPlusOne?: boolean;
  dietaryRestrictions?: string;
}

interface RsvpResponse {
  id: number;
  isAttending: boolean;
  respondedAt: string;
  guest: Guest;
}

interface Invitation {
  id: number;
  stayingAtHotel?: boolean | null;
  usingShuttle?: boolean | null;
  guests: (Guest & { rsvpResponse?: RsvpResponse })[];
  rsvpResponses: RsvpResponse[];
}

interface Stats {
  totalInvitations: number;
  totalGuests: number;
  respondedInvitations: number;
  attendingCount: number;
  notAttendingCount: number;
  pendingInvitations: number;
}

interface EditingRow {
  responseId: number;
  guest: Guest;
  isAttending: boolean;
  dietaryRestrictions: string;
}

export const RsvpList = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invitationsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/invitations`),
        fetch(`${API_BASE_URL}/invitations/stats`),
      ]);

      if (!invitationsRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const invitationsData = await invitationsRes.json();
      const statsData = await statsRes.json();

      setInvitations(invitationsData.data);
      setStats(statsData.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RSVPs");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (
    guest: Guest & { rsvpResponse?: RsvpResponse },
  ) => {
    if (!guest.rsvpResponse) return;
    setEditing({
      responseId: guest.rsvpResponse.id,
      guest,
      isAttending: guest.rsvpResponse.isAttending,
      dietaryRestrictions: guest.dietaryRestrictions || "",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      const response = await fetch(
        `${API_BASE_URL}/rsvp/admin/response/${editing.responseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isAttending: editing.isAttending,
            dietaryRestrictions: editing.dietaryRestrictions.trim() || null,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to update RSVP");
      setEditing(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update RSVP");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    guest: Guest & { rsvpResponse?: RsvpResponse },
  ) => {
    if (!guest.rsvpResponse) return;
    const isPlusOne = guest.isPlusOne;
    const confirmMsg = isPlusOne
      ? `Delete the RSVP for plus-one "${guest.firstName} ${guest.lastName}"? This also removes the plus-one guest from the invitation.`
      : `Delete RSVP for "${guest.firstName} ${guest.lastName}"? The guest stays in the list but returns to "no response" status.`;
    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/rsvp/admin/response/${guest.rsvpResponse.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete RSVP");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete RSVP");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress sx={{ color: colors.olive }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const respondedInvitations = invitations.filter(
    (inv) => inv.rsvpResponses.length > 0,
  );

  return (
    <Box>
      {/* Stats Cards */}
      {stats && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            mb: 4,
          }}
        >
          <Card sx={{ backgroundColor: colors.sage, color: "white" }}>
            <CardContent>
              <Typography variant="h4">{stats.totalInvitations}</Typography>
              <Typography variant="body2">Total Invitations</Typography>
            </CardContent>
          </Card>
          <Card sx={{ backgroundColor: colors.eucalyptus, color: "white" }}>
            <CardContent>
              <Typography variant="h4">{stats.respondedInvitations}</Typography>
              <Typography variant="body2">Responded</Typography>
            </CardContent>
          </Card>
          <Card sx={{ backgroundColor: colors.terracotta, color: "white" }}>
            <CardContent>
              <Typography variant="h4">{stats.attendingCount}</Typography>
              <Typography variant="body2">Attending</Typography>
            </CardContent>
          </Card>
          <Card sx={{ backgroundColor: colors.dustyRose, color: "white" }}>
            <CardContent>
              <Typography variant="h4">{stats.notAttendingCount}</Typography>
              <Typography variant="body2">Not Attending</Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      <Typography variant="h5" sx={{ mb: 2, color: colors.heading }}>
        RSVP Responses ({respondedInvitations.length})
      </Typography>

      {respondedInvitations.length === 0 ? (
        <Alert severity="info">No RSVP responses yet.</Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Guest Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Invitation</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Hotel</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Shuttle</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Dietary</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Responded</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {respondedInvitations.map((invitation) =>
                invitation.guests.map((guest) =>
                  guest.rsvpResponse ? (
                    <TableRow key={guest.rsvpResponse.id}>
                      <TableCell>
                        {guest.firstName} {guest.lastName}
                      </TableCell>
                      <TableCell>
                        {guest.isPlusOne ? (
                          <Chip
                            size="small"
                            label="+1"
                            sx={{
                              backgroundColor: colors.dustyRose,
                              color: colors.heading,
                              fontWeight: 700,
                            }}
                          />
                        ) : (
                          "Primary"
                        )}
                      </TableCell>
                      <TableCell>No. {invitation.id}</TableCell>
                      <TableCell>
                        {invitation.stayingAtHotel == null
                          ? "—"
                          : invitation.stayingAtHotel
                            ? "Yes"
                            : "No"}
                      </TableCell>
                      <TableCell>
                        {!invitation.stayingAtHotel
                          ? "—"
                          : invitation.usingShuttle == null
                            ? "—"
                            : invitation.usingShuttle
                              ? "Yes"
                              : "No"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            guest.rsvpResponse.isAttending
                              ? "Attending"
                              : "Not Attending"
                          }
                          color={
                            guest.rsvpResponse.isAttending
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {guest.dietaryRestrictions || "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(
                          guest.rsvpResponse.respondedAt,
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(guest)}
                          sx={{ color: colors.olive }}
                          title="Edit response"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(guest)}
                          sx={{ color: colors.burntSienna }}
                          title="Delete RSVP (revert to no response)"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ) : null,
                ),
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit RSVP — {editing?.guest.firstName} {editing?.guest.lastName}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 1, color: colors.body, fontWeight: 600 }}
              >
                Attendance
              </Typography>
              <ToggleButtonGroup
                value={editing?.isAttending ?? null}
                exclusive
                onChange={(_, val) =>
                  val !== null &&
                  editing &&
                  setEditing({ ...editing, isAttending: val })
                }
                fullWidth
              >
                <ToggleButton
                  value={true}
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: colors.olive,
                      color: "#fff",
                      "&:hover": { backgroundColor: colors.eucalyptus },
                    },
                  }}
                >
                  Attending
                </ToggleButton>
                <ToggleButton
                  value={false}
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: colors.burntSienna,
                      color: "#fff",
                      "&:hover": { backgroundColor: colors.terracotta },
                    },
                  }}
                >
                  Not Attending
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <TextField
              fullWidth
              label="Dietary restrictions"
              multiline
              rows={2}
              value={editing?.dietaryRestrictions ?? ""}
              onChange={(e) =>
                editing &&
                setEditing({
                  ...editing,
                  dietaryRestrictions: e.target.value,
                })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{ backgroundColor: colors.olive }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
