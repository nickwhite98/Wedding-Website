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
  Card,
  CardContent,
  CardActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  DeleteSweep as DeleteSweepIcon,
} from "@mui/icons-material";
import { colors } from "../../theme";

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  menuChoice?: string;
  dietaryRestrictions?: string;
  invitationId?: number;
  invitation?: Invitation;
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
  plusOne: boolean;
  guests: Guest[];
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
  });

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
    plusOne: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [guestsRes, invitationsRes] = await Promise.all([
        fetch("http://localhost:3001/api/guests"),
        fetch("http://localhost:3001/api/invitations"),
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
      });
    } else {
      setEditingGuest(null);
      setGuestForm({
        firstName: "",
        lastName: "",
        email: "",
        dietaryRestrictions: "",
        menuChoice: "",
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
        ? `http://localhost:3001/api/guests/${editingGuest.id}`
        : "http://localhost:3001/api/guests";

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
      const response = await fetch(`http://localhost:3001/api/guests/${id}`, {
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

    if (!confirm(`Are you sure you want to delete ${selectedGuests.length} guest(s)?`)) {
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/guests/bulk-delete", {
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
        : [...prev, guestId]
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
      plusOne: false,
    });
    setGroupDialogOpen(true);
  };

  const handleCloseGroupDialog = () => {
    setGroupDialogOpen(false);
  };

  const handleCreateInvitation = async () => {
    try {
      const response = await fetch(
        "http://localhost:3001/api/import/assign-invitation",
        {
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
        }
      );

      if (!response.ok) throw new Error("Failed to create invitation");

      await fetchData();
      setSelectedGuests([]);
      handleCloseGroupDialog();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create invitation"
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
          .includes(searchTerm.toLowerCase())
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

  const unassignedGuests = filterAndSortGuests(guests.filter((g) => !g.invitationId));
  const allGuests = filterAndSortGuests(guests);

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
          showSelection={true}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <InvitationCardGrid
          invitations={invitations}
          onEditGuest={handleOpenGuestDialog}
          onDeleteGuest={handleDeleteGuest}
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
        <DialogTitle>
          {editingGuest ? "Edit Guest" : "Add Guest"}
        </DialogTitle>
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
          />
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
          <Box sx={{ display: "flex", gap: 2 }}>
            <Checkbox
              checked={invitationForm.plusOne}
              onChange={(e) =>
                setInvitationForm({
                  ...invitationForm,
                  plusOne: e.target.checked,
                })
              }
            />
            <Typography>Allow Plus One</Typography>
          </Box>
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
  showSelection: boolean;
}

const GuestTable = ({
  guests,
  selectedGuests,
  onToggleGuest,
  onSelectAll,
  onEditGuest,
  onDeleteGuest,
  showSelection,
}: GuestTableProps) => {
  if (guests.length === 0) {
    return <Alert severity="info">No guests in this category.</Alert>;
  }

  const allSelected = guests.every((g) => selectedGuests.includes(g.id));
  const someSelected = guests.some((g) => selectedGuests.includes(g.id)) && !allSelected;

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
            <TableCell sx={{ fontWeight: "bold" }}>Dietary Restrictions</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Invitation</TableCell>
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
                    label={`Invitation #${guest.invitationId}`}
                    size="small"
                    color="success"
                  />
                ) : (
                  <Chip label="Unassigned" size="small" />
                )}
              </TableCell>
              <TableCell>
                <IconButton
                  onClick={() => onEditGuest(guest)}
                  sx={{ color: colors.olive }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => onDeleteGuest(guest.id)}
                  sx={{ color: colors.burntSienna }}
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
  onEditGuest: (guest: Guest) => void;
  onDeleteGuest: (id: number) => void;
  onRefresh: () => void;
}

const InvitationCardGrid = ({
  invitations,
  onEditGuest,
  onDeleteGuest,
  onRefresh,
}: InvitationCardGridProps) => {
  if (invitations.length === 0) {
    return <Alert severity="info">No invitations created yet.</Alert>;
  }

  const handleDeleteInvitation = async (id: number) => {
    if (!confirm("Are you sure? This will delete the invitation and unassign all guests.")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/invitations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete invitation");
      await onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete invitation");
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
      {invitations.map((invitation) => (
        <Box key={invitation.id}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderLeft: `4px solid ${colors.olive}`,
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ mb: 1, color: colors.heading }}>
                Invitation #{invitation.id}
              </Typography>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Address:</strong>{" "}
                {invitation.address || "No address"}
                {invitation.address2 && `, ${invitation.address2}`}
              </Typography>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Location:</strong>{" "}
                {invitation.city || "-"}, {invitation.state || "-"}{" "}
                {invitation.zip || ""}
              </Typography>

              {invitation.phoneNumber && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Phone:</strong> {invitation.phoneNumber}
                </Typography>
              )}

              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Guests ({invitation.guests.length}):
                </Typography>
                {invitation.guests.map((guest) => (
                  <Box
                    key={guest.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 0.5,
                    }}
                  >
                    <Typography variant="body2">
                      {guest.firstName} {guest.lastName}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => onEditGuest(guest)}
                        sx={{ color: colors.olive }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDeleteGuest(guest.id)}
                        sx={{ color: colors.burntSienna }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>

              {invitation.plusOne && (
                <Chip label="Plus One Allowed" size="small" color="success" sx={{ mt: 1 }} />
              )}

              {invitation.tableNumber && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Table:</strong> {invitation.tableNumber}
                </Typography>
              )}

              {invitation.notes && (
                <Typography variant="caption" sx={{ mt: 1, display: "block", fontStyle: "italic" }}>
                  {invitation.notes}
                </Typography>
              )}
            </CardContent>

            <CardActions>
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => handleDeleteInvitation(invitation.id)}
                sx={{ color: colors.burntSienna }}
              >
                Delete Invitation
              </Button>
            </CardActions>
          </Card>
        </Box>
      ))}
    </Box>
  );
};
