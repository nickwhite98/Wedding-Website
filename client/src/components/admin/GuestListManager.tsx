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
  CircularProgress,
  Alert,
  Chip,
  Checkbox,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Collapse,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  DeleteSweep as DeleteSweepIcon,
  SwapHoriz as SwapHorizIcon,
  PersonRemove as PersonRemoveIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from "@mui/icons-material";
import { colors } from "../../theme";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

interface RsvpResponse {
  id: number;
  isAttending: boolean;
  respondedAt: string;
}

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  menuChoice?: string;
  dietaryRestrictions?: string;
  plusOne?: boolean;
  isPlusOne?: boolean;
  invitationId?: number;
  invitation?: Invitation;
  rsvpResponse?: RsvpResponse | null;
}

interface Invitation {
  id: number;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phoneNumber?: string;
  saveTheDateSent: boolean;
  inviteSent: boolean;
  tableNumber?: number;
  notes?: string;
  guests: Guest[];
  rsvpResponses?: RsvpResponse[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const RsvpStatusChip = ({ guest }: { guest: Guest }) =>
  guest.rsvpResponse ? (
    <Chip
      size="small"
      label={guest.rsvpResponse.isAttending ? "Attending" : "Not Attending"}
      color={guest.rsvpResponse.isAttending ? "success" : "error"}
    />
  ) : (
    <Chip size="small" label="No Response" variant="outlined" />
  );

export const GuestListManager = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);

