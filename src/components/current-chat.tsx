import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import {
  MainGrid,
  UserInfoBar,
  ChatContainer,
  UserListContainer,
  UserItem,
  ChatAreaContainer,
  MessageContainer,
  MessageWrapper,
  MessageBubble,
  SenderName,
  PlaceholderText,
  InputDiv,
  InputElm,
  SendMsgBtn,
} from '../styles/components/current-chat.ts';

import {
  CHAT_HISTORY,
  CLIENT_CONNECTION,
  CONNECT_ERROR,
  FETCH_CHAT_HISTORY,
  NEW_USER,
  PRIVATE_MESSAGE,
  RECEIVE_PRIVATE_MESSAGE,
  SELF_ID,
  USER_LIST,
} from '../../server/src/socket-events/socket-events.js';

interface Message {
  senderId: string;
  senderName: string;
  message: string;
  isSelf: boolean;
  timestamp?: string;
}

interface CurrentChatProps {
  userName: string;
}

const CurrentChat = ({ userName }: CurrentChatProps) => {
  const [messageInputValue, setMessageInputValue] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<Record<string, string>>(
    {}
  ); // Record -> { socket.id : userName }
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Setup socket connection - only once when component mounts
  useEffect(() => {
    const socket = io('http://localhost:3000', {
      reconnection: false,
    });

    socketRef.current = socket;
    /*
      Handling connection failures from next(error)
      connect_error built-in Socket.IO event --> correlation with server.ts/next(error) 
    */
    socket.on(CONNECT_ERROR, (error) => {
      console.error('Connection error:', error);
      setConnectionError(true);
      socket.disconnect();
    });
    // Successful connection
    socket.on(CLIENT_CONNECTION, () => {
      console.log('Connected to server');
      socket.emit(NEW_USER, userName);
    });

    socket.on(SELF_ID, (id: string) => {
      console.log('Received self ID:', id);
      setSelfId(id);
    });

    socket.on(USER_LIST, (users: Record<string, string>) => {
      console.log('Received user list:', users);
      setConnectedUsers(users);
    });

    socket.on(
      RECEIVE_PRIVATE_MESSAGE,
      (data: { senderId: string; senderName: string; message: string }) => {
        console.log('Received private message:', data);
        if (data.senderId === selectedUser || !selectedUser) {
          setChatMessages((prev) => [
            ...prev,
            {
              ...data,
              isSelf: false,
            },
          ]);
        }
      }
    );

    socket.on(CHAT_HISTORY, (data: { messages: Message[]; error?: string }) => {
      console.log('Received chat history:', data);
      if (data.error) {
        console.error('Error fetching chat history:', data.error);
      } else {
        setChatMessages(data.messages);
      }
      setIsLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [userName]); // Only depend on userName

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = () => {
    if (!socketRef.current || !selectedUser || !messageInputValue.trim())
      return;

    const messageData = {
      targetId: selectedUser,
      message: messageInputValue.trim(),
    };

    socketRef.current.emit(PRIVATE_MESSAGE, messageData);

    // Add message to local state
    setChatMessages((prev) => [
      ...prev,
      {
        senderId: selfId,
        senderName: userName,
        message: messageInputValue.trim(),
        isSelf: true,
      },
    ]);
    // Reset the Input Field
    setMessageInputValue('');
  };

  const selectUser = (userId: string) => {
    if (userId !== selfId) {
      setSelectedUser(userId);
      setChatMessages([]);
      setIsLoading(true);

      if (socketRef.current) {
        socketRef.current.emit(FETCH_CHAT_HISTORY, { targetId: userId });
      }
    }
  };

  if (connectionError) {
    return (
      <div>Cannot connect. Chat room is full. Please try again later.</div>
    );
  }

  return (
    <MainGrid>
      <UserInfoBar>
        Logged in as: {userName} (Your ID: {selfId})
      </UserInfoBar>

      <ChatContainer>
        {/* User List */}
        <UserListContainer>
          <h3>Select User to Chat</h3>
          {Object.entries(connectedUsers).map(
            ([id, name]) =>
              id !== selfId && (
                <UserItem
                  key={id}
                  onClick={() => selectUser(id)}
                  isSelected={selectedUser === id}
                >
                  {name} {selectedUser === id ? '(Selected)' : ''}
                </UserItem>
              )
          )}
        </UserListContainer>

        {/* Chat Area */}
        <ChatAreaContainer>
          <MessageContainer ref={chatContainerRef}>
            {selectedUser ? (
              isLoading ? (
                <PlaceholderText>Loading messages...</PlaceholderText>
              ) : chatMessages.length > 0 ? (
                chatMessages.map((msg, index) => (
                  <MessageWrapper key={index} isSelf={msg.isSelf}>
                    <MessageBubble isSelf={msg.isSelf}>
                      <SenderName>
                        {msg.isSelf ? 'You' : msg.senderName}
                      </SenderName>
                      {msg.message}
                    </MessageBubble>
                  </MessageWrapper>
                ))
              ) : (
                <PlaceholderText>
                  Start your conversation with {connectedUsers[selectedUser]}
                </PlaceholderText>
              )
            ) : (
              <PlaceholderText>Select a user to start chatting</PlaceholderText>
            )}
          </MessageContainer>

          <InputDiv>
            <InputElm
              type="text"
              placeholder={
                selectedUser ? 'Type your message...' : 'Select a user first'
              }
              value={messageInputValue}
              onChange={(e) => setMessageInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!selectedUser}
            />
            <SendMsgBtn
              onClick={sendMessage}
              disabled={!selectedUser || !messageInputValue.trim()}
            >
              Send
            </SendMsgBtn>
          </InputDiv>
        </ChatAreaContainer>
      </ChatContainer>
    </MainGrid>
  );
};

export default CurrentChat;
