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
import { useState, useEffect } from "react";

// Debug component - remove after fixing
const DebugOverlay = () => {
  const [info, setInfo] = useState({
    innerHeight: 0,
    scrollHeight: 0,
    clientHeight: 0,
    scrollY: 0,
    maxScroll: 0,
    rootHeight: 0,
    bodyHeight: 0,
  });

  useEffect(() => {
    const update = () => {
      const root = document.getElementById("root");
      setInfo({
        innerHeight: window.innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollY: Math.round(window.scrollY),
        maxScroll: document.documentElement.scrollHeight - window.innerHeight,
        rootHeight: root?.scrollHeight || 0,
        bodyHeight: document.body.scrollHeight,
      });
    };
    update();
    window.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 60,
        right: 10,
        backgroundColor: "rgba(0,0,0,0.9)",
        color: "#0f0",
        padding: "8px",
        fontSize: "11px",
        fontFamily: "monospace",
        zIndex: 99999,
        borderRadius: "4px",
        maxWidth: "220px",
      }}
    >
      <div>innerH: {info.innerHeight}</div>
      <div>scrollH: {info.scrollHeight}</div>
      <div>clientH: {info.clientHeight}</div>
      <div>scrollY: {info.scrollY}</div>
      <div>maxScroll: {info.maxScroll}</div>
      <div style={{ color: "#ff0" }}>overflow: {info.scrollHeight - info.clientHeight}px</div>
      <div style={{ marginTop: 4, borderTop: "1px solid #555", paddingTop: 4 }}>
        <div>rootH: {info.rootHeight}</div>
        <div>bodyH: {info.bodyHeight}</div>
      </div>
    </Box>
  );
};

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
        <DebugOverlay />
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
