import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CssBaseline, Box, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import { Navbar } from "./components/Navbar";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Story } from "./pages/Story";
import { Details } from "./pages/Details";
import { Registry } from "./pages/Registry";
import { RSVP } from "./pages/RSVP";
import { Photos } from "./pages/Photos";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <CssBaseline />
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
              <Route path="/story" element={<Story />} />
              <Route path="/details" element={<Details />} />
              <Route path="/registry" element={<Registry />} />
              <Route path="/rsvp" element={<RSVP />} />
              <Route path="/photos" element={<Photos />} />
            </Routes>
          </Layout>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
