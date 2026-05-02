import { styled } from '@mui/material/styles';

const FullScreenGrid = styled('div')(() => ({
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  overflow: 'hidden',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
}));

const StyledDiv = styled('div')({
  marginLeft: '3vw',
});

export { StyledDiv, FullScreenGrid };
