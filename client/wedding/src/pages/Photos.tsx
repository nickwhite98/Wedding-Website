import { Container, Box, Typography } from '@mui/material';

export const Photos = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Photos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Coming soon...
        </Typography>
      </Box>
    </Container>
  );
};
