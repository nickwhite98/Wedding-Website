import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  CircularProgress,
  createTheme,
  CssBaseline,
  Divider,
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
  type SearchInvitation,
  type VerifiedInvitation,
  type GuestResponsePayload,
  type PlusOnePayload,
} from "../services/rsvp.service";
import { Link as MuiLink } from "@mui/material";
import { DietaryPicker } from "../components/DietaryPicker";

type Step = "search" | "verify" | "form" | "done";

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

export const RSVP = () => {
  const [step, setStep] = useState<Step>("search");

  // search
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchInvitation[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // verify
  const [selected, setSelected] = useState<SearchInvitation | null>(null);
  const [zip, setZip] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [alreadyRespondedMsg, setAlreadyRespondedMsg] = useState<string | null>(null);

  // form
  const [invitation, setInvitation] = useState<VerifiedInvitation | null>(null);
  const [guestForm, setGuestForm] = useState<GuestFormState[]>([]);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const data = await rsvpApi.search(q);
        setResults(data);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const pickInvitation = (inv: SearchInvitation) => {
    setSelected(inv);
    setZip("");
    setVerifyError(null);
    setAlreadyRespondedMsg(null);
    setStep("verify");
  };

  const handleVerify = async () => {
    if (!selected) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const inv = await rsvpApi.verifyZip(selected.id, zip.trim());
      if (inv.alreadyResponded) {
        setAlreadyRespondedMsg(
          "This invitation has already responded. If you need to change your RSVP, please use the link in your confirmation email or contact the couple directly."
        );
        return;
      }
      setInvitation(inv);
      setGuestForm(
        inv.guests.map((g) => ({
          guestId: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          canBringPlusOne: g.plusOne,
          isAttending: null,
          dietary: g.dietaryRestrictions ?? "",
          bringingPlusOne: false,
          plusOneFirstName: "",
          plusOneLastName: "",
          plusOneAttending: true,
          plusOneDietary: "",
        }))
      );
      setEmail("");
      setStep("form");
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const updateGuest = (idx: number, patch: Partial<GuestFormState>) => {
    setGuestForm((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailTrimmed = email.trim();
  const emailTyped = emailTrimmed.length > 0;
  const emailLooksInvalid = emailTyped && !emailRe.test(emailTrimmed);
  const emailError = emailLooksInvalid || (submitAttempted && !emailTyped);
  const emailHelper = emailLooksInvalid
    ? "Please enter a valid email address."
    : submitAttempted && !emailTyped
      ? "Email is required."
      : "We'll send a confirmation with a link to edit your RSVP if needed. This is the email we'll use to verify any future edits.";

  const formValid = useMemo(() => {
    if (!invitation) return false;
    if (guestForm.some((g) => g.isAttending === null)) return false;
    if (!emailRe.test(emailTrimmed)) return false;
    for (const g of guestForm) {
      if (g.bringingPlusOne) {
        if (!g.plusOneFirstName.trim() || !g.plusOneLastName.trim()) return false;
      }
    }
    return true;
  }, [invitation, guestForm, emailTrimmed]);

  const handleSubmit = async () => {
    if (!invitation) return;
    setSubmitAttempted(true);
    if (!formValid) {
      setSubmitError("Please fix the highlighted fields and try again.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
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

      await rsvpApi.submit({
        invitationId: invitation.id,
        zip: zip.trim(),
        email: email.trim(),
        responses,
        plusOnes,
        website: honeypot,
      });
      setStep("done");
    } catch (err) {
      const base =
        err instanceof RsvpApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong.";
      setSubmitError(
        `${base} If this keeps happening, please email us at ${CONTACT_EMAIL} and we'll get you sorted out.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep("search");
    setQuery("");
    setResults([]);
    setSelected(null);
    setZip("");
    setInvitation(null);
    setGuestForm([]);
    setEmail("");
    setVerifyError(null);
    setSubmitError(null);
    setAlreadyRespondedMsg(null);
    setSubmitAttempted(false);
  };

  return (
    <ThemeProvider theme={rsvpTheme}>
      <CssBaseline />
      <Box sx={{ py: 6, maxWidth: 720, mx: "auto", width: "100%" }}>
        {step === "search" && (
          <Stack spacing={2}>
            <Typography variant="body1" align="center">
              Enter your first or last name to find your invitation.
            </Typography>
            <TextField
              fullWidth
              label="Your name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <Alert severity="info" variant="outlined">
              Plus-ones are offered on an individual basis. If the "Bringing a plus-one" option
              isn't shown next to your name on the next screen, we weren't able to accommodate an
              additional guest for you. Thank you for understanding.
            </Alert>
            {searching && <CircularProgress size={24} sx={{ alignSelf: "center" }} />}
            {searchError && <Alert severity="error">{searchError}</Alert>}
            {!searching && query.trim().length >= 2 && results.length === 0 && !searchError && (
              <Typography variant="body2" color="text.secondary" align="center">
                No matches yet. Try a different spelling or your partner's name.
              </Typography>
            )}
            <Stack spacing={1}>
              {results.map((inv) => (
                <Card key={inv.id} variant="outlined">
                  <CardActionArea onClick={() => pickInvitation(inv)}>
                    <CardContent>
                      <Typography variant="body1">
                        {inv.guests.map((g) => `${g.firstName} ${g.lastName}`).join(", ")}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Stack>
        )}

        {step === "verify" && selected && (
          <Stack spacing={2}>
            <Button onClick={() => setStep("search")} size="small" sx={{ alignSelf: "flex-start" }}>
              ← Back to search
            </Button>
            <Typography variant="body1">
              Please confirm it's you by entering the ZIP code where you received the invitation.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invitation for: {selected.guests.map((g) => `${g.firstName} ${g.lastName}`).join(", ")}
            </Typography>
            <TextField
              fullWidth
              label="ZIP code"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              autoFocus
              slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 10 } }}
            />
            {verifyError && <Alert severity="error">{verifyError}</Alert>}
            {alreadyRespondedMsg && <Alert severity="info">{alreadyRespondedMsg}</Alert>}
            <Button
              variant="contained"
              onClick={handleVerify}
              disabled={verifying || zip.trim().length < 5 || !!alreadyRespondedMsg}
            >
              {verifying ? "Checking..." : "Continue"}
            </Button>
          </Stack>
        )}

        {step === "form" && invitation && (
          <Stack spacing={3}>
            <Typography variant="body1">Please respond for each person in your party.</Typography>

            {guestForm.map((g, idx) => (
              <Card key={g.guestId} variant="outlined">
                <CardContent>
                  <Typography variant="h6" component="h2">
                    {g.firstName} {g.lastName}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, mb: submitAttempted && g.isAttending === null ? 0.5 : 2 }}>
                    <Button
                      variant={g.isAttending === true ? "contained" : "outlined"}
                      color={submitAttempted && g.isAttending === null ? "error" : "primary"}
                      onClick={() => updateGuest(idx, { isAttending: true })}
                    >
                      Attending
                    </Button>
                    <Button
                      variant={g.isAttending === false ? "contained" : "outlined"}
                      color={submitAttempted && g.isAttending === null ? "error" : "secondary"}
                      onClick={() => updateGuest(idx, { isAttending: false })}
                    >
                      Unable to attend
                    </Button>
                  </Stack>
                  {submitAttempted && g.isAttending === null && (
                    <Typography variant="caption" color="error" sx={{ display: "block", mb: 2 }}>
                      Please choose one.
                    </Typography>
                  )}
                  {g.isAttending === true && (
                    <Stack spacing={2}>
                      <DietaryPicker
                        value={g.dietary}
                        onChange={(v) => updateGuest(idx, { dietary: v })}
                      />
                      {g.canBringPlusOne && (
                        <Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={g.bringingPlusOne}
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
                                  value={g.plusOneFirstName}
                                  error={submitAttempted && !g.plusOneFirstName.trim()}
                                  helperText={
                                    submitAttempted && !g.plusOneFirstName.trim()
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
                                  value={g.plusOneLastName}
                                  error={submitAttempted && !g.plusOneLastName.trim()}
                                  helperText={
                                    submitAttempted && !g.plusOneLastName.trim()
                                      ? "Required"
                                      : undefined
                                  }
                                  onChange={(e) =>
                                    updateGuest(idx, { plusOneLastName: e.target.value })
                                  }
                                />
                              </Stack>
                              <DietaryPicker
                                value={g.plusOneDietary}
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

            <Divider />

            <TextField
              fullWidth
              label="Your email (required)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              helperText={emailHelper}
            />

            <Box
              component="label"
              sx={{ position: "absolute", left: "-9999px", top: "-9999px" }}
              aria-hidden="true"
            >
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </Box>

            {submitError && <Alert severity="error">{submitError}</Alert>}

            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Button onClick={resetAll}>Start over</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit RSVP"}
              </Button>
            </Stack>
          </Stack>
        )}

        {step === "done" && (
          <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
            <Typography variant="h5">Thank you!</Typography>
            <Typography align="center">
              Your RSVP has been received. We've sent a confirmation email to {email}. You can use the
              link in that email to edit your response before the deadline if anything changes. Be sure
              to save the email so you can find the edit link later.
            </Typography>
            <Button onClick={resetAll}>Submit another RSVP</Button>
          </Stack>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 6, pt: 2, borderTop: 1, borderColor: "divider" }}
        >
          Having trouble with your RSVP or can't find your name?{" "}
          <MuiLink href={`mailto:${CONTACT_EMAIL}`} color="inherit">
            Email us at {CONTACT_EMAIL}
          </MuiLink>{" "}
          and we'll help you out.
        </Typography>
      </Box>
    </ThemeProvider>
  );
};
