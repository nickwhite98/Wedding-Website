import { Container, Box, Typography } from '@mui/material';

export const Home = () => {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Our Wedding
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          We're so excited to celebrate our special day with you
        </Typography>
      </Box>
    </Container>
  );
};
