import Avatar from '@mui/material/Avatar';
import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SERVER_URL } from '../config.ts';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  ChatAreaContainer,
  ChatHeaderBar,
  InputDiv,
  MainContainer,
  MessageBubble,
  MessageContainer,
  MessageGroup,
  MessageWrapper,
  PlaceholderText,
  SenderAvatar,
  CurrentSenderName,
  UserListContainer,
  UserListItem,
  StyledBadge,
  MessageContent,
} from '../styles/components/current-chat.ts';

import {
  CHAT_HISTORY,
  CONNECT_ERROR,
  FETCH_CHAT_HISTORY,
  PRIVATE_MESSAGE,
  RECEIVE_PRIVATE_MESSAGE,
  USER_LIST,
  type ChatHistoryPayload,
  type ChatMessageDTO,
  type ClientToServerEvents,
  type PrivateMessageReceivedPayload,
  type ServerToClientEvents,
  type UserDTO,
  type UserListPayload,
} from '@chat/shared';
import { useAuth } from '../auth/auth-context.tsx';

interface CurrentChatProps {
  user: UserDTO;
}

const CurrentChat = ({ user }: CurrentChatProps) => {
  const { accessToken, logout } = useAuth();
  // Identity comes from the authenticated session
  const userName = user.displayName;
  const selfId = user.id;
  const [messageInputValue, setMessageInputValue] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<Record<string, string>>(
    {}
  );
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;

    // Identity travels in the handshake; the server rejects the
    // connection entirely if the token is missing or invalid.
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      SERVER_URL,
      {
        reconnection: false,
        auth: { token: accessToken },
      }
    );

    socketRef.current = socket;

    socket.on(CONNECT_ERROR, (error) => {
      console.error('Connection error:', error);
      setConnectionError(true);
      socket.disconnect();
    });

    socket.on(USER_LIST, (users: UserListPayload) => {
      console.log('Received user list:', users);
      setConnectedUsers(users);
    });

    socket.on(
      RECEIVE_PRIVATE_MESSAGE,
      (data: PrivateMessageReceivedPayload) => {
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

    socket.on(CHAT_HISTORY, (data: ChatHistoryPayload) => {
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
  }, [accessToken]);

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

    setChatMessages((prev) => [
      ...prev,
      {
        senderId: selfId,
        senderName: userName,
        message: messageInputValue.trim(),
        isSelf: true,
      },
    ]);
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
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        Cannot connect to the chat server. Your session may have expired —
        try reloading the page.
      </Box>
    );
  }

  const selectedUserName = selectedUser ? connectedUsers[selectedUser] : null;

  return (
    <MainContainer>
      {/* User List Sidebar */}
      <UserListContainer className="user-list-container">
        {/* User Profile Section */}
        <Paper
          className="self-area"
          sx={{
            background: 'rgba(255, 255, 255, 0.07)',
            padding: 2,
            marginBottom: 2,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
            >
              <Avatar alt={userName} src="" sx={{ width: 40, height: 40 }} />
            </StyledBadge>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                Logged in as
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'rgb(23, 189, 79)',
                }}
              >
                {userName}
              </Typography>
            </Box>
            <IconButton
              onClick={() => logout()}
              size="small"
              title="Log out"
              sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>

        {/* Users Title */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            marginBottom: 1,
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
          }}
        >
          Direct Messages
        </Typography>

        {/* User List */}
        <Box
          className="user-to-chat-area"
          sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
        >
          {Object.entries(connectedUsers).length === 0 ? (
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255, 255, 255, 0.5)', padding: 1 }}
            >
              No users online
            </Typography>
          ) : (
            Object.entries(connectedUsers).map(
              ([id, name]) =>
                id !== selfId && (
                  <UserListItem
                    key={id}
                    onClick={() => selectUser(id)}
                    isSelected={selectedUser === id}
                  >
                    <StyledBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                    >
                      <Avatar
                        alt={name}
                        src=""
                        sx={{ width: 32, height: 32 }}
                      />
                    </StyledBadge>
                    <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                      {name}
                    </Typography>
                  </UserListItem>
                )
            )
          )}
        </Box>
      </UserListContainer>

      {/* Chat Area */}
      <ChatAreaContainer className="chat-area-container">
        {/* Chat Header */}
        {selectedUser ? (
          <ChatHeaderBar className="chat-header-bar">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StyledBadge
                className="status-badge"
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
              >
                <Avatar alt={selectedUserName || ''} src="" />
              </StyledBadge>
              <Box className="chat-header-text">
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    lineHeight: '1vw',
                    marginTop: '1vw',
                  }}
                >
                  {selectedUserName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                >
                  Active
                </Typography>
              </Box>
            </Box>
          </ChatHeaderBar>
        ) : (
          <ChatHeaderBar className="chat-header-bar">
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Select a conversation
            </Typography>
          </ChatHeaderBar>
        )}

        {/* Messages Container */}
        <MessageContainer className="message-container" ref={chatContainerRef}>
          {selectedUser ? (
            isLoading ? (
              <PlaceholderText>Loading messages...</PlaceholderText>
            ) : chatMessages.length > 0 ? (
              chatMessages.map((msg, index) => {
                const showGroupHeader =
                  index === 0 ||
                  chatMessages[index - 1].senderId !== msg.senderId;

                return (
                  <MessageGroup className="message-group" key={index}>
                    <MessageWrapper isSelf={msg.isSelf}>
                      {!msg.isSelf && showGroupHeader ? (
                        <SenderAvatar>
                          <Avatar
                            alt={msg.senderName}
                            src=""
                            sx={{ width: 32, height: 32 }}
                          />
                        </SenderAvatar>
                      ) : (
                        <Box sx={{ width: '3vw' }} />
                      )}
                      {!msg.isSelf && showGroupHeader ? (
                        <Box className="message-sender-info">
                          <CurrentSenderName>
                            {msg.senderName}
                          </CurrentSenderName>
                          <MessageBubble isSelf={msg.isSelf}>
                            <MessageContent>{msg.message}</MessageContent>
                          </MessageBubble>
                        </Box>
                      ) : (
                        <MessageBubble isSelf={msg.isSelf}>
                          <MessageContent>{msg.message}</MessageContent>
                        </MessageBubble>
                      )}
                    </MessageWrapper>
                  </MessageGroup>
                );
              })
            ) : (
              <PlaceholderText>
                Start your conversation with {selectedUserName}
              </PlaceholderText>
            )
          ) : (
            <PlaceholderText>Select a user to start chatting</PlaceholderText>
          )}
        </MessageContainer>

        {/* Input Area */}
        <InputDiv className="current-chat-input-field">
          <TextField
            className="text-field"
            fullWidth
            placeholder={
              selectedUser ? 'Type your message...' : 'Select a user first'
            }
            value={messageInputValue}
            onChange={(e) => setMessageInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={!selectedUser}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'rgba(255, 255, 255, 0.8)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(0, 123, 255, 0.5)',
                },
              },
              '& .MuiOutlinedInput-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.4)',
                opacity: 1,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment className="input-button-div" position="end">
                  <IconButton
                    onClick={sendMessage}
                    disabled={!selectedUser || !messageInputValue.trim()}
                    edge="end"
                    sx={{
                      color: messageInputValue.trim()
                        ? 'rgba(0, 123, 255, 0.8)'
                        : 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </InputDiv>
      </ChatAreaContainer>
    </MainContainer>
  );
};

export default CurrentChat;
