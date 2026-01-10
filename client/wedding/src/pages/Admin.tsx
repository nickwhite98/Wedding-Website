import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
} from "@mui/material";
import { PasswordPrompt } from "../components/PasswordPrompt";
import { RsvpList } from "../components/admin/RsvpList";
import { GuestListManager } from "../components/admin/GuestListManager";
import { colors } from "../theme";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    // Check if already authenticated in this session
    const authStatus = sessionStorage.getItem("adminAuth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
    }
  }, []);

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
    setShowPasswordPrompt(false);
    sessionStorage.setItem("adminAuth", "true");
  };

  const handlePasswordCancel = () => {
    navigate("/");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    navigate("/");
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (!isAuthenticated) {
    return (
      <PasswordPrompt
        open={showPasswordPrompt}
        onSuccess={handlePasswordSuccess}
        onCancel={handlePasswordCancel}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{ color: colors.cognac }}
        >
          Admin Dashboard
        </Typography>
        <Button
          variant="outlined"
          onClick={handleLogout}
          sx={{
            color: colors.cognac,
            borderColor: colors.cognac,
            "&:hover": {
              borderColor: colors.burntSienna,
              backgroundColor: "rgba(193, 120, 84, 0.1)",
            },
          }}
        >
          Logout
        </Button>
      </Box>

      <Paper
        sx={{
          backgroundColor: colors.cream,
          backgroundImage: "none",
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              color: colors.softNavy,
              "&.Mui-selected": {
                color: colors.cognac,
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: colors.olive,
            },
          }}
        >
          <Tab label="RSVPs" />
          <Tab label="Guest List" />
          <Tab label="Photos" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <RsvpList />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <GuestListManager />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Typography variant="h5" sx={{ mb: 2, color: colors.cognac }}>
            Photo Management
          </Typography>
          <Typography variant="body1" sx={{ color: colors.softNavy }}>
            Photo management coming soon... You'll be able to upload and delete
            photos.
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  );
};
