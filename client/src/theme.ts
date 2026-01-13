import { createTheme } from "@mui/material/styles";

// Earthy Elegant Color Palette
export const colors = {
  // Primary earthy tones
  sage: "#A4B494", // Sage green - soft muted green
  olive: "#5d6239", // Olive - for buttons
  eucalyptus: "#7A9A8A", // Eucalyptus - gray-green
  terracotta: "#C67B5C", // Terracotta - warm rust-orange

  // Warm neutrals
  camel: "#CAB49C", // Camel - from PDF hex codes
  mushroom: "#B5A898", // Mushroom taupe
  cream: "#f6f4f0", // Cream - warm off-white background
  warmIvory: "#ede3d4", // Warm ivory - matches navbar background

  // Accent colors
  dustyRose: "#C9A9A6", // Dusty rose - muted pink
  burntSienna: "#A65D3F", // Burnt sienna - rich rust
  cognac: "#8A6240", // Cognac - warm brown (accent use only)

  // Text colors - unified warm rust
  heading: "#883d17", // Warm rust - for headings
  body: "#883d17", // Warm rust - for body text
  bodyLight: "#883d17", // Warm rust - for secondary text

  // Additional neutrals
  goldenSand: "#D9C4A5", // Golden sand
  oatmeal: "#C9B896", // Oatmeal
  bronze: "#6B7A5C", // Bronze green - lighter for hover

  // Light text (for dark backgrounds)
  lightText: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.9)",
    tertiary: "rgba(255, 255, 255, 0.7)",
  },

  // Dark text (for light backgrounds)
  darkText: {
    primary: "#883d17", // Warm rust
    secondary: "#883d17", // Warm rust
    tertiary: "#883d17", // Warm rust
  },
};

export const theme = createTheme({
  typography: {
    fontFamily: "'Kabel', sans-serif",
    h1: {
      fontFamily: "'Brightwall', cursive",
      fontWeight: 400,
      letterSpacing: "0.02em",
    },
    h2: {
      fontFamily: "'Brightwall', cursive",
      fontWeight: 400,
      letterSpacing: "0.02em",
    },
    h3: {
      fontFamily: "'Brightwall', cursive",
      fontWeight: 400,
      letterSpacing: "0.02em",
    },
    h4: {
      fontFamily: "'Brightwall', cursive",
      fontWeight: 400,
      letterSpacing: "0.02em",
    },
    h5: {
      fontFamily: "'Brightwall', cursive",
      fontWeight: 400,
      letterSpacing: "0.02em",
    },
    h6: {
      fontFamily: "'Brightwall', cursive",
      fontWeight: 400,
      letterSpacing: "0.02em",
    },
    button: {
      fontFamily: "'Kabel', sans-serif",
      fontWeight: 500,
    },
  },
  palette: {
    primary: {
      main: colors.olive,
      light: colors.sage,
      dark: colors.bronze,
      contrastText: "#ffffff",
    },
    secondary: {
      main: colors.terracotta,
      light: colors.dustyRose,
      dark: colors.burntSienna,
      contrastText: "#ffffff",
    },
    background: {
      default: colors.cream,
      paper: colors.warmIvory,
    },
    text: {
      primary: "#883d17",
      secondary: "#883d17",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: "inherit",
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: colors.sage,
            color: colors.heading,
            "&:hover": {
              backgroundColor: colors.olive,
              color: colors.heading,
            },
          },
          "&:hover": {
            backgroundColor: colors.eucalyptus,
            color: colors.heading,
          },
        },
      },
    },
  },
});
