import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  createTheme,
  CssBaseline,
  FormControlLabel,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import {
  rsvpApi,
  RsvpApiError,
  CONTACT_EMAIL,
  type EditInvitation,
  type GuestResponsePayload,
  type PlusOnePayload,
} from "../services/rsvp.service";
import { Link as MuiLink } from "@mui/material";
import { DietaryPicker } from "../components/DietaryPicker";

interface GuestFormState {
  guestId: number;
  firstName: string;
  lastName: string;
  canBringPlusOne: boolean;
  isAttending: boolean | null;
  dietary: string;
  bringingPlusOne: boolean;
  plusOneFirstName: string;
  plusOneLastName: string;
  plusOneAttending: boolean;
  plusOneDietary: string;
}

const rsvpTheme = createTheme({
  typography: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  palette: {
    mode: "light",
    primary: { main: "#37474f", contrastText: "#ffffff" },
    secondary: { main: "#8d6e63", contrastText: "#ffffff" },
    background: { default: "#ffffff", paper: "#ffffff" },
    text: { primary: "rgba(0,0,0,0.87)", secondary: "rgba(0,0,0,0.6)" },
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
  },
});

export const RsvpEdit = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<EditInvitation | null>(null);
  const [guestForm, setGuestForm] = useState<GuestFormState[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Missing edit link token.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const inv = await rsvpApi.getByToken(token);
        if (cancelled) return;
        setInvitation(inv);
        const primaries = inv.guests.filter((g) => !g.isPlusOne);
        const plusOnes = inv.guests.filter((g) => g.isPlusOne);
        setGuestForm(
          primaries.map((g) => {
            const po = plusOnes.find((p) => p.plusOneForGuestId === g.id);
            return {
              guestId: g.id,
              firstName: g.firstName,
              lastName: g.lastName,
              canBringPlusOne: g.plusOne,
              isAttending: g.isAttending,
              dietary: g.dietaryRestrictions ?? "",
              bringingPlusOne: !!po,
              plusOneFirstName: po?.firstName ?? "",
              plusOneLastName: po?.lastName ?? "",
              plusOneAttending: po?.isAttending ?? true,
              plusOneDietary: po?.dietaryRestrictions ?? "",
            };
          })
        );
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Could not load RSVP");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const updateGuest = (idx: number, patch: Partial<GuestFormState>) => {
    setGuestForm((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const formValid = useMemo(() => {
    if (!invitation) return false;
    if (guestForm.some((g) => g.isAttending === null)) return false;
    for (const g of guestForm) {
      if (g.bringingPlusOne) {
        if (!g.plusOneFirstName.trim() || !g.plusOneLastName.trim()) return false;
      }
    }
    return true;
  }, [invitation, guestForm]);

  const handleSave = async () => {
    if (!invitation) return;
    setSaveAttempted(true);
    if (!formValid) {
      setSaveError("Please fix the highlighted fields and try again.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const responses: GuestResponsePayload[] = guestForm.map((g) => ({
        guestId: g.guestId,
        isAttending: g.isAttending === true,
        dietaryRestrictions: g.isAttending ? g.dietary || undefined : undefined,
      }));
      const plusOnes: PlusOnePayload[] = guestForm
        .filter((g) => g.bringingPlusOne)
        .map((g) => ({
          hostGuestId: g.guestId,
          firstName: g.plusOneFirstName.trim(),
          lastName: g.plusOneLastName.trim(),
          isAttending: g.plusOneAttending,
          dietaryRestrictions: g.plusOneAttending ? g.plusOneDietary || undefined : undefined,
        }));

      await rsvpApi.updateByToken(token, responses, plusOnes);
      setSaved(true);
    } catch (err) {
      const base =
        err instanceof RsvpApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong.";
      setSaveError(
        `${base} If this keeps happening, please email us at ${CONTACT_EMAIL} and we'll get you sorted out.`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ py: 6, maxWidth: 720, mx: "auto" }}>
        <Alert severity="error">{loadError}</Alert>
      </Box>
    );
  }

  if (!invitation) return null;

  const readOnly = invitation.pastDeadline;

  return (
    <ThemeProvider theme={rsvpTheme}>
      <CssBaseline />
      <Box sx={{ py: 6, maxWidth: 720, mx: "auto", width: "100%" }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Edit your RSVP
        </Typography>

        {readOnly && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            The RSVP deadline has passed. Your response is shown below but can no longer be changed.
            Please contact the couple directly if you need to update it.
          </Alert>
        )}

        {!readOnly && (
          <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
            Plus-ones are offered on an individual basis. If the "Bringing a plus-one" option isn't
            shown next to your name, we weren't able to accommodate an additional guest for you.
          </Alert>
        )}

        <Stack spacing={3}>
          {guestForm.map((g, idx) => (
            <Card key={g.guestId} variant="outlined">
              <CardContent>
                <Typography variant="h6" component="h2">
                  {g.firstName} {g.lastName}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1, mb: saveAttempted && g.isAttending === null ? 0.5 : 2 }}
                >
                  <Button
                    variant={g.isAttending === true ? "contained" : "outlined"}
                    color={saveAttempted && g.isAttending === null ? "error" : "primary"}
                    disabled={readOnly}
                    onClick={() => updateGuest(idx, { isAttending: true })}
                  >
                    Attending
                  </Button>
                  <Button
                    variant={g.isAttending === false ? "contained" : "outlined"}
                    color={saveAttempted && g.isAttending === null ? "error" : "secondary"}
                    disabled={readOnly}
                    onClick={() => updateGuest(idx, { isAttending: false })}
                  >
                    Unable to attend
                  </Button>
                </Stack>
                {saveAttempted && g.isAttending === null && (
                  <Typography variant="caption" color="error" sx={{ display: "block", mb: 2 }}>
                    Please choose one.
                  </Typography>
                )}
                {g.isAttending === true && (
                  <Stack spacing={2}>
                    <DietaryPicker
                      value={g.dietary}
                      disabled={readOnly}
                      onChange={(v) => updateGuest(idx, { dietary: v })}
                    />
                    {g.canBringPlusOne && (
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={g.bringingPlusOne}
                              disabled={readOnly}
                              onChange={(e) =>
                                updateGuest(idx, { bringingPlusOne: e.target.checked })
                              }
                            />
                          }
                          label="Bringing a plus-one"
                        />
                        {g.bringingPlusOne && (
                          <Stack spacing={2} sx={{ mt: 1, pl: 4 }}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Plus-one first name"
                                disabled={readOnly}
                                value={g.plusOneFirstName}
                                error={saveAttempted && !g.plusOneFirstName.trim()}
                                helperText={
                                  saveAttempted && !g.plusOneFirstName.trim()
                                    ? "Required"
                                    : undefined
                                }
                                onChange={(e) =>
                                  updateGuest(idx, { plusOneFirstName: e.target.value })
                                }
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Plus-one last name"
                                disabled={readOnly}
                                value={g.plusOneLastName}
                                error={saveAttempted && !g.plusOneLastName.trim()}
                                helperText={
                                  saveAttempted && !g.plusOneLastName.trim()
                                    ? "Required"
                                    : undefined
                                }
                                onChange={(e) =>
                                  updateGuest(idx, { plusOneLastName: e.target.value })
                                }
                              />
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant={g.plusOneAttending ? "contained" : "outlined"}
                                disabled={readOnly}
                                onClick={() => updateGuest(idx, { plusOneAttending: true })}
                              >
                                Attending
                              </Button>
                              <Button
                                size="small"
                                variant={!g.plusOneAttending ? "contained" : "outlined"}
                                color="secondary"
                                disabled={readOnly}
                                onClick={() => updateGuest(idx, { plusOneAttending: false })}
                              >
                                Unable to attend
                              </Button>
                            </Stack>
                            <DietaryPicker
                              value={g.plusOneDietary}
                              disabled={readOnly}
                              onChange={(v) => updateGuest(idx, { plusOneDietary: v })}
                              label="Plus-one dietary restrictions (optional)"
                            />
                          </Stack>
                        )}
                      </Box>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))}

          {saveError && <Alert severity="error">{saveError}</Alert>}
          {saved && <Alert severity="success">Your RSVP has been updated.</Alert>}

          {!readOnly && (
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          )}
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 6, pt: 2, borderTop: 1, borderColor: "divider" }}
        >
          Having trouble?{" "}
          <MuiLink href={`mailto:${CONTACT_EMAIL}`} color="inherit">
            Email us at {CONTACT_EMAIL}
          </MuiLink>{" "}
          and we'll help you out.
        </Typography>
      </Box>
    </ThemeProvider>
  );
};
