import Badge from '@mui/material/Badge';
import { styled } from '@mui/material/styles';

const MainContainer = styled('div')({
  display: 'flex',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  overflow: 'hidden',
});

const UserListContainer = styled('div')({
  width: '18vw',
  minWidth: '16vw',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  borderRight: '0.12vw solid rgba(255, 255, 255, 0.1)',
  padding: '1.2vw',
  boxSizing: 'border-box',
  overflowY: 'auto',
  minHeight: '100%',
  '&::-webkit-scrollbar': {
    width: '0.4vw',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.05)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.4vw',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.15)',
    },
  },
});

const UserListItem = styled('div')<{ isSelected: boolean }>(
  ({ isSelected }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1vw',
    padding: '0.9vw 1.2vw',
    borderRadius: '0.8vw',
    cursor: 'pointer',
    backgroundColor: isSelected
      ? 'rgba(0, 123, 255, 0.2)'
      : 'rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: isSelected
        ? 'rgba(0, 123, 255, 0.3)'
        : 'rgba(255, 255, 255, 0.1)',
    },
    '& > div': {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  })
);

const ChatAreaContainer = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  overflow: 'hidden',
});

const ChatHeaderBar = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '2.2vw',
  borderBottom: '0.12vw solid rgba(255, 255, 255, 0.1)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  height: '8.5vh',
  boxSizing: 'border-box',
  flexShrink: 0,
});

const MessageContainer = styled('div')({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '1.8vw',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2vw',
  '&::-webkit-scrollbar': {
    width: '0.4vw',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.4vw',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.15)',
    },
  },
});

const MessageGroup = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4vw',
});

const MessageWrapper = styled('div')<{ isSelf: boolean }>(({ isSelf }) => ({
  display: 'flex',
  justifyContent: isSelf ? 'flex-end' : 'flex-start',
  alignItems: 'flex-end',
  gap: '1vw',
  marginBottom: '0',
}));

const SenderAvatar = styled('div')({
  flexShrink: 0,
  width: '3vw',
  height: '3vw',
});

const CurrentSenderName = styled('div')({
  fontSize: '1vw',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.9)',
  marginBottom: '0.4vw',
});

const MessageBubble = styled('div')<{ isSelf: boolean }>(({ isSelf }) => ({
  padding: '1vw 1.4vw',
  borderRadius: '1.6vw',
  backgroundColor: isSelf
    ? 'rgba(0, 123, 255, 0.8)'
    : 'rgba(233, 236, 239, 0.08)',
  color: 'rgba(255, 255, 255, 0.95)',
  maxWidth: '60%',
  wordBreak: 'break-word',
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: isSelf
      ? 'rgba(0, 123, 255, 0.9)'
      : 'rgba(233, 236, 239, 0.12)',
  },
}));

const MessageContent = styled('div')({
  fontSize: '1vw',
  lineHeight: '1.4',
});

const PlaceholderText = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  textAlign: 'center',
  color: 'rgba(255, 255, 255, 0.4)',
  fontSize: '1.2vw',
  flex: 1,
});

const InputDiv = styled('div')({
  padding: '1.2vw',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderTop: '0.12vw solid rgba(255, 255, 255, 0.1)',
  boxSizing: 'border-box',
  flexShrink: 0,
});

const InputElm = styled('input')({
  border: 'none',
  background: 'none',
  width: '100%',
  outline: 'none',
  '&:focus': {
    outline: 'none',
    boxShadow: 'none',
  },
});

const SendMsgBtn = styled('button')({
  display: 'flex',
  justifyContent: 'flex-end',
});

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 0.25vw ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '0.05vw solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

export {
  ChatAreaContainer,
  ChatHeaderBar,
  InputDiv,
  InputElm,
  MainContainer,
  MessageBubble,
  MessageContainer,
  MessageGroup,
  MessageWrapper,
  MessageContent,
  PlaceholderText,
  SenderAvatar,
  CurrentSenderName,
  SendMsgBtn,
  StyledBadge,
  UserListContainer,
  UserListItem,
};
