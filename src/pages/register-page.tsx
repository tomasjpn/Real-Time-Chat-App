import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Link, TextField, Typography } from '@mui/material';
import {
  registerSchema,
  usernameSchema,
  type RegisterInput,
  type UsernameAvailabilityDTO,
} from '@chat/shared';
import { useAuth } from '../auth/auth-context.tsx';
import { ApiError, apiFetch } from '../api/http.ts';
import { AuthLayout } from './auth-layout.tsx';
import { authFieldSx } from './auth-styles.ts';

type Availability = 'unknown' | 'checking' | 'available' | 'taken';

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability>('unknown');

  const {
    register: field,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const username = watch('username');

  // Live availability check — advisory UX only; the server's UNIQUE
  // constraint makes the final call at submit time (409).
  useEffect(() => {
    if (!username || !usernameSchema.safeParse(username).success) {
      setAvailability('unknown');
      return;
    }
    setAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const result = await apiFetch<UsernameAvailabilityDTO>(
          `/auth/username-available?username=${encodeURIComponent(username)}`
        );
        setAvailability(result.available ? 'available' : 'taken');
      } catch {
        setAvailability('unknown');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const onSubmit = async (input: RegisterInput) => {
    setServerError(null);
    try {
      await registerAccount(input);
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Registration failed — try again'
      );
    }
  };

  const availabilityHint =
    availability === 'taken'
      ? 'This username is already taken'
      : availability === 'available'
        ? 'Username is available'
        : availability === 'checking'
          ? 'Checking availability…'
          : undefined;

  return (
    <AuthLayout title="Create account">
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
      >
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <TextField
          label="Username"
          autoComplete="username"
          autoFocus
          error={!!errors.username || availability === 'taken'}
          helperText={errors.username?.message ?? availabilityHint}
          sx={{
            ...authFieldSx,
            ...(availability === 'available' && {
              '& .MuiFormHelperText-root': {
                color: 'rgb(23, 189, 79)',
              },
            }),
          }}
          {...field('username')}
        />
        <TextField
          label="Display name (optional)"
          autoComplete="name"
          error={!!errors.displayName}
          helperText={
            errors.displayName?.message ?? 'Shown to other users; defaults to your username'
          }
          sx={authFieldSx}
          {...field('displayName', {
            setValueAs: (value: string) => (value === '' ? undefined : value),
          })}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={!!errors.password}
          helperText={errors.password?.message ?? 'At least 8 characters'}
          sx={authFieldSx}
          {...field('password')}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || availability === 'taken'}
          sx={{ paddingY: 1.2, fontWeight: 600 }}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>

        <Typography
          variant="body2"
          sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}
        >
          Already have an account?{' '}
          <Link component={RouterLink} to="/login">
            Sign in
          </Link>
        </Typography>
      </form>
    </AuthLayout>
  );
}
