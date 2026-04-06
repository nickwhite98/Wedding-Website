import { Box, Typography, Paper } from "@mui/material";
import { colors } from "../theme";

const registries = [
  {
    name: "Amazon",
    url: "https://www.amazon.com/wedding/share/kathrynandnicholaswhite",
    logo: "/amazon-logo.webp",
    logoScale: 1.4,
    logoOffset: "translateY(4px)",
  },
  {
    name: "Pottery Barn",
    url: "https://www.potterybarn.com/registry/zb9lcgqmj5/registry-list.html",
    logo: "/pottery-barn.png",
    logoScale: 2.4,
    logoOffset: "translateY(0px)",
  },
];

export const Registry = () => {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: colors.cream,
          borderRadius: 0,
          overflow: "hidden",
          p: { xs: 3, md: 4 },
          mt: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          sx={{
            color: "#2c2c2c",
            mb: 1,
            textAlign: "center",
          }}
        >
          Registry
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#555",
            m: 4,
            maxWidth: 480,
            mx: "auto",
          }}
        >
          You can access our registries with the links below.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "center",
            alignItems: "stretch",
            gap: 3,
            maxWidth: 700,
            mx: "auto",
            mb: 3,
          }}
        >
          {registries.map((registry) => (
            <Box
              key={registry.name}
              component="a"
              href={registry.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                flex: 1,
                p: 3,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 120,
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                textDecoration: "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                cursor: "pointer",
                "&:hover": {
                  transform: "scale(1.04)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                },
              }}
            >
              <Box
                component="img"
                src={registry.logo}
                alt={`${registry.name} Registry`}
                sx={{
                  maxWidth: 200,
                  maxHeight: 60,
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  transform: `scale(${registry.logoScale}) ${registry.logoOffset}`,
                }}
              />
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
