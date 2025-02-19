// App.tsx
import { useState, useRef, useEffect } from 'react';
import { FullScreenGrid } from '../src/styles/components/App';
import CurrentChat from './components/CurrentChat';

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
    <FullScreenGrid>
      <h1>Real Time Chat (Socket.IO)</h1>
      <CurrentChat userName={userName} />
    </FullScreenGrid>
  );
}

export default App;
