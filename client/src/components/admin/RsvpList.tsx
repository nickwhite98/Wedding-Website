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
  plusOne?: boolean;
  plusOneForGuestId?: number | null;
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
  phoneNumber?: string | null;
  inviteSent?: boolean;
  stayingAtHotel?: boolean | null;
  usingShuttle?: boolean | null;
  guests: (Guest & { rsvpResponse?: RsvpResponse })[];
  rsvpResponses: RsvpResponse[];
}

type StatFilter =
  | "responded"
  | "attending"
  | "notAttending"
  | "pending"
  | "hotel"
  | "shuttle"
  | "dietary"
  | "plusOnes";

const filterTitles: Record<StatFilter, string> = {
  responded: "RSVP Responses",
  attending: "Attending",
  notAttending: "Not Attending",
  pending: "Awaiting Response",
  hotel: "Staying at Hotel",
  shuttle: "Using Shuttle",
  dietary: "Dietary Restrictions",
  plusOnes: "Plus Ones",
};

const emptyMessages: Record<StatFilter, string> = {
  responded: "No RSVP responses yet.",
  attending: "No attending responses yet.",
  notAttending: "No declined responses yet.",
  pending: "Everyone has responded!",
  hotel: "No parties have said they're staying at the hotel yet.",
  shuttle: "No parties have said they're using the shuttle yet.",
  dietary: "No attending guests have dietary restrictions.",
  plusOnes: "No guests have been granted a plus one.",
};

const StatusChip = ({ response }: { response?: RsvpResponse }) =>
  response ? (
    <Chip
      size="small"
      label={response.isAttending ? "Attending" : "Not Attending"}
      color={response.isAttending ? "success" : "error"}
    />
  ) : (
    <Chip size="small" label="No Response" variant="outlined" />
  );

interface EditingRow {
  responseId: number;
  guest: Guest;
  isAttending: boolean;
  dietaryRestrictions: string;
}

