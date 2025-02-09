import { Grid2 } from '@mui/material';
import { styled } from '@mui/material/styles';

const AppMainGrid = styled(Grid2)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
}));

const StyledDiv = styled('div')({
  marginLeft: '3vw',
});

export { AppMainGrid, StyledDiv };
