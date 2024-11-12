import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io("http://localhost:3000");

function App() {
  const [secretMessage, setSecretMessage] = useState("");

  useEffect(() => {

    // Listen for the "test" event from the server
    socket.on("test", (message) => {
      console.log("Received test message:", message);
      setSecretMessage(message);
    });

    // Clean up the socket listener when component unmounts
    return () => {
      socket.off("test");
    };
  }, []);

  // Emit the "chat-message" event to the server
  const sendMessage = () => {
    socket.emit("chat-message");
  };

  return (
    <div className="App">
      <h1>Socket.IO React Client</h1>
      <button onClick={sendMessage}>Send Chat Message</button>
      <p>Secret Message from Server: {secretMessage}</p>
    </div>
  );
}

export default App;