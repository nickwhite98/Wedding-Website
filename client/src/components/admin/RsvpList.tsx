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
  Snackbar,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
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
  rsvpEmail?: string | null;
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

interface EditingParty {
  invitationId: number;
  guestNames: string;
  stayingAtHotel: boolean | null;
  usingShuttle: boolean | null;
  rsvpEmail: string;
}

const TriStateToggle = ({
  value,
  onChange,
  disabled,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  disabled?: boolean;
}) => (
  <ToggleButtonGroup
    value={value === null ? "unanswered" : value ? "yes" : "no"}
    exclusive
    onChange={(_, val) =>
      val !== null &&
      onChange(val === "yes" ? true : val === "no" ? false : null)
    }
    fullWidth
    disabled={disabled}
    size="small"
    sx={{
      "& .MuiToggleButton-root.Mui-selected": {
        backgroundColor: colors.olive,
        color: "#fff",
        "&:hover": { backgroundColor: colors.eucalyptus },
      },
    }}
  >
    <ToggleButton value="yes">Yes</ToggleButton>
    <ToggleButton value="no">No</ToggleButton>
    <ToggleButton value="unanswered">No answer</ToggleButton>
  </ToggleButtonGroup>
);

export const RsvpList = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingParty, setEditingParty] = useState<EditingParty | null>(null);
  const [savingParty, setSavingParty] = useState(false);
  const [filter, setFilter] = useState<StatFilter>("responded");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

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

  const openPartyEditor = (invitation: Invitation) => {
    setEditingParty({
      invitationId: invitation.id,
      guestNames: invitation.guests
        .map((g) => `${g.firstName} ${g.lastName}`)
        .join(", "),
      stayingAtHotel: invitation.stayingAtHotel ?? null,
      usingShuttle: invitation.usingShuttle ?? null,
      rsvpEmail: invitation.rsvpEmail || "",
    });
  };

  const partyEmailValid =
    !editingParty?.rsvpEmail.trim() ||
    /^\S+@\S+\.\S+$/.test(editingParty.rsvpEmail.trim());

  const handleSaveParty = async () => {
    if (!editingParty || !partyEmailValid) return;
    try {
      setSavingParty(true);
      // Shuttle only applies to parties staying at the hotel (matches the
      // guest-facing RSVP flow, which only asks when hotel = yes).
      const usingShuttle =
        editingParty.stayingAtHotel === true ? editingParty.usingShuttle : null;
      const response = await fetch(
        `${API_BASE_URL}/invitations/${editingParty.invitationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stayingAtHotel: editingParty.stayingAtHotel,
            usingShuttle,
            rsvpEmail: editingParty.rsvpEmail.trim() || null,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to update party");
      setEditingParty(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update party");
    } finally {
      setSavingParty(false);
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
  const respondedWithEmail = invitations.filter(
    (inv) => inv.rsvpResponses.length > 0 && inv.rsvpEmail?.trim(),
  );
  const rsvpEmails = [
    ...new Set(
      respondedWithEmail.map((inv) => inv.rsvpEmail!.trim().toLowerCase()),
    ),
  ];

  const handleCopyEmails = async () => {
    try {
      await navigator.clipboard.writeText(rsvpEmails.join(", "));
      setCopyMessage(
        `Copied ${rsvpEmails.length} email${
          rsvpEmails.length === 1 ? "" : "s"
        } to clipboard`,
      );
    } catch {
      setCopyMessage("Couldn't copy — your browser blocked clipboard access");
    }
  };

  const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const downloadCsv = (filename: string, csv: string) => {
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEmailsCsv = () => {
    const rows = respondedWithEmail.map((inv) =>
      [
        `No. ${inv.id}`,
        inv.guests.map((g) => `${g.firstName} ${g.lastName}`).join(", "),
        inv.rsvpEmail!.trim(),
      ]
        .map(csvEscape)
        .join(","),
    );
    downloadCsv(
      "rsvp-emails.csv",
      ["Invitation,Guests,Email", ...rows].join("\n"),
    );
  };

  const handleDownloadGuestListCsv = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/guests`);
      if (!response.ok) throw new Error("Failed to fetch guests");
      const { data } = (await response.json()) as {
        data: (Guest & {
          invitationId?: number | null;
          rsvpResponse?: RsvpResponse | null;
        })[];
      };
      const guests = data.filter((g) => !g.isPlusOne || g.rsvpResponse);
      const rows = guests.map((guest) =>
        [
          guest.firstName,
          guest.lastName,
          guest.invitationId ? `No. ${guest.invitationId}` : "Unassigned",
          guest.rsvpResponse
            ? guest.rsvpResponse.isAttending
              ? "Yes"
              : "No"
            : "No Response",
          guest.isPlusOne ? "Yes" : "",
          guest.dietaryRestrictions || "",
        ]
          .map(csvEscape)
          .join(","),
      );
      downloadCsv(
        "guest-list.csv",
        [
          "First Name,Last Name,Invitation,Attending,Plus One,Dietary Restrictions",
          ...rows,
        ].join("\n"),
      );
      setCopyMessage(`Exported ${guests.length} guests`);
    } catch {
      setCopyMessage("Couldn't export the guest list — please try again");
    }
  };
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 3,
        }}
      >
        <Typography variant="caption" sx={{ color: colors.bodyLight }}>
          Click a card to filter the list below.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyEmails}
            disabled={rsvpEmails.length === 0}
            sx={{ borderColor: colors.olive, color: colors.olive }}
          >
            Copy RSVP Emails ({rsvpEmails.length})
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadEmailsCsv}
            disabled={rsvpEmails.length === 0}
            sx={{ borderColor: colors.olive, color: colors.olive }}
          >
            Export Emails
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadGuestListCsv}
            sx={{ borderColor: colors.olive, color: colors.olive }}
          >
            Export Guest List
          </Button>
        </Stack>
      </Box>

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
                  {(filter === "hotel" || filter === "shuttle") && (
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
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
                      {(filter === "hotel" || filter === "shuttle") && (
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openPartyEditor(invitation)}
                            sx={{ color: colors.olive }}
                            title="Edit party (hotel, shuttle, email)"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
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
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          No. {invitation.id}
                          <IconButton
                            size="small"
                            onClick={() => openPartyEditor(invitation)}
                            sx={{ color: colors.olive }}
                            title="Edit party (hotel, shuttle, email)"
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
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

      <Dialog
        open={!!editingParty}
        onClose={() => !savingParty && setEditingParty(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Party — Invitation No. {editingParty?.invitationId}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: colors.bodyLight }}>
              {editingParty?.guestNames}
            </Typography>
            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 1, color: colors.body, fontWeight: 600 }}
              >
                Staying at the hotel?
              </Typography>
              <TriStateToggle
                value={editingParty?.stayingAtHotel ?? null}
                onChange={(val) =>
                  editingParty &&
                  setEditingParty({
                    ...editingParty,
                    stayingAtHotel: val,
                    usingShuttle:
                      val === true ? editingParty.usingShuttle : null,
                  })
                }
              />
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 1, color: colors.body, fontWeight: 600 }}
              >
                Using the shuttle?
              </Typography>
              <TriStateToggle
                value={editingParty?.usingShuttle ?? null}
                onChange={(val) =>
                  editingParty &&
                  setEditingParty({ ...editingParty, usingShuttle: val })
                }
                disabled={editingParty?.stayingAtHotel !== true}
              />
              {editingParty?.stayingAtHotel !== true && (
                <Typography
                  variant="caption"
                  sx={{ color: colors.bodyLight, mt: 0.5, display: "block" }}
                >
                  Shuttle applies only to parties staying at the hotel.
                </Typography>
              )}
            </Box>
            <TextField
              fullWidth
              label="RSVP contact email"
              value={editingParty?.rsvpEmail ?? ""}
              onChange={(e) =>
                editingParty &&
                setEditingParty({ ...editingParty, rsvpEmail: e.target.value })
              }
              error={!partyEmailValid}
              helperText={
                !partyEmailValid
                  ? "Enter a valid email address (or leave blank)"
                  : "Used for the guest's edit link and the email export."
              }
            />
            <Alert severity="info" sx={{ py: 0 }}>
              Admin edits never send emails to guests or notifications to you.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditingParty(null)}
            disabled={savingParty}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveParty}
            variant="contained"
            disabled={savingParty || !partyEmailValid}
            sx={{ backgroundColor: colors.olive }}
          >
            {savingParty ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!copyMessage}
        autoHideDuration={3000}
        onClose={() => setCopyMessage(null)}
        message={copyMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};
