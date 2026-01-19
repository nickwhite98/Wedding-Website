import { Box, Typography, Button, Paper } from "@mui/material";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { DivIcon } from "leaflet";
import { colors } from "../theme";
import "leaflet/dist/leaflet.css";

// Modern Google-style marker using inline SVG - taller/more oblong shape
const modernMarkerSvg = `
  <svg width="28" height="42" viewBox="0 0 28 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
    <path filter="url(#shadow)" d="M14 0C6.268 0 0 6.268 0 14c0 10 14 28 14 28s14-18 14-28C28 6.268 21.732 0 14 0z" fill="#EA4335"/>
    <circle cx="14" cy="14" r="5" fill="#B31412"/>
  </svg>
`;

const venueIcon = new DivIcon({
  html: modernMarkerSvg,
  className: "custom-marker",
  iconSize: [28, 42],
  iconAnchor: [14, 42],
});

export const Travel = () => {
  const venueCoordinates: [number, number] = [
    44.89995101470253, -84.63170317445132,
  ];
  const mapCoordinates: [number, number] = [
    44.891948636404884, -84.62552478705584,
  ];

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapCoordinates[0]},${mapCoordinates[1]}`;

  const hotelInfo = {
    name: "Comfort Inn & Suites, Gaylord",
    address: "831 W. Main St.",
    city: "Gaylord, MI 49735",
    bookingUrl: "https://www.choicehotels.com/reservations/groups/pj75s0",
  };

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 4 },
        maxWidth: "900px",
        mx: "auto",
      }}
    >
      {/* Wedding Location Section */}
      <Paper
        elevation={0}
        sx={{
          mb: { xs: 4, md: 5 },
          backgroundColor: colors.warmIvory,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Text Content */}
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              flex: { md: 1 },
              textAlign: "left",
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              sx={{
                color: colors.heading,
                mb: 2.5,
                textAlign: "center",
              }}
            >
              Wedding Location
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.body,
                mb: 3,
              }}
            >
              Join us for our celebration at the White family's property,
              located in beautiful northern Michigan near Gaylord.
            </Typography>
            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="contained"
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  backgroundColor: colors.olive,
                  color: colors.cream,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  "&:hover": {
                    backgroundColor: colors.bronze,
                    color: colors.cream,
                  },
                }}
              >
                Get Directions
              </Button>
            </Box>
          </Box>

          {/* Leaflet Map */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              height: { xs: "250px", md: "300px" },
              flexShrink: 0,
              "& .leaflet-container": {
                height: "100%",
                width: "100%",
              },
            }}
          >
            <MapContainer
              center={venueCoordinates}
              zoom={16}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; Google"
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              />
              <Marker position={venueCoordinates} icon={venueIcon} />
            </MapContainer>
          </Box>
        </Box>
      </Paper>

      {/* Accommodations Section */}
      <Paper
        elevation={0}
        sx={{
          mb: { xs: 3, md: 4 },
          backgroundColor: colors.warmIvory,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Text Content */}
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              flex: { md: 1 },
              textAlign: "left",
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              sx={{
                color: colors.heading,
                mb: 2.5,
                textAlign: "center",
              }}
            >
              Accommodations
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: colors.body,
                mb: 2,
              }}
            >
              A hotel block is available at the Comfort Inn for those who want
              to use it. You can reserve your room by calling the front desk at
              989-217-9700 and referencing the "Beauchamp / White Wedding" or by
              clicking the booking button below.
            </Typography>

            <Box
              component="ul"
              sx={{
                color: colors.body,
                mb: 0,
                textAlign: "left",
                maxWidth: "500px",
                mx: "auto",
                pl: 2,
              }}
            >
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                Rooms must be booked before July 17th, 2026 to reserve the group
                rate and guarantee availability
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                Two night minimum stay required
              </Typography>
              <Typography component="li" variant="body1">
                Check-in is 4pm (earlier check-ins not guaranteed)
              </Typography>
            </Box>
          </Box>

          {/* Hotel Info */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 3, md: 4 },
            }}
          >
            <Box
              component="img"
              src="/comfort-inn.webp"
              alt="Comfort Inn & Suites, Gaylord"
              sx={{
                width: "100%",
                maxWidth: "300px",
                height: "auto",
                borderRadius: 2,
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: colors.heading,
                fontFamily: "'Kabel', sans-serif",
                fontWeight: 600,
                mb: 1,
              }}
            >
              {hotelInfo.name}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: colors.body,
                mb: 0.5,
              }}
            >
              {hotelInfo.address}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: colors.body,
                mb: 3,
              }}
            >
              {hotelInfo.city}
            </Typography>

            <Button
              variant="contained"
              href={hotelInfo.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                backgroundColor: colors.olive,
                color: colors.cream,
                fontWeight: 600,
                px: 3,
                py: 1,
                "&:hover": {
                  backgroundColor: colors.bronze,
                  color: colors.cream,
                },
              }}
            >
              Book Your Stay
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Transportation Section */}
      {/* <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          backgroundColor: colors.warmIvory,
          borderRadius: 2,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          sx={{
            color: colors.heading,
            mb: 2,
          }}
        >
          Transportation
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: colors.body,
            mb: 2,
          }}
        >
          A shuttle service will be available to transport guests between the
          hotel and venue. Details coming soon.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: colors.body,
          }}
        >
          Guests may also drive and park at the venue if preferred.
        </Typography>
      </Paper> */}
    </Box>
  );
};
