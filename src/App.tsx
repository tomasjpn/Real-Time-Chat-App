import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

function App() {
  const [receivedMessage, setReceivedMessage] = useState<string[]>([]);
  const [messageInputValue, setMessageInputValue] = useState('');

  useEffect(() => {
    // Listen for the "test" event from the server
    socket.on('test', (message) => {
      console.log('Received tesxt message:', message);
      setReceivedMessage((prevMessages) => [...prevMessages, message]);
    });

    // Clean up the socket listener when component unmounts
    return () => {
      socket.off('test');
    };
  }, []);

  const renderMessageLine = () => {
    return (
      <div>
        <p>
          {receivedMessage.map((message, index) => (
            <h3 key={index}>{message}</h3>
          ))}
        </p>
      </div>
    );
  };

  // Emit the "chat-message" event to the server
  const sendMessage = () => {
    if (messageInputValue.trim()) {
      // Emits the message to the server
      socket.emit('chat-message', messageInputValue);
      // Reset the Input Field
      setMessageInputValue('');
      // Saves the received messages to display afterwards
      setReceivedMessage((prevMessages) => [
        ...prevMessages,
        messageInputValue,
      ]);
    }
  };

  return (
    <div className="App">
      <h1>Socket.IO React Client</h1>
      <div className="InputDiv">
        <div>{renderMessageLine()}</div>
        <input
          type="text"
          placeholder="text-message"
          value={messageInputValue}
          onChange={(e) => setMessageInputValue(e.target.value)}
        />
        <button onClick={sendMessage}>Send Chat Message</button>
      </div>
      <p>Last Message from Server: {receivedMessage}</p>
    </div>
  );
}

export default App;
