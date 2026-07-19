import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function AuthLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        sx={{
          width: 'min(400px, 90vw)',
          padding: 4,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.87)',
          }}
        >
          {title}
        </Typography>
        {children}
      </Paper>
    </Box>
  );
}

