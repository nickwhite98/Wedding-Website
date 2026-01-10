import { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Button,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useLocation } from "react-router-dom";

const pages = [
  { name: "Home", path: "/" },
  { name: "Our Story", path: "/story" },
  { name: "Wedding Details", path: "/details" },
  { name: "Registry", path: "/registry" },
  { name: "RSVP", path: "/rsvp" },
  { name: "Photos", path: "/photos" },
];

export const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const location = useLocation();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#ede3d4" }}>
      <Box sx={{ px: 3, width: "100%" }}>
        <Toolbar disableGutters>
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              sx={{ color: "#883d17" }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.name}
                  onClick={handleCloseNavMenu}
                  component={Link}
                  to={page.path}
                  selected={location.pathname === page.path}
                >
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Typography
            variant="h4"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              color: "#883d17",
              textDecoration: "none",
              "&:hover": {
                color: "#883d17",
              },
            }}
          >
            Kathryn & Nicholas
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              justifyItems: "center",
            }}
          >
            <Typography
              variant="h5"
              sx={{ textAlign: "center", mt: 2, color: "#883d17" }}
            >
              Kathryn & Nicholas
            </Typography>
            <Box
              sx={{
                flexGrow: 1,
                display: { xs: "none", md: "flex" },
                justifyContent: "center",
              }}
            >
              {pages.map((page) => (
                <Button
                  key={page.name}
                  component={Link}
                  to={page.path}
                  onClick={handleCloseNavMenu}
                  sx={{
                    m: 2,
                    color: "#883d17",
                    display: "block",
                    position: "relative",
                    borderRadius: 0,
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 0,
                      left: location.pathname === page.path ? 0 : "50%",
                      width: location.pathname === page.path ? "100%" : 0,
                      height: "2px",
                      backgroundColor: "#883d17",
                      transition: "width 0.3s ease, left 0.3s ease",
                    },
                    "&:hover::after": {
                      width: "100%",
                      left: 0,
                    },
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  {page.name}
                </Button>
              ))}
            </Box>
          </Box>
        </Toolbar>
      </Box>
    </AppBar>
  );
};
