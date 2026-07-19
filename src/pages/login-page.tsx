import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Link, TextField, Typography } from '@mui/material';
import { loginSchema, type LoginInput } from '@chat/shared';
import { useAuth } from '../auth/auth-context.tsx';
import { ApiError } from '../api/http.ts';
import { AuthLayout } from './auth-layout.tsx';
import { authFieldSx } from './auth-styles.ts';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (input: LoginInput) => {
    setServerError(null);
    try {
      await login(input);
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Login failed — try again'
      );
    }
  };

  return (
    <AuthLayout title="Sign in">
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
      >
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <TextField
          label="Username"
          autoComplete="username"
          autoFocus
          error={!!errors.username}
          helperText={errors.username?.message}
          sx={authFieldSx}
          {...field('username')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={authFieldSx}
          {...field('password')}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ paddingY: 1.2, fontWeight: 600 }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <Typography
          variant="body2"
          sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}
        >
          No account yet?{' '}
          <Link component={RouterLink} to="/register">
            Create one
          </Link>
        </Typography>
      </form>
    </AuthLayout>
  );
}
