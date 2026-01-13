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
} from "@mui/material";
import { colors } from "../../theme";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

interface RsvpResponse {
  id: number;
  isAttending: boolean;
  respondedAt: string;
  guest: Guest;
}

interface Invitation {
  id: number;
  plusOne: boolean;
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

export const RsvpList = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RSVPs");
    } finally {
      setLoading(false);
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
    (inv) => inv.rsvpResponses.length > 0
  );

  return (
    <Box>
      {/* Stats Cards */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          <Box>
            <Card sx={{ backgroundColor: colors.sage, color: "white" }}>
              <CardContent>
                <Typography variant="h4">{stats.totalInvitations}</Typography>
                <Typography variant="body2">Total Invitations</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ backgroundColor: colors.eucalyptus, color: "white" }}>
              <CardContent>
                <Typography variant="h4">{stats.respondedInvitations}</Typography>
                <Typography variant="body2">Responded</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ backgroundColor: colors.terracotta, color: "white" }}>
              <CardContent>
                <Typography variant="h4">{stats.attendingCount}</Typography>
                <Typography variant="body2">Attending</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ backgroundColor: colors.dustyRose, color: "white" }}>
              <CardContent>
                <Typography variant="h4">{stats.notAttendingCount}</Typography>
                <Typography variant="body2">Not Attending</Typography>
              </CardContent>
            </Card>
          </Box>
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
                <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Responded</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {respondedInvitations.map((invitation) =>
                invitation.guests.map((guest) =>
                  guest.rsvpResponse ? (
                    <TableRow key={guest.id}>
                      <TableCell>
                        {guest.firstName} {guest.lastName}
                      </TableCell>
                      <TableCell>
                        {guest.email || "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={guest.rsvpResponse.isAttending ? "Attending" : "Not Attending"}
                          color={guest.rsvpResponse.isAttending ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(guest.rsvpResponse.respondedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ) : null
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
