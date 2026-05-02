// App.tsx
import { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import CurrentChat from './components/current-chat.tsx';

function App() {
  const [userName, setUserName] = useState('');
  const hasPrompted = useRef(false);

  // Ensures that the promt request is only 1 time after entering once
  useEffect(() => {
    if (!hasPrompted.current) {
      const inputUserName = prompt('Please enter an username:') || 'Private';
      setUserName(inputUserName);
      hasPrompted.current = true;
    }
  }, []);

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <CurrentChat userName={userName} />
    </Box>
  );
}

export default App;
