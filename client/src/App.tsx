import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { CssBaseline, Box, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import { Navbar } from "./components/Navbar";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Story } from "./pages/Story";
import { Details } from "./pages/Details";
import { Travel } from "./pages/Travel";
import { Venue } from "./pages/Venue";
import { Registry } from "./pages/Registry";
import { RSVP } from "./pages/RSVP";
import { Photos } from "./pages/Photos";
import { Admin } from "./pages/Admin";
import { useKonamiCode } from "./hooks/useKonamiCode";
import { useEffect } from "react";

// Hook to lock the initial viewport height on iOS Chrome
const useViewportHeightFix = () => {
  useEffect(() => {
    // Only apply on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Capture the initial inner height (with address bar visible)
    const initialHeight = window.innerHeight;

    // Set CSS custom property for the initial height
    document.documentElement.style.setProperty('--initial-vh', `${initialHeight}px`);

    // Set max-height on html to prevent expansion when address bar hides
    document.documentElement.style.height = `${initialHeight}px`;
    document.documentElement.style.overflow = 'auto';

    return () => {
      document.documentElement.style.removeProperty('--initial-vh');
      document.documentElement.style.height = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
};

const AppContent = () => {
  const navigate = useNavigate();

  // Fix iOS Chrome viewport height issue
  useViewportHeightFix();

  // Enable Konami Code globally
  useKonamiCode(() => {
    navigate("/admin");
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100svh",
        width: "100%",
      }}
    >
      <Navbar />

      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/venue" element={<Venue />} />
          <Route path="/registry" element={<Registry />} />
          {/* Hidden routes - not in nav but still accessible */}
          <Route path="/story" element={<Story />} />
          <Route path="/details" element={<Details />} />
          <Route path="/rsvp" element={<RSVP />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <CssBaseline />
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
