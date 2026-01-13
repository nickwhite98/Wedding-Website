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

const AppContent = () => {
  const navigate = useNavigate();

  // Enable Konami Code globally
  useKonamiCode(() => {
    navigate("/admin");
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
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
