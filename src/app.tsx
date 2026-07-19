import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './auth/auth-context.tsx';
import { LoginPage } from './pages/login-page.tsx';
import { RegisterPage } from './pages/register-page.tsx';
import CurrentChat from './components/current-chat.tsx';

function CenteredSpinner() {
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
      <CircularProgress />
    </Box>
  );
}

function ChatScreen() {
  const { user, initializing } = useAuth();

  if (initializing) return <CenteredSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <CurrentChat user={user} />
    </Box>
  );
}

function AnonymousOnly({ children }: { children: React.ReactElement }) {
  const { user, initializing } = useAuth();

  if (initializing) return <CenteredSpinner />;
  if (user) return <Navigate to="/" replace />;

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <AnonymousOnly>
                <LoginPage />
              </AnonymousOnly>
            }
          />
          <Route
            path="/register"
            element={
              <AnonymousOnly>
                <RegisterPage />
              </AnonymousOnly>
            }
          />
          <Route path="/" element={<ChatScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
