import { styled } from '@mui/material/styles';

const MainGrid = styled('div')(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.07)',
  gridColumn: 'span 9',
  width: '100%',
  height: '100%',
  display: 'grid',
  gridTemplateRows: '1fr auto',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  boxSizing: 'border-box',
  borderRadius: theme.spacing(2),
}));

const UserInfoBar = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: '0.1vw solid rgba(204, 204, 204, 0.3)',
}));

const ChatContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '60vh',
  gap: theme.spacing(2.5),
}));

const UserListContainer = styled('div')(({ theme }) => ({
  width: '20vw',
  padding: theme.spacing(2),
  backgroundColor: 'rgba(245, 245, 245, 0.07)',
  borderRadius: '0.5vw',
  overflowY: 'auto',
}));

const UserItem = styled('div')<{ isSelected: boolean }>(
  ({ theme, isSelected }) => ({
    padding: theme.spacing(1),
    margin: `${theme.spacing(0.5)} 0`,
    cursor: 'pointer',
    backgroundColor: isSelected ? 'rgba(224, 224, 224, 0.1)' : 'transparent',
    borderRadius: '0.4vw',
    transition: 'background-color 0.2s',
  })
);

const ChatAreaContainer = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
});

const MessageContainer = styled('div')(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.07)',
  borderRadius: '0.5vw',
}));

const MessageWrapper = styled('div')<{ isSelf: boolean }>(({ isSelf }) => ({
  display: 'flex',
  justifyContent: isSelf ? 'flex-end' : 'flex-start',
  marginBottom: '1vw',
}));

const MessageBubble = styled('div')<{ isSelf: boolean }>(({ isSelf }) => ({
  backgroundColor: isSelf
    ? 'rgba(0, 123, 255, 0.8)'
    : 'rgba(233, 236, 239, 0.1)',
  color: isSelf ? 'white' : 'inherit',
  padding: '1vw 1.2vw',
  borderRadius: '1vw',
  maxWidth: '70%',
  wordBreak: 'break-word',
}));

const SenderName = styled('div')(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(0.5),
}));

const PlaceholderText = styled('div')({
  textAlign: 'center',
  color: 'rgba(102, 102, 102, 0.7)',
});

const InputDiv = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  minWidth: '40vw',
  background: 'rgba(255, 255, 255, 0.07)',
  padding: theme.spacing(4),
  borderRadius: '1vw',
}));

const InputElm = styled('input')(() => ({
  border: 'none',
  background: 'none',
  width: '100%',
  outline: 'none',
  '&:focus': {
    outline: 'none',
    boxShadow: 'none',
  },
}));

const SendMsgBtn = styled('button')({
  display: 'flex',
  justifyContent: 'flex-end',
});

export {
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
};
