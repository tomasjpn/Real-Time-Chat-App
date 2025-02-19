import { Grid2 } from '@mui/material';
import { styled } from '@mui/material/styles';

const MainGrid = styled('div')(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.07)',
  width: '100%',
}));

const StyledDiv = styled('div')({
  marginLeft: '3vw',
});

const InputDiv = styled('div')(({ theme }) => ({
  display: 'flex',
  /* alignItems: 'center', */
  gap: theme.spacing(2),
  minWidth: '40vw',
  background: 'rgba(255, 255, 255, 0.07)',
  padding: theme.spacing(4),
  borderRadius: '1vw',
}));

const InputElm = styled('input')(({ theme }) => ({
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

export { MainGrid, StyledDiv, InputDiv, InputElm, SendMsgBtn };
