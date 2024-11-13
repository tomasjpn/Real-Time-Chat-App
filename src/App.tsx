import { ReactNode, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

interface UserData {
  message: string;
  userName: string;
  isSelf: boolean;
}

function App() {
  const [receivedMessage, setReceivedMessage] = useState<UserData[]>([]);
  const [messageInputValue, setMessageInputValue] = useState('');
  const [userName, setUserName] = useState('');
  const [currentlyConnectedUsers, setCurrentlyConnectedUsers] = useState<
    Record<string, string>
  >({}); // Record -> { socket.id : userName }
  const hasPrompted = useRef(false);

  useEffect(() => {
    // Ensures that the promt request is only 1 time after entering once
    if (!hasPrompted.current) {
      const inputUserName = prompt('Please enter an username:') || 'Private';
      setUserName(inputUserName);
      socket.emit('new-user', inputUserName);
      hasPrompted.current = true;
    }

    // Listen for the "serverTransferedMessage" event from the server
    socket.on(
      'serverTransferedMessage',
      (userData: { message: string; userName: string }) => {
        console.log('Received tesxt message:', userData);
        setReceivedMessage((prevMessages) => [
          ...prevMessages,
          {
            message: userData.message,
            userName: userData.userName,
            isSelf: false,
          },
        ]);
      }
    );

    // Listen for current user connections
    socket.on('user-connected', (users: Record<string, string>) => {
      setCurrentlyConnectedUsers(users);
    });

    // Clean up the socket listener when component unmounts
    return () => {
      socket.off('serverTransferedMessage');
      socket.off('user-connected');
    };
  }, []);

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
        { message: messageInputValue, userName: userName, isSelf: true },
      ]);
    }
  };

  const renderMessageLine = () => {
    return (
      <div className="space-y-2">
        {receivedMessage.map((message, index) => (
          <div
            key={index}
            className={`p-2 rounded ${
              message.isSelf ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
            } max-w-[100%] inline-block`}
          >
            <div className="text-sm font-semibold">
              <strong>{message.isSelf ? 'You' : message.userName}: </strong>
              {message.message}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLastMessage = (): ReactNode => {
    const lastMessage = receivedMessage[receivedMessage.length - 1];
    if (!lastMessage) return 'No messages yet';
    return (
      <span>
        <strong>{lastMessage.userName}: </strong> {lastMessage.message}
      </span>
    );
  };

  return (
    <div className="App">
      <h1>Real Time Chat (Socket.IO)</h1>
      <div className="text-sm text-gray-600">Logged in as: {userName}</div>
      <div>{renderMessageLine()}</div>
      <div className="InputDiv">
        <input
          type="text"
          placeholder="text-message"
          value={messageInputValue}
          onChange={(e) => setMessageInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send Chat Message</button>
      </div>
      <p>Last Message : {renderLastMessage()}</p>
      <div className="space-y-1">
        {Object.values(currentlyConnectedUsers).map((name, index) => (
          <div key={index} className="text-sm text-gray-600">
            • {name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
