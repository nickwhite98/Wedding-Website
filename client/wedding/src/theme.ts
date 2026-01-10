import { createTheme } from "@mui/material/styles";

// Earthy Elegant Color Palette
export const colors = {
  // Primary earthy tones
  sage: "#9CAF88", // Sage green
  olive: "#b79966bb", // Olive
  eucalyptus: "#8BA899", // Eucalyptus
  terracotta: "#C17854", // Terracotta

  // Warm neutrals
  camel: "#D4A574", // Camel
  mushroom: "#B8A593", // Mushroom taupe
  cream: "#F5EFE7", // Cream
  warmIvory: "#EAE0D5", // Warm ivory

  // Accent colors
  dustyRose: "#D4A5A5", // Dusty rose
  burntSienna: "#B85C38", // Burnt sienna
  cognac: "#6B3E26", // Cognac brown
  softNavy: "#3D4F5C", // Soft warm navy

  // Additional neutrals
  goldenSand: "#E6BE8A", // Golden sand
  oatmeal: "#C9A66B", // Oatmeal
  bronze: "#4A5F4F", // Bronze green

  // Light text (for dark backgrounds)
  lightText: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.9)",
    tertiary: "rgba(255, 255, 255, 0.7)",
  },

  // Dark text (for light backgrounds)
  darkText: {
    primary: "#6B3E26", // Cognac brown
    secondary: "#3D4F5C", // Soft navy
    tertiary: "#8B7355", // Muted brown
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
      light: colors.eucalyptus,
      dark: colors.olive,
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
      paper: "#ffffff",
    },
    text: {
      primary: colors.cognac,
      secondary: colors.softNavy,
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
            color: "#ffffff",
            "&:hover": {
              backgroundColor: colors.olive,
            },
          },
          "&:hover": {
            backgroundColor: colors.eucalyptus,
            color: "#ffffff",
          },
        },
      },
    },
  },
});