export const RsvpList = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<StatFilter>("responded");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const invitationsRes = await fetch(`${API_BASE_URL}/invitations`);

      if (!invitationsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const invitationsData = await invitationsRes.json();

      setInvitations(invitationsData.data);
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

  const allResponseRows = invitations.flatMap((invitation) =>
    invitation.guests
      .filter(
        (guest): guest is Guest & { rsvpResponse: RsvpResponse } =>
          !!guest.rsvpResponse,
      )
      .map((guest) => ({ invitation, guest })),
  );

  const hasDietary = (guest: Guest & { rsvpResponse: RsvpResponse }) =>
    guest.rsvpResponse.isAttending && !!guest.dietaryRestrictions?.trim();

  const responseRows = allResponseRows.filter(({ guest }) =>
    filter === "attending"
      ? guest.rsvpResponse.isAttending
      : filter === "notAttending"
        ? !guest.rsvpResponse.isAttending
        : filter === "dietary"
          ? hasDietary(guest)
          : true,
  );

  const dietaryCount = allResponseRows.filter(({ guest }) =>
    hasDietary(guest),
  ).length;

  const pendingList = invitations.filter(
    (inv) => inv.rsvpResponses.length === 0,
  );
  const hotelList = invitations.filter((inv) => inv.stayingAtHotel === true);
  const shuttleList = invitations.filter((inv) => inv.usingShuttle === true);

  const plusOneRows = invitations.flatMap((invitation) =>
    invitation.guests
      .filter((g) => g.plusOne && !g.isPlusOne)
      .map((host) => ({
        invitation,
        host,
        plusOneGuest:
          invitation.guests.find((g) => g.plusOneForGuestId === host.id) ??
          null,
      })),
  );
  const bringingCount = plusOneRows.filter((r) => r.plusOneGuest).length;

  const respondedInvitationCount = invitations.filter(
    (inv) => inv.rsvpResponses.length > 0,
  ).length;
  const attendingRows = allResponseRows.filter(
    ({ guest }) => guest.rsvpResponse.isAttending,
  );
  const attendingPlusOnes = attendingRows.filter(
    ({ guest }) => guest.isPlusOne,
  ).length;
  const notAttendingCount = allResponseRows.length - attendingRows.length;
  const pendingPeople = pendingList.reduce(
    (sum, inv) => sum + inv.guests.length,
    0,
  );
  const countAttending = (inv: Invitation) =>
    inv.guests.filter((g) => g.rsvpResponse?.isAttending).length;
  const hotelPeople = hotelList.reduce(
    (sum, inv) => sum + countAttending(inv),
    0,
  );
  const shuttlePeople = shuttleList.reduce(
    (sum, inv) => sum + countAttending(inv),
    0,
  );

  const partyList =
    filter === "hotel"
      ? hotelList
      : filter === "shuttle"
        ? shuttleList
        : pendingList;

  return (
    <Box>
      {/* Stats Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 1,
        }}
      >
        {(
          [
            {
              label: "Responded",
              value: allResponseRows.length,
              sub: `${respondedInvitationCount} invitations`,
              color: colors.eucalyptus,
              filter: "responded",
            },
            {
              label: "Total Attending",
              value: attendingRows.length,
              sub: `incl. ${attendingPlusOnes} plus one${
                attendingPlusOnes === 1 ? "" : "s"
              }`,
              color: colors.terracotta,
              filter: "attending",
            },
            {
              label: "Not Attending",
              value: notAttendingCount,
              sub: "",
              color: colors.dustyRose,
              filter: "notAttending",
            },
            {
              label: "Awaiting Response",
              value: pendingPeople,
              sub: `${pendingList.length} invitations`,
              color: colors.cognac,
              filter: "pending",
            },
            {
              label: "Staying at Hotel",
              value: hotelPeople,
              sub: `${hotelList.length} parties`,
              color: colors.sage,
              filter: "hotel",
            },
            {
              label: "Using Shuttle",
              value: shuttlePeople,
              sub: `${shuttleList.length} parties`,
              color: colors.bronze,
              filter: "shuttle",
            },
            {
              label: "Dietary Restrictions",
              value: dietaryCount,
              sub: "attending guests",
              color: colors.burntSienna,
              filter: "dietary",
            },
            {
              label: "Plus Ones",
              value: plusOneRows.length,
              sub: `${bringingCount} bringing one`,
              color: colors.olive,
              filter: "plusOnes",
            },
          ] as const
        ).map((card) => (
          <Card
            key={card.filter}
            onClick={() => setFilter(card.filter)}
            sx={{
              backgroundColor: card.color,
              color: "white",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              outline:
                filter === card.filter
                  ? `3px solid ${colors.heading}`
                  : "3px solid transparent",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Typography variant="h4">{card.value}</Typography>
              <Typography variant="body2">{card.label}</Typography>
              {card.sub && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", opacity: 0.85 }}
                >
                  {card.sub}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
      <Typography
        variant="caption"
        sx={{ display: "block", mb: 3, color: colors.bodyLight }}
      >
        Click a card to filter the list below.
      </Typography>

      <Typography variant="h5" sx={{ mb: 2, color: colors.heading }}>
        {filterTitles[filter]} (
        {filter === "pending"
          ? `${pendingPeople} people across ${pendingList.length} invitations`
          : filter === "hotel"
            ? `${hotelPeople} people across ${hotelList.length} parties`
            : filter === "shuttle"
              ? `${shuttlePeople} people across ${shuttleList.length} parties`
              : filter === "plusOnes"
                ? `${bringingCount} of ${plusOneRows.length} bringing one`
                : responseRows.length}
        )
      </Typography>

      {filter === "plusOnes" ? (
        plusOneRows.length === 0 ? (
          <Alert severity="info">{emptyMessages.plusOnes}</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Guest</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Invitation</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Bringing a +1?
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Plus One</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>+1 Dietary</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plusOneRows.map(({ invitation, host, plusOneGuest }) => (
                  <TableRow key={host.id}>
                    <TableCell>
                      {host.firstName} {host.lastName}
                    </TableCell>
                    <TableCell>No. {invitation.id}</TableCell>
                    <TableCell>
                      <StatusChip response={host.rsvpResponse} />
                    </TableCell>
                    <TableCell>
                      {host.rsvpResponse ? (plusOneGuest ? "Yes" : "No") : "—"}
                    </TableCell>
                    <TableCell>
                      {plusOneGuest ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          {plusOneGuest.firstName} {plusOneGuest.lastName}
                          <StatusChip response={plusOneGuest.rsvpResponse} />
                        </Box>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {plusOneGuest?.dietaryRestrictions || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : filter === "pending" || filter === "hotel" || filter === "shuttle" ? (
        partyList.length === 0 ? (
          <Alert severity={filter === "pending" ? "success" : "info"}>
            {emptyMessages[filter]}
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Guests</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Invitation</TableCell>
                  {(filter === "hotel" || filter === "shuttle") && (
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      Attending
                    </TableCell>
                  )}
                  {filter === "hotel" && (
                    <TableCell sx={{ fontWeight: "bold" }}>Shuttle</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: "bold" }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Email(s)</TableCell>
                  {filter === "pending" && (
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Invite Sent
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {partyList.map((invitation) => {
                  const emails = invitation.guests
                    .map((g) => g.email)
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        {invitation.guests.length > 0 ? (
                          invitation.guests
                            .map((g) => `${g.firstName} ${g.lastName}`)
                            .join(", ")
                        ) : (
                          <em>No guests</em>
                        )}
                      </TableCell>
                      <TableCell>No. {invitation.id}</TableCell>
                      {(filter === "hotel" || filter === "shuttle") && (
                        <TableCell align="center">
                          {countAttending(invitation)}
                        </TableCell>
                      )}
                      {filter === "hotel" && (
                        <TableCell>
                          {invitation.usingShuttle == null
                            ? "—"
                            : invitation.usingShuttle
                              ? "Yes"
                              : "No"}
                        </TableCell>
                      )}
                      <TableCell>{invitation.phoneNumber || "—"}</TableCell>
                      <TableCell>{emails || "—"}</TableCell>
                      {filter === "pending" && (
                        <TableCell>
                          {invitation.inviteSent ? "Yes" : "No"}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : responseRows.length === 0 ? (
        <Alert severity="info">{emptyMessages[filter]}</Alert>
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
              {responseRows.map(({ invitation, guest }) => (
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
              ))}
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
