import { Box, Typography } from '@mui/material';

export const Story = () => {
  return (
    <Box sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Our Story
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Coming soon...
      </Typography>
    </Box>
  );
};
