import { Container, Box, Typography } from '@mui/material';

export const RSVP = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          RSVP
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Coming soon...
        </Typography>
      </Box>
    </Container>
  );
};
