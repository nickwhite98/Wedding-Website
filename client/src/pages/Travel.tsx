import { Box, Typography, Button, Paper } from "@mui/material";
import { colors } from "../theme";

export const Travel = () => {
  const gateCoordinates: [number, number] = [
    44.90029176804298, -84.6150316177434,
  ];

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${gateCoordinates[0]},${gateCoordinates[1]}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${gateCoordinates[0]},${gateCoordinates[1]}`;

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
      {/* Venue Directions Section */}
      <Paper
        elevation={0}
        sx={{
          mb: { xs: 4, md: 5 },
          p: { xs: 3, md: 4 },
          backgroundColor: colors.warmIvory,
          borderRadius: 2,
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
          Venue Directions
        </Typography>

        <Typography variant="body1" sx={{ color: colors.body, mb: 2 }}>
          Our celebration is at the White family's property in northern Michigan
          near Gaylord. The entrance to the venue is off of Viking Club Rd — the
          exact location of the gate is shared at the link below.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
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
            Directions (Google Maps)
          </Button>
          <Button
            variant="contained"
            href={appleMapsUrl}
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
            Directions (Apple Maps)
          </Button>
        </Box>

        <Typography
          variant="h6"
          sx={{
            color: colors.heading,
            fontFamily: "'Kabel', sans-serif",
            fontWeight: 600,
            mb: 1,
          }}
        >
          From I-75
        </Typography>
        <Box component="ol" sx={{ color: colors.body, mb: 2, pl: 2.5 }}>
          <Typography component="li" variant="body1" sx={{ mb: 1 }}>
            Take Exit 270 (Waters).
          </Typography>
          <Typography component="li" variant="body1" sx={{ mb: 1 }}>
            Head west on Marlette Rd for 3.3 miles, then turn left onto Viking
            Club Rd.
          </Typography>
          <Typography component="li" variant="body1">
            Follow Viking Club Rd for 2 miles to the gate.
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: colors.body, mb: 3 }}>
          We recommend using one of the map links above for turn-by-turn
          directions to the gate.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: colors.heading,
            fontFamily: "'Kabel', sans-serif",
            fontWeight: 600,
            mb: 1,
          }}
        >
          Once You Arrive
        </Typography>
        <Typography variant="body1" sx={{ color: colors.body }}>
          From the gate, follow the signs to the parking area.{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            Please note it's roughly a 5-minute drive from the gate to the
            parking area on the property, plus about a 5-minute walk from parking
            to the ceremony site, so plan your arrival accordingly.
          </Box>
        </Typography>
      </Paper>

      {/* Taxi Information Section */}
      <Paper
        elevation={0}
        sx={{
          mb: { xs: 3, md: 4 },
          p: { xs: 3, md: 4 },
          backgroundColor: colors.warmIvory,
          borderRadius: 2,
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
          Taxi Information
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: colors.body,
            mb: 2,
            textAlign: "left",
          }}
        >
          Complimentary taxi service is provided for guests staying at the hotel,
          with a 15-person shuttle running to and from the venue.
        </Typography>

        <Box
          sx={{
            mb: 3,
            textAlign: "left",
          }}
        >
          {/* Drop-off to the wedding */}
          <Typography
            variant="h6"
            sx={{
              color: colors.heading,
              fontFamily: "'Kabel', sans-serif",
              fontWeight: 600,
              mb: 1,
            }}
          >
            Drop-off to the wedding
          </Typography>
          <Box component="ul" sx={{ color: colors.body, mb: 3, pl: 2 }}>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              First shuttle — Pickup: 3:00 PM · Drop-off: ~3:20 PM
            </Typography>
            <Typography component="li" variant="body1">
              Second shuttle — Pickup: 3:40 PM · Drop-off: ~4:00 PM
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: colors.body, mb: 3 }}>
            The shuttle drops guests off at the White family house, where you'll
            be shuttled by golf cart the rest of the way to the ceremony
            location.
          </Typography>

          {/* Return to the hotel */}
          <Typography
            variant="h6"
            sx={{
              color: colors.heading,
              fontFamily: "'Kabel', sans-serif",
              fontWeight: 600,
              mb: 1,
            }}
          >
            Return to the hotel
          </Typography>
          <Box component="ul" sx={{ color: colors.body, pl: 2 }}>
            <Typography component="li" variant="body1">
              Available between 10:00 PM and 12:00 AM
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: colors.body,
            mb: 2,
            textAlign: "left",
          }}
        >
          Guests not staying at the hotel can arrange a ride with North 2 Central
          Taxi LLC at{" "}
          <Box
            component="a"
            href="tel:+12313211300"
            sx={{ color: colors.bronze, fontWeight: 600, whiteSpace: "nowrap" }}
          >
            231-321-1300
          </Box>
          .
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: colors.body,
            textAlign: "left",
          }}
        >
          Parking is available at the venue for anyone who prefers to drive to and
          from the celebration themselves.
        </Typography>
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
