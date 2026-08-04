import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';

export default function App() {
  return (
    <Button variant="contained" startIcon={<DeleteIcon />}>
      Apagar
    </Button>
  );
}
