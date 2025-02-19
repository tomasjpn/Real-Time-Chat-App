import { Grid2 } from '@mui/material';
import { styled } from '@mui/material/styles';

const FullScreenGrid = styled(Grid2)(({ theme }) => ({
  width: '100vw',
  height: '100vh',
  maxWidth: '1920px',
  maxHeight: '1080px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  boxSizing: 'border-box',
  overflow: 'hidden',
}));

const StyledDiv = styled('div')({
  marginLeft: '3vw',
});

export { StyledDiv, FullScreenGrid };
