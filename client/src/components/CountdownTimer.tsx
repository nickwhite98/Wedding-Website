import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '../theme';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = () => {
  const calculateTimeLeft = (): TimeLeft => {
    const weddingDate = new Date('2026-08-29T00:00:00').getTime();
    const now = new Date().getTime();
    const difference = weddingDate - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mx: { xs: 1, md: 2 },
      }}
    >
      <Typography
        variant="h3"
        sx={{
          color: colors.lightText.primary,
          fontWeight: 700,
          fontSize: { xs: '2rem', md: '3rem' },
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          minWidth: { xs: '50px', md: '70px' },
          textAlign: 'center',
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: colors.lightText.secondary,
          fontSize: { xs: '0.875rem', md: '1rem' },
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 4,
      }}
    >
      <TimeUnit value={timeLeft.days} label="Days" />
      <Typography
        sx={{
          color: colors.lightText.primary,
          fontSize: { xs: '1.5rem', md: '2rem' },
          mx: 0.5,
        }}
      >
        :
      </Typography>
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <Typography
        sx={{
          color: colors.lightText.primary,
          fontSize: { xs: '1.5rem', md: '2rem' },
          mx: 0.5,
        }}
      >
        :
      </Typography>
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <Typography
        sx={{
          color: colors.lightText.primary,
          fontSize: { xs: '1.5rem', md: '2rem' },
          mx: 0.5,
        }}
      >
        :
      </Typography>
      <TimeUnit value={timeLeft.seconds} label="Seconds" />
    </Box>
  );
};