  // Filtering and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Guest dialog
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestForm, setGuestForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dietaryRestrictions: "",
    menuChoice: "",
    plusOne: false,
  });

  // Move guest dialog
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movingGuest, setMovingGuest] = useState<Guest | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<number | "">("");

  // Group into invitation dialog
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [invitationForm, setInvitationForm] = useState({
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phoneNumber: "",
    saveTheDateSent: false,
    inviteSent: false,
    tableNumber: "",
    notes: "",
  });

  // Create blank invitation dialog
  const [createInvitationDialogOpen, setCreateInvitationDialogOpen] =
    useState(false);
  const [newInvitationForm, setNewInvitationForm] = useState({
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phoneNumber: "",
    saveTheDateSent: false,
    inviteSent: false,
    tableNumber: "",
    notes: "",
  });
  const [creatingInvitation, setCreatingInvitation] = useState(false);

  // Edit invitation dialog
  const [editInvitationDialogOpen, setEditInvitationDialogOpen] =
    useState(false);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(
    null,
  );
  const [editInvitationForm, setEditInvitationForm] = useState({
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phoneNumber: "",
    saveTheDateSent: false,
    inviteSent: false,
    tableNumber: "",
    notes: "",
  });
  const [savingInvitation, setSavingInvitation] = useState(false);

  // Add existing guests to invitation dialog
  const [addExistingDialogOpen, setAddExistingDialogOpen] = useState(false);
  const [addExistingTargetId, setAddExistingTargetId] = useState<number | null>(
    null,
  );
  const [addExistingSelected, setAddExistingSelected] = useState<Guest[]>([]);
  const [addingExisting, setAddingExisting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [guestsRes, invitationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/guests`),
        fetch(`${API_BASE_URL}/invitations`),
      ]);

      if (!guestsRes.ok || !invitationsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const guestsData = await guestsRes.json();
      const invitationsData = await invitationsRes.json();

      setGuests(guestsData.data);
      setInvitations(invitationsData.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGuestDialog = (guest?: Guest) => {
    if (guest) {
      setEditingGuest(guest);
      setGuestForm({
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email || "",
        dietaryRestrictions: guest.dietaryRestrictions || "",
        menuChoice: guest.menuChoice || "",
        plusOne: !!guest.plusOne,
      });
    } else {
      setEditingGuest(null);
      setGuestForm({
        firstName: "",
        lastName: "",
        email: "",
        dietaryRestrictions: "",
        menuChoice: "",
        plusOne: false,
      });
    }
    setGuestDialogOpen(true);
  };

  const handleCloseGuestDialog = () => {
    setGuestDialogOpen(false);
    setEditingGuest(null);
  };

  const handleSaveGuest = async () => {
    try {
      const url = editingGuest
        ? `${API_BASE_URL}/guests/${editingGuest.id}`
        : `${API_BASE_URL}/guests`;

      const method = editingGuest ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guestForm),
      });

      if (!response.ok) throw new Error("Failed to save guest");

      await fetchData();
      handleCloseGuestDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save guest");
    }
  };

  const handleDeleteGuest = async (id: number) => {
    if (!confirm("Are you sure you want to delete this guest?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/guests/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete guest");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete guest");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGuests.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedGuests.length} guest(s)?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/guests/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: selectedGuests }),
      });

      if (!response.ok) throw new Error("Failed to delete guests");

      setSelectedGuests([]);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete guests");
    }
  };

  const handleToggleGuest = (guestId: number) => {
    setSelectedGuests((prev) =>
      prev.includes(guestId)
        ? prev.filter((id) => id !== guestId)
        : [...prev, guestId],
    );
  };

  const handleSelectAll = (guestList: Guest[]) => {
    const allIds = guestList.map((g) => g.id);
    const allSelected = allIds.every((id) => selectedGuests.includes(id));

    if (allSelected) {
      // Deselect all from this list
      setSelectedGuests((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      // Select all from this list
      setSelectedGuests((prev) => [
        ...prev.filter((id) => !allIds.includes(id)),
        ...allIds,
      ]);
    }
  };

  const handleOpenMoveDialog = (guest: Guest) => {
    setMovingGuest(guest);
    setMoveTargetId("");
    setMoveDialogOpen(true);
  };

  const handleCloseMoveDialog = () => {
    setMoveDialogOpen(false);
    setMovingGuest(null);
    setMoveTargetId("");
  };

  const handleConfirmMove = async () => {
    if (!movingGuest) return;
    const targetId = moveTargetId === "" ? null : Number(moveTargetId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/guests/${movingGuest.id}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: targetId }),
        },
      );
      if (!response.ok) throw new Error("Failed to move guest");
      await fetchData();
      handleCloseMoveDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move guest");
    }
  };

  const handleUnassignGuest = async (guest: Guest) => {
    if (
      !confirm(
        `Remove ${guest.firstName} ${guest.lastName} from their invitation? They will remain in the guest list as unassigned.`,
      )
    ) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/guests/${guest.id}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: null }),
        },
      );
      if (!response.ok) throw new Error("Failed to unassign guest");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unassign guest");
    }
  };

  const handleOpenGroupDialog = () => {
    if (selectedGuests.length === 0) {
      alert("Please select at least one guest to group into an invitation");
      return;
    }
    setInvitationForm({
      address: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phoneNumber: "",
      saveTheDateSent: false,
      inviteSent: false,
      tableNumber: "",
      notes: "",
    });
    setGroupDialogOpen(true);
  };

  const handleCloseGroupDialog = () => {
    setGroupDialogOpen(false);
  };

  const handleOpenCreateInvitationDialog = () => {
    setNewInvitationForm({
      address: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phoneNumber: "",
      saveTheDateSent: false,
      inviteSent: false,
      tableNumber: "",
      notes: "",
    });
    setCreateInvitationDialogOpen(true);
  };

  const handleCloseCreateInvitationDialog = () => {
    setCreateInvitationDialogOpen(false);
  };

  const handleOpenAddExistingDialog = (invitationId: number) => {
    setAddExistingTargetId(invitationId);
    setAddExistingSelected([]);
    setAddExistingDialogOpen(true);
  };

  const handleCloseAddExistingDialog = () => {
    setAddExistingDialogOpen(false);
    setAddExistingTargetId(null);
    setAddExistingSelected([]);
  };

  const handleConfirmAddExisting = async () => {
    if (addExistingTargetId === null || addExistingSelected.length === 0) return;
    try {
      setAddingExisting(true);
      await Promise.all(
        addExistingSelected.map((g) =>
          fetch(`${API_BASE_URL}/guests/${g.id}/assign`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invitationId: addExistingTargetId }),
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed to assign ${g.firstName} ${g.lastName}`);
          }),
        ),
      );
      await fetchData();
      handleCloseAddExistingDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add guests");
    } finally {
      setAddingExisting(false);
    }
  };

  const handleCreateBlankInvitation = async () => {
    try {
      setCreatingInvitation(true);
      const payload: Record<string, unknown> = {
        address: newInvitationForm.address || null,
        address2: newInvitationForm.address2 || null,
        city: newInvitationForm.city || null,
        state: newInvitationForm.state || null,
        zip: newInvitationForm.zip || null,
        country: newInvitationForm.country || null,
        phoneNumber: newInvitationForm.phoneNumber || null,
        saveTheDateSent: newInvitationForm.saveTheDateSent,
        inviteSent: newInvitationForm.inviteSent,
        tableNumber: newInvitationForm.tableNumber
          ? parseInt(newInvitationForm.tableNumber)
          : null,
        notes: newInvitationForm.notes || null,
      };

      const response = await fetch(`${API_BASE_URL}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create invitation");

      await fetchData();
      setCurrentTab(1);
      handleCloseCreateInvitationDialog();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create invitation",
      );
    } finally {
      setCreatingInvitation(false);
    }
  };

  const handleOpenEditInvitationDialog = (invitation: Invitation) => {
    setEditingInvitation(invitation);
    setEditInvitationForm({
      address: invitation.address || "",
      address2: invitation.address2 || "",
      city: invitation.city || "",
      state: invitation.state || "",
      zip: invitation.zip || "",
      country: invitation.country || "",
      phoneNumber: invitation.phoneNumber || "",
      saveTheDateSent: invitation.saveTheDateSent,
      inviteSent: invitation.inviteSent,
      tableNumber:
        invitation.tableNumber != null ? String(invitation.tableNumber) : "",
      notes: invitation.notes || "",
    });
    setEditInvitationDialogOpen(true);
  };

  const handleCloseEditInvitationDialog = () => {
    setEditInvitationDialogOpen(false);
    setEditingInvitation(null);
  };

  const handleSaveInvitation = async () => {
    if (!editingInvitation) return;
    try {
      setSavingInvitation(true);
      const payload: Record<string, unknown> = {
        address: editInvitationForm.address || null,
        address2: editInvitationForm.address2 || null,
        city: editInvitationForm.city || null,
        state: editInvitationForm.state || null,
        zip: editInvitationForm.zip || null,
        country: editInvitationForm.country || null,
        phoneNumber: editInvitationForm.phoneNumber || null,
        saveTheDateSent: editInvitationForm.saveTheDateSent,
        inviteSent: editInvitationForm.inviteSent,
        tableNumber: editInvitationForm.tableNumber
          ? parseInt(editInvitationForm.tableNumber)
          : null,
        notes: editInvitationForm.notes || null,
      };

      const response = await fetch(
        `${API_BASE_URL}/invitations/${editingInvitation.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("Failed to update invitation");

      await fetchData();
      handleCloseEditInvitationDialog();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update invitation",
      );
    } finally {
      setSavingInvitation(false);
    }
  };

  const handleCreateInvitation = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/import/assign-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestIds: selectedGuests,
          invitationData: {
            ...invitationForm,
            tableNumber: invitationForm.tableNumber
              ? parseInt(invitationForm.tableNumber)
              : null,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create invitation");

      await fetchData();
      setSelectedGuests([]);
      handleCloseGroupDialog();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create invitation",
      );
    }
  };

  // Filter and sort guests
  const filterAndSortGuests = (guestList: Guest[]) => {
    let filtered = guestList;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((g) =>
        `${g.firstName} ${g.lastName} ${g.email || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareA: string, compareB: string;

      if (sortBy === "name") {
        compareA = `${a.lastName} ${a.firstName}`.toLowerCase();
        compareB = `${b.lastName} ${b.firstName}`.toLowerCase();
      } else {
        compareA = (a.email || "").toLowerCase();
        compareB = (b.email || "").toLowerCase();
      }

      if (sortOrder === "asc") {
        return compareA.localeCompare(compareB);
      } else {
        return compareB.localeCompare(compareA);
      }
    });

    return filtered;
  };

  const unassignedGuests = filterAndSortGuests(
    guests.filter((g) => !g.invitationId),
  );
  const allGuests = filterAndSortGuests(guests);

  const filteredInvitations = (() => {
    if (!searchTerm) return invitations;
    const term = searchTerm.toLowerCase();
    return invitations.filter((inv) => {
      const idMatch = String(inv.id).includes(term);
      const addrMatch = [
        inv.address,
        inv.address2,
        inv.city,
        inv.state,
        inv.zip,
        inv.country,
        inv.phoneNumber,
        inv.notes,
      ]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
      const guestMatch = inv.guests.some((g) =>
        `${g.firstName} ${g.lastName} ${g.email || ""}`
          .toLowerCase()
          .includes(term),
      );
      return idMatch || addrMatch || guestMatch;
    });
  })();

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
        <Typography variant="h5" sx={{ color: colors.heading }}>
          Guest Management ({guests.length} total guests)
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {selectedGuests.length > 0 && (
            <>
              <Button
                variant="contained"
                startIcon={<DeleteSweepIcon />}
                onClick={handleBulkDelete}
                sx={{
                  backgroundColor: colors.burntSienna,
                  "&:hover": { backgroundColor: colors.terracotta },
                }}
              >
                Delete {selectedGuests.length}
              </Button>
              <Button
                variant="contained"
                startIcon={<GroupIcon />}
                onClick={handleOpenGroupDialog}
                sx={{
                  backgroundColor: colors.eucalyptus,
                  "&:hover": { backgroundColor: colors.sage },
                }}
              >
                Group {selectedGuests.length} into Invitation
              </Button>
            </>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateInvitationDialog}
            sx={{
              backgroundColor: colors.eucalyptus,
              "&:hover": { backgroundColor: colors.sage },
            }}
          >
            Add Invitation
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenGuestDialog()}
            sx={{
              backgroundColor: colors.olive,
              "&:hover": { backgroundColor: colors.eucalyptus },
            }}
          >
            Add Guest
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters and Sorting */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Search guests"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e) => setSortBy(e.target.value as "name" | "email")}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="email">Email</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={sortOrder}
            label="Order"
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Tabs
        value={currentTab}
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{
          mb: 2,
          "& .MuiTab-root": {
            color: colors.body,
            "&.Mui-selected": {
              color: colors.heading,
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: colors.olive,
          },
        }}
      >
        <Tab label={`Unassigned (${unassignedGuests.length})`} />
        <Tab label={`Assigned (${invitations.length} invitations)`} />
        <Tab label={`All Guests (${allGuests.length})`} />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        <GuestTable
          guests={unassignedGuests}
          selectedGuests={selectedGuests}
          onToggleGuest={handleToggleGuest}
          onSelectAll={() => handleSelectAll(unassignedGuests)}
          onEditGuest={handleOpenGuestDialog}
          onDeleteGuest={handleDeleteGuest}
          onMoveGuest={handleOpenMoveDialog}
          onUnassignGuest={handleUnassignGuest}
          showSelection={true}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <InvitationCardGrid
          invitations={filteredInvitations}
          totalCount={invitations.length}
          unassignedGuestCount={
            guests.filter((g) => !g.invitationId).length
          }
          onEditGuest={handleOpenGuestDialog}
          onDeleteGuest={handleDeleteGuest}
          onMoveGuest={handleOpenMoveDialog}
          onUnassignGuest={handleUnassignGuest}
          onAddExistingGuests={handleOpenAddExistingDialog}
          onEditInvitation={handleOpenEditInvitationDialog}
          onRefresh={fetchData}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <GuestTable
          guests={allGuests}
          selectedGuests={selectedGuests}
          onToggleGuest={handleToggleGuest}
          onSelectAll={() => handleSelectAll(allGuests)}
          onEditGuest={handleOpenGuestDialog}
          onDeleteGuest={handleDeleteGuest}
          onMoveGuest={handleOpenMoveDialog}
          onUnassignGuest={handleUnassignGuest}
          showSelection={true}
        />
      </TabPanel>

      {/* Guest Dialog */}
      <Dialog
        open={guestDialogOpen}
        onClose={handleCloseGuestDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingGuest ? "Edit Guest" : "Add Guest"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="First Name"
            value={guestForm.firstName}
            onChange={(e) =>
              setGuestForm({ ...guestForm, firstName: e.target.value })
            }
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={guestForm.lastName}
            onChange={(e) =>
              setGuestForm({ ...guestForm, lastName: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email (optional)"
            value={guestForm.email}
            onChange={(e) =>
              setGuestForm({ ...guestForm, email: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Dietary Restrictions (optional)"
            value={guestForm.dietaryRestrictions}
            onChange={(e) =>
              setGuestForm({
                ...guestForm,
                dietaryRestrictions: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Menu Choice (optional)"
            value={guestForm.menuChoice}
            onChange={(e) =>
              setGuestForm({ ...guestForm, menuChoice: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1.5,
              borderRadius: 1,
              border: `1px solid ${colors.mushroom}`,
              backgroundColor: guestForm.plusOne
                ? colors.warmIvory
                : "transparent",
            }}
          >
            <Checkbox
              checked={guestForm.plusOne}
              onChange={(e) =>
                setGuestForm({ ...guestForm, plusOne: e.target.checked })
              }
            />
            <Box>
              <Typography sx={{ color: colors.body, fontWeight: 600 }}>
                Allow this guest to bring a +1
              </Typography>
              <Typography variant="caption" sx={{ color: colors.bodyLight }}>
                Each guest manages their own plus-one at RSVP time.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGuestDialog}>Cancel</Button>
          <Button
            onClick={handleSaveGuest}
            variant="contained"
            sx={{ backgroundColor: colors.olive }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move Guest Dialog */}
      <Dialog
        open={moveDialogOpen}
        onClose={handleCloseMoveDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Move {movingGuest?.firstName} {movingGuest?.lastName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: colors.body }}>
            {movingGuest?.invitationId
              ? `Currently assigned to Invitation No. ${movingGuest.invitationId}. Select a new invitation or choose "Unassigned" to remove them from any invitation.`
              : "This guest is currently unassigned. Select an invitation to add them to."}
          </Typography>
          {(() => {
            const UNASSIGNED_OPTION = { id: -1 as const };
            type Option = { id: number } & Partial<Invitation>;
            const options: Option[] = [
              UNASSIGNED_OPTION,
              ...invitations.filter(
                (inv) => inv.id !== movingGuest?.invitationId,
              ),
            ];
            const selected =
              moveTargetId === ""
                ? UNASSIGNED_OPTION
                : options.find((o) => o.id === moveTargetId) || null;
            const describe = (opt: Option) => {
              if (opt.id === -1) return "Unassigned (remove from invitation)";
              const names =
                opt.guests
                  ?.map((g) => `${g.firstName} ${g.lastName}`)
                  .join(", ") || "(no guests)";
              const location = [opt.city, opt.state]
                .filter(Boolean)
                .join(", ");
              return [`No. ${opt.id}`, names, location]
                .filter(Boolean)
                .join(" — ");
            };
            return (
              <Autocomplete
                value={selected}
                options={options}
                getOptionLabel={describe}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                filterOptions={(opts, state) => {
                  const q = state.inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter((opt) => {
                    if (opt.id === -1) return "unassigned".includes(q);
                    const haystack = [
                      `no. ${opt.id}`,
                      `${opt.id}`,
                      opt.address,
                      opt.address2,
                      opt.city,
                      opt.state,
                      opt.zip,
                      opt.country,
                      opt.phoneNumber,
                      opt.notes,
                      ...(opt.guests?.map(
                        (g) => `${g.firstName} ${g.lastName} ${g.email || ""}`,
                      ) || []),
                    ]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase();
                    return haystack.includes(q);
                  });
                }}
                onChange={(_, val) => {
                  if (!val || val.id === -1) setMoveTargetId("");
                  else setMoveTargetId(val.id);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search invitations by id, address, or guest name"
                    autoFocus
                    sx={{ mt: 1 }}
                  />
                )}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    {opt.id === -1 ? (
                      <em>Unassigned (remove from invitation)</em>
                    ) : (
                      describe(opt)
                    )}
                  </li>
                )}
              />
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMoveDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmMove}
            variant="contained"
            sx={{ backgroundColor: colors.olive }}
          >
            Confirm Move
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group into Invitation Dialog */}
      <Dialog
        open={groupDialogOpen}
        onClose={handleCloseGroupDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Invitation for Selected Guests</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: colors.body }}>
            Creating invitation for {selectedGuests.length} guest(s)
          </Typography>

          <TextField
            fullWidth
            label="Address"
            value={invitationForm.address}
            onChange={(e) =>
              setInvitationForm({ ...invitationForm, address: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Address 2 (optional)"
            value={invitationForm.address2}
            onChange={(e) =>
              setInvitationForm({ ...invitationForm, address2: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="City"
              value={invitationForm.city}
              onChange={(e) =>
                setInvitationForm({ ...invitationForm, city: e.target.value })
              }
              sx={{ flex: 2 }}
            />
            <TextField
              label="State"
              value={invitationForm.state}
              onChange={(e) =>
                setInvitationForm({ ...invitationForm, state: e.target.value })
              }
              sx={{ flex: 1 }}
            />
            <TextField
              label="ZIP"
              value={invitationForm.zip}
              onChange={(e) =>
                setInvitationForm({ ...invitationForm, zip: e.target.value })
              }
              sx={{ flex: 1 }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Country (optional)"
              value={invitationForm.country}
              onChange={(e) =>
                setInvitationForm({
                  ...invitationForm,
                  country: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
            <TextField
              label="Phone Number (optional)"
              value={invitationForm.phoneNumber}
              onChange={(e) =>
                setInvitationForm({
                  ...invitationForm,
                  phoneNumber: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            fullWidth
            label="Table Number (optional)"
            type="number"
            value={invitationForm.tableNumber}
            onChange={(e) =>
              setInvitationForm({
                ...invitationForm,
                tableNumber: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            value={invitationForm.notes}
            onChange={(e) =>
              setInvitationForm({ ...invitationForm, notes: e.target.value })
            }
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDialog}>Cancel</Button>
          <Button
            onClick={handleCreateInvitation}
            variant="contained"
            sx={{ backgroundColor: colors.olive }}
          >
            Create Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Blank Invitation Dialog */}
      <Dialog
        open={createInvitationDialogOpen}
        onClose={handleCloseCreateInvitationDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Invitation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: colors.body }}>
            Creates a blank invitation. You can assign existing unassigned
            guests, or add new guests, once it exists.
          </Typography>

          <TextField
            fullWidth
            label="Address"
            value={newInvitationForm.address}
            onChange={(e) =>
              setNewInvitationForm({
                ...newInvitationForm,
                address: e.target.value,
              })
            }
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Address 2 (optional)"
            value={newInvitationForm.address2}
            onChange={(e) =>
              setNewInvitationForm({
                ...newInvitationForm,
                address2: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="City"
              value={newInvitationForm.city}
              onChange={(e) =>
                setNewInvitationForm({
                  ...newInvitationForm,
                  city: e.target.value,
                })
              }
              sx={{ flex: 2 }}
            />
            <TextField
              label="State"
              value={newInvitationForm.state}
              onChange={(e) =>
                setNewInvitationForm({
                  ...newInvitationForm,
                  state: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
            <TextField
              label="ZIP"
              value={newInvitationForm.zip}
              onChange={(e) =>
                setNewInvitationForm({
                  ...newInvitationForm,
                  zip: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Country (optional)"
              value={newInvitationForm.country}
              onChange={(e) =>
                setNewInvitationForm({
                  ...newInvitationForm,
                  country: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
            <TextField
              label="Phone Number (optional)"
              value={newInvitationForm.phoneNumber}
              onChange={(e) =>
                setNewInvitationForm({
                  ...newInvitationForm,
                  phoneNumber: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            fullWidth
            label="Table Number (optional)"
            type="number"
            value={newInvitationForm.tableNumber}
            onChange={(e) =>
              setNewInvitationForm({
                ...newInvitationForm,
                tableNumber: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            value={newInvitationForm.notes}
            onChange={(e) =>
              setNewInvitationForm({
                ...newInvitationForm,
                notes: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                checked={newInvitationForm.saveTheDateSent}
                onChange={(e) =>
                  setNewInvitationForm({
                    ...newInvitationForm,
                    saveTheDateSent: e.target.checked,
                  })
                }
              />
              <Typography sx={{ color: colors.body }}>
                Save the Date sent
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                checked={newInvitationForm.inviteSent}
                onChange={(e) =>
                  setNewInvitationForm({
                    ...newInvitationForm,
                    inviteSent: e.target.checked,
                  })
                }
              />
              <Typography sx={{ color: colors.body }}>Invite sent</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateInvitationDialog}>Cancel</Button>
          <Button
            onClick={handleCreateBlankInvitation}
            variant="contained"
            disabled={creatingInvitation}
            sx={{ backgroundColor: colors.olive }}
          >
            {creatingInvitation ? "Creating..." : "Create Invitation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Invitation Dialog */}
      <Dialog
        open={editInvitationDialogOpen}
        onClose={handleCloseEditInvitationDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingInvitation
            ? `Edit Invitation No. ${editingInvitation.id}`
            : "Edit Invitation"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Address"
            value={editInvitationForm.address}
            onChange={(e) =>
              setEditInvitationForm({
                ...editInvitationForm,
                address: e.target.value,
              })
            }
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Address 2 (optional)"
            value={editInvitationForm.address2}
            onChange={(e) =>
              setEditInvitationForm({
                ...editInvitationForm,
                address2: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="City"
              value={editInvitationForm.city}
              onChange={(e) =>
                setEditInvitationForm({
                  ...editInvitationForm,
                  city: e.target.value,
                })
              }
              sx={{ flex: 2 }}
            />
            <TextField
              label="State"
              value={editInvitationForm.state}
              onChange={(e) =>
                setEditInvitationForm({
                  ...editInvitationForm,
                  state: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
            <TextField
              label="ZIP"
              value={editInvitationForm.zip}
              onChange={(e) =>
                setEditInvitationForm({
                  ...editInvitationForm,
                  zip: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Country (optional)"
              value={editInvitationForm.country}
              onChange={(e) =>
                setEditInvitationForm({
                  ...editInvitationForm,
                  country: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
            <TextField
              label="Phone Number (optional)"
              value={editInvitationForm.phoneNumber}
              onChange={(e) =>
                setEditInvitationForm({
                  ...editInvitationForm,
                  phoneNumber: e.target.value,
                })
              }
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            fullWidth
            label="Table Number (optional)"
            type="number"
            value={editInvitationForm.tableNumber}
            onChange={(e) =>
              setEditInvitationForm({
                ...editInvitationForm,
                tableNumber: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            value={editInvitationForm.notes}
            onChange={(e) =>
              setEditInvitationForm({
                ...editInvitationForm,
                notes: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                checked={editInvitationForm.saveTheDateSent}
                onChange={(e) =>
                  setEditInvitationForm({
                    ...editInvitationForm,
                    saveTheDateSent: e.target.checked,
                  })
                }
              />
              <Typography sx={{ color: colors.body }}>
                Save the Date sent
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                checked={editInvitationForm.inviteSent}
                onChange={(e) =>
                  setEditInvitationForm({
                    ...editInvitationForm,
                    inviteSent: e.target.checked,
                  })
                }
              />
              <Typography sx={{ color: colors.body }}>Invite sent</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditInvitationDialog}>Cancel</Button>
          <Button
            onClick={handleSaveInvitation}
            variant="contained"
            disabled={savingInvitation}
            sx={{ backgroundColor: colors.olive }}
          >
            {savingInvitation ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Existing Guests to Invitation Dialog */}
      <Dialog
        open={addExistingDialogOpen}
        onClose={handleCloseAddExistingDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {addExistingTargetId !== null
            ? `Add Guests to Invitation No. ${addExistingTargetId}`
            : "Add Guests"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: colors.body }}>
            Select one or more unassigned guests to attach to this invitation.
          </Typography>
          {(() => {
            const unassigned = guests.filter((g) => !g.invitationId);
            if (unassigned.length === 0) {
              return (
                <Alert severity="info">
                  No unassigned guests available. Add a guest first, or move
                  one off another invitation.
                </Alert>
              );
            }
            return (
              <Autocomplete
                multiple
                value={addExistingSelected}
                options={unassigned}
                getOptionLabel={(g) =>
                  `${g.firstName} ${g.lastName}${g.email ? ` (${g.email})` : ""}`
                }
                isOptionEqualToValue={(a, b) => a.id === b.id}
                onChange={(_, val) => setAddExistingSelected(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search unassigned guests"
                    autoFocus
                    sx={{ mt: 1 }}
                  />
                )}
              />
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddExistingDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmAddExisting}
            variant="contained"
            disabled={addingExisting || addExistingSelected.length === 0}
            sx={{ backgroundColor: colors.olive }}
          >
            {addingExisting
              ? "Adding..."
              : `Add ${addExistingSelected.length || ""} guest${
                  addExistingSelected.length === 1 ? "" : "s"
                }`.trim()}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Reusable Guest Table Component
interface GuestTableProps {
  guests: Guest[];
  selectedGuests: number[];
  onToggleGuest: (id: number) => void;
  onSelectAll: () => void;
  onEditGuest: (guest: Guest) => void;
  onDeleteGuest: (id: number) => void;
  onMoveGuest: (guest: Guest) => void;
  onUnassignGuest: (guest: Guest) => void;
  showSelection: boolean;
}

const GuestTable = ({
  guests,
  selectedGuests,
  onToggleGuest,
  onSelectAll,
  onEditGuest,
  onDeleteGuest,
  onMoveGuest,
  onUnassignGuest,
  showSelection,
}: GuestTableProps) => {
  if (guests.length === 0) {
    return <Alert severity="info">No guests in this category.</Alert>;
  }

  const allSelected = guests.every((g) => selectedGuests.includes(g.id));
  const someSelected =
    guests.some((g) => selectedGuests.includes(g.id)) && !allSelected;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {showSelection && (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onSelectAll}
                />
              </TableCell>
            )}
            <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>
              Dietary Restrictions
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Invitation</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>RSVP</TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="center">
              +1
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {guests.map((guest) => (
            <TableRow key={guest.id}>
              {showSelection && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedGuests.includes(guest.id)}
                    onChange={() => onToggleGuest(guest.id)}
                  />
                </TableCell>
              )}
              <TableCell>
                {guest.firstName} {guest.lastName}
              </TableCell>
              <TableCell>{guest.email || "-"}</TableCell>
              <TableCell>{guest.dietaryRestrictions || "-"}</TableCell>
              <TableCell>
                {guest.invitationId ? (
                  <Chip
                    label={`No. ${guest.invitationId}`}
                    size="small"
                    color="success"
                  />
                ) : (
                  <Chip label="Unassigned" size="small" />
                )}
              </TableCell>
              <TableCell>
                <RsvpStatusChip guest={guest} />
              </TableCell>
              <TableCell align="center">
                {guest.plusOne ? (
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
                  "—"
                )}
              </TableCell>
              <TableCell>
                <IconButton
                  onClick={() => onEditGuest(guest)}
                  sx={{ color: colors.olive }}
                  title="Edit guest"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => onMoveGuest(guest)}
                  sx={{ color: colors.eucalyptus }}
                  title="Move to another invitation"
                >
                  <SwapHorizIcon />
                </IconButton>
                {guest.invitationId && (
                  <IconButton
                    onClick={() => onUnassignGuest(guest)}
                    sx={{ color: colors.cognac }}
                    title="Remove from invitation (keep guest)"
                  >
                    <PersonRemoveIcon />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => onDeleteGuest(guest.id)}
                  sx={{ color: colors.burntSienna }}
                  title="Delete guest"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Invitation Card Grid Component
interface InvitationCardGridProps {
  invitations: Invitation[];
  totalCount: number;
  unassignedGuestCount: number;
  onEditGuest: (guest: Guest) => void;
  onDeleteGuest: (id: number) => void;
  onMoveGuest: (guest: Guest) => void;
  onUnassignGuest: (guest: Guest) => void;
  onAddExistingGuests: (invitationId: number) => void;
  onEditInvitation: (invitation: Invitation) => void;
  onRefresh: () => void;
}

const InvitationCardGrid = ({
  invitations,
  totalCount,
  unassignedGuestCount,
  onEditGuest,
  onDeleteGuest,
  onMoveGuest,
  onUnassignGuest,
  onAddExistingGuests,
  onEditInvitation,
  onRefresh,
}: InvitationCardGridProps) => {
  const [selectedInvitationIds, setSelectedInvitationIds] = useState<number[]>(
    [],
  );
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  if (totalCount === 0) {
    return <Alert severity="info">No invitations created yet.</Alert>;
  }

  if (invitations.length === 0) {
    return (
      <Alert severity="info">
        No invitations match your search ({totalCount} total).
      </Alert>
    );
  }

  const handleDeleteInvitation = async (id: number) => {
    if (
      !confirm(
        "Are you sure? This will delete the invitation and unassign all guests.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/invitations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete invitation");
      await onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete invitation");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvitationIds.length === 0) return;
    if (
      !confirm(
        `Delete ${selectedInvitationIds.length} invitation(s)? All guests in these invitations will also be deleted.`,
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/invitations/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationIds: selectedInvitationIds }),
      });
      if (!response.ok) throw new Error("Failed to bulk delete invitations");
      setSelectedInvitationIds([]);
      await onRefresh();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to delete invitations",
      );
    }
  };

  const formatAddressLine = (inv: Invitation) => {
    const street = [inv.address, inv.address2].filter(Boolean).join(", ");
    const local = [
      inv.city,
      [inv.state, inv.zip].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", ");
    return [street, local].filter(Boolean).join(" · ") || "—";
  };

  const visibleIds = invitations.map((i) => i.id);
  const allSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedInvitationIds.includes(id));
  const someSelected =
    visibleIds.some((id) => selectedInvitationIds.includes(id)) && !allSelected;

  const toggleSelect = (id: number) => {
    setSelectedInvitationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedInvitationIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedInvitationIds((prev) => [
        ...prev.filter((id) => !visibleIds.includes(id)),
        ...visibleIds,
      ]);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <Box>
      {selectedInvitationIds.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            p: 1.5,
            backgroundColor: colors.warmIvory,
            borderRadius: 1,
            border: `1px solid ${colors.mushroom}`,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.body }}>
            {selectedInvitationIds.length} invitation(s) selected
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => setSelectedInvitationIds([])}
              sx={{ color: colors.body }}
            >
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<DeleteSweepIcon />}
              onClick={handleBulkDelete}
              sx={{
                backgroundColor: colors.burntSienna,
                "&:hover": { backgroundColor: colors.terracotta },
              }}
            >
              Delete Selected
            </Button>
          </Stack>
        </Box>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell width="32" />
              <TableCell sx={{ fontWeight: "bold" }}>No.</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Address</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Guests</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                RSVP
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                +1
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                Table
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                STD
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                Invite
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invitations.map((invitation) => {
              const isSelected = selectedInvitationIds.includes(invitation.id);
              const isExpanded = expandedIds.includes(invitation.id);
              const guestNames = invitation.guests
                .map(
                  (g) =>
                    `${g.firstName} ${g.lastName}${g.plusOne ? " (+1)" : ""}`,
                )
                .join(", ");
              const plusOneCount = invitation.guests.filter(
                (g) => g.plusOne,
              ).length;
              const headcount = invitation.guests.length + plusOneCount;
              const respondedGuests = invitation.guests.filter(
                (g) => g.rsvpResponse,
              );
              const attendingCount = respondedGuests.filter(
                (g) => g.rsvpResponse?.isAttending,
              ).length;
              const declinedCount = respondedGuests.length - attendingCount;
              return (
                <>
                  <TableRow
                    key={invitation.id}
                    hover
                    selected={isSelected}
                    sx={{ "& > *": { borderBottom: "unset" } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelect(invitation.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleExpand(invitation.id)}
                        title={isExpanded ? "Collapse" : "Expand guests"}
                      >
                        {isExpanded ? (
                          <KeyboardArrowDownIcon fontSize="small" />
                        ) : (
                          <KeyboardArrowRightIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {invitation.id}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" sx={{ color: colors.body }}>
                        {formatAddressLine(invitation)}
                      </Typography>
                      {invitation.phoneNumber && (
                        <Typography
                          variant="caption"
                          sx={{ color: colors.bodyLight }}
                        >
                          {invitation.phoneNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.body,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={guestNames}
                      >
                        {guestNames || (
                          <em style={{ color: colors.bodyLight }}>
                            No guests
                          </em>
                        )}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: colors.bodyLight }}
                      >
                        {invitation.guests.length} named
                        {plusOneCount > 0 &&
                          ` + ${plusOneCount} plus-one${
                            plusOneCount === 1 ? "" : "s"
                          } (total ${headcount})`}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {respondedGuests.length === 0 ? (
                        <Chip
                          size="small"
                          label="No Response"
                          variant="outlined"
                        />
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {attendingCount > 0 && (
                            <Chip
                              size="small"
                              color="success"
                              label={`${attendingCount} attending`}
                            />
                          )}
                          {declinedCount > 0 && (
                            <Chip
                              size="small"
                              color="error"
                              label={`${declinedCount} declined`}
                            />
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {plusOneCount > 0 ? (
                        <Chip
                          size="small"
                          label={
                            plusOneCount === 1 ? "+1" : `+${plusOneCount}`
                          }
                          sx={{
                            backgroundColor: colors.dustyRose,
                            color: colors.heading,
                            fontWeight: 700,
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ color: colors.bodyLight }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {invitation.tableNumber ?? "—"}
                    </TableCell>
                    <TableCell align="center">
                      {invitation.saveTheDateSent ? (
                        <CheckCircleIcon
                          fontSize="small"
                          sx={{ color: colors.eucalyptus }}
                        />
                      ) : (
                        <RadioButtonUncheckedIcon
                          fontSize="small"
                          sx={{ color: colors.mushroom }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {invitation.inviteSent ? (
                        <CheckCircleIcon
                          fontSize="small"
                          sx={{ color: colors.olive }}
                        />
                      ) : (
                        <RadioButtonUncheckedIcon
                          fontSize="small"
                          sx={{ color: colors.mushroom }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => onEditInvitation(invitation)}
                        sx={{ color: colors.olive }}
                        title="Edit invitation (address, etc.)"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onAddExistingGuests(invitation.id)}
                        disabled={unassignedGuestCount === 0}
                        sx={{ color: colors.eucalyptus }}
                        title={
                          unassignedGuestCount === 0
                            ? "No unassigned guests available"
                            : "Add existing guest to this invitation"
                        }
                      >
                        <PersonAddIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteInvitation(invitation.id)}
                        sx={{ color: colors.burntSienna }}
                        title="Delete invitation"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      sx={{ py: 0, backgroundColor: colors.warmIvory }}
                    >
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 1 }}>
                          {invitation.notes && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                mb: 1,
                                fontStyle: "italic",
                                color: colors.bodyLight,
                              }}
                            >
                              Notes: {invitation.notes}
                            </Typography>
                          )}
                          <Box sx={{ mb: 1.5 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PersonAddIcon />}
                              onClick={() => onAddExistingGuests(invitation.id)}
                              disabled={unassignedGuestCount === 0}
                              sx={{
                                color: colors.olive,
                                borderColor: colors.olive,
                                "&:hover": {
                                  borderColor: colors.eucalyptus,
                                  backgroundColor: colors.warmIvory,
                                },
                              }}
                            >
                              {unassignedGuestCount === 0
                                ? "No unassigned guests available"
                                : "Add existing guest"}
                            </Button>
                          </Box>
                          {invitation.guests.length === 0 ? (
                            <Typography
                              variant="body2"
                              sx={{
                                fontStyle: "italic",
                                color: colors.bodyLight,
                              }}
                            >
                              No guests assigned to this invitation.
                            </Typography>
                          ) : (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    Name
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600 }}
                                    align="center"
                                  >
                                    +1
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    RSVP
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    Email
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    Dietary
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    Actions
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {invitation.guests.map((guest) => (
                                  <TableRow key={guest.id}>
                                    <TableCell>
                                      {guest.firstName} {guest.lastName}
                                    </TableCell>
                                    <TableCell align="center">
                                      {guest.plusOne ? (
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
                                        "—"
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <RsvpStatusChip guest={guest} />
                                    </TableCell>
                                    <TableCell>{guest.email || "—"}</TableCell>
                                    <TableCell>
                                      {guest.dietaryRestrictions || "—"}
                                    </TableCell>
                                    <TableCell>
                                      <IconButton
                                        size="small"
                                        onClick={() => onEditGuest(guest)}
                                        sx={{ color: colors.olive }}
                                        title="Edit guest"
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => onMoveGuest(guest)}
                                        sx={{ color: colors.eucalyptus }}
                                        title="Move to another invitation"
                                      >
                                        <SwapHorizIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => onUnassignGuest(guest)}
                                        sx={{ color: colors.cognac }}
                                        title="Remove from invitation"
                                      >
                                        <PersonRemoveIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          onDeleteGuest(guest.id)
                                        }
                                        sx={{ color: colors.burntSienna }}
                                        title="Delete guest"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
