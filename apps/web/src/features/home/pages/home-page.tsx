import { Box, Typography } from '@mui/material';
import { useAuth } from '@/shared/auth/use-auth';

export default function HomePage() {
  const { user, company } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Início</Typography>
      <Typography variant="body1">Bem-vindo, {user?.name}!</Typography>
      {company && <Typography variant="body2">{company.name}</Typography>}
    </Box>
  );
}