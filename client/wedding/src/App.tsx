import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Story } from './pages/Story';
import { Details } from './pages/Details';
import { Registry } from './pages/Registry';
import { RSVP } from './pages/RSVP';
import { Photos } from './pages/Photos';

function App() {
  return (
    <Router>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/story" element={<Story />} />
            <Route path="/details" element={<Details />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/rsvp" element={<RSVP />} />
            <Route path="/photos" element={<Photos />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
