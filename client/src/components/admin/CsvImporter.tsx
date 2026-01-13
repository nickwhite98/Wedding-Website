import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Upload as UploadIcon } from "@mui/icons-material";
import { colors } from "../../theme";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ImportResult {
  success: Array<{
    rowNumber: number;
    guestId: number;
    invitationId: number | null;
    name: string;
  }>;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
  invitationsCreated: number;
}

export const CsvImporter = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const text = await file.text();
      const rows = parseCsv(text);

      const response = await fetch(`${API_BASE_URL}/import/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      if (!response.ok) {
        throw new Error("Failed to import guests");
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const parseCsv = (csvText: string) => {
    const lines = csvText.split("\n");
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row");
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim());

    // Map headers to expected field names (case-insensitive)
    const headerMap: Record<string, string> = {};
    headers.forEach((header, index) => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (normalized.includes("weddingguestname") || normalized.includes("guestname")) {
        headerMap[index] = "guestName";
      } else if (normalized.includes("address1") || (normalized === "address" && !normalized.includes("2"))) {
        headerMap[index] = "address1";
      } else if (normalized.includes("address2")) {
        headerMap[index] = "address2";
      } else if (normalized.includes("city")) {
        headerMap[index] = "city";
      } else if (normalized.includes("state") || normalized.includes("province")) {
        headerMap[index] = "state";
      } else if (normalized.includes("country")) {
        headerMap[index] = "country";
      } else if (normalized.includes("zip") || normalized.includes("postal")) {
        headerMap[index] = "zipCode";
      } else if (normalized.includes("email")) {
        headerMap[index] = "email";
      } else if (normalized.includes("phone")) {
        headerMap[index] = "phoneNumber";
      } else if (normalized.includes("savethedatesent") || normalized.includes("savedatesent")) {
        headerMap[index] = "saveTheDateSent";
      } else if (normalized.includes("invitesent")) {
        headerMap[index] = "inviteSent";
      } else if (normalized.includes("tablenumber") || normalized.includes("table")) {
        headerMap[index] = "tableNumber";
      } else if (normalized.includes("dietary") || normalized.includes("restriction")) {
        headerMap[index] = "dietaryRestrictions";
      } else if (normalized.includes("notes")) {
        headerMap[index] = "notes";
      }
    });

    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(",").map((v) => v.trim());
      const row: any = {};

      values.forEach((value, index) => {
        const fieldName = headerMap[index];
        if (fieldName && value) {
          row[fieldName] = value;
        }
      });

      // Only add rows that have at least a guest name
      if (row.guestName) {
        rows.push(row);
      }
    }

    return rows;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, color: colors.heading }}>
        Import Guests from CSV
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: colors.cream }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Upload a CSV file with your guest list. The following columns are
          supported:
        </Typography>
        <Typography variant="body2" component="div" sx={{ mb: 2 }}>
          <ul>
            <li>
              <strong>WEDDING GUEST NAME(S)</strong> (required) - Format: "First
              Last"
            </li>
            <li>ADDRESS 1</li>
            <li>ADDRESS 2</li>
            <li>CITY</li>
            <li>STATE/PROVINCE</li>
            <li>COUNTRY</li>
            <li>ZIP CODE</li>
            <li>EMAIL ADDRESS</li>
            <li>PHONE NUMBER</li>
            <li>SAVE THE DATE SENT?</li>
            <li>INVITE SENT?</li>
            <li>TABLE NUMBER</li>
            <li>DIETARY RESTRICTIONS</li>
            <li>NOTES</li>
          </ul>
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Note: Guests with the same address will be automatically grouped into
          the same invitation. You can manually regroup guests later from the
          Guest List tab.
        </Alert>

        <Button
          variant="contained"
          component="label"
          startIcon={<UploadIcon />}
          disabled={loading}
          sx={{
            backgroundColor: colors.olive,
            "&:hover": { backgroundColor: colors.eucalyptus },
          }}
        >
          {loading ? "Importing..." : "Upload CSV File"}
          <input
            type="file"
            accept=".csv"
            hidden
            onChange={handleFileUpload}
          />
        </Button>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress sx={{ color: colors.olive }} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box>
          <Alert
            severity={result.errors.length === 0 ? "success" : "warning"}
            sx={{ mb: 2 }}
          >
            Successfully imported {result.success.length} guest(s) into{" "}
            {result.invitationsCreated} invitation(s).
            {result.errors.length > 0 &&
              ` ${result.errors.length} row(s) failed.`}
          </Alert>

          {result.success.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: colors.cream }}>
              <Typography variant="h6" sx={{ mb: 1, color: colors.heading }}>
                Imported Guests
              </Typography>
              <List dense>
                {result.success.slice(0, 10).map((item) => (
                  <ListItem key={item.guestId}>
                    <ListItemText
                      primary={item.name}
                      secondary={`Row ${item.rowNumber} → Guest ID ${item.guestId}${
                        item.invitationId
                          ? ` → Invitation #${item.invitationId}`
                          : " (no address)"
                      }`}
                    />
                  </ListItem>
                ))}
                {result.success.length > 10 && (
                  <ListItem>
                    <ListItemText
                      secondary={`... and ${
                        result.success.length - 10
                      } more`}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}

          {result.errors.length > 0 && (
            <Paper
              sx={{
                p: 2,
                backgroundColor: "#fff3cd",
                borderLeft: `4px solid ${colors.burntSienna}`,
              }}
            >
              <Typography
                variant="h6"
                sx={{ mb: 1, color: colors.burntSienna }}
              >
                Import Errors
              </Typography>
              <List dense>
                {result.errors.map((err, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`Row ${err.row}: ${err.error}`}
                      secondary={`Data: ${JSON.stringify(err.data)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};
