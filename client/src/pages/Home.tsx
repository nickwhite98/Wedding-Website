import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CountdownTimer } from "../components/CountdownTimer";
import { colors } from "../theme";

export const Home = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        backgroundImage: "url(/homepage.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: { xs: "45% center", md: "center" },
        backgroundRepeat: "no-repeat",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: 1,
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 2 }}>
        <Typography
          variant="h1"
          component="h1"
          gutterBottom
          sx={{
            color: "white",
            fontWeight: 700,
            fontSize: { xs: "3rem", md: "5rem" },
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            mb: 4,
          }}
        >
          August 29th, 2026
        </Typography>

        <CountdownTimer />

        {false && (
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/rsvp")}
            sx={{
              fontSize: "1.5rem",
              padding: "1rem 3rem",
              backgroundColor: "transparent",
              color: colors.lightText.primary,
              borderColor: colors.lightText.primary,
              borderWidth: "2px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderColor: colors.lightText.primary,
              },
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            }}
          >
            RSVP
          </Button>
        )}
      </Box>
    </Box>
  );
};
