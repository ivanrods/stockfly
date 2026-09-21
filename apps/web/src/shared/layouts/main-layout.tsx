import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/auth/use-auth';
import { useLogout } from '@/features/auth/hooks/use-logout';

export default function MainLayout() {
  const { user, company } = useAuth();
  const { logout, isLoading } = useLogout();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {company?.name ?? 'StockFly'}
          </Typography>
          <Button color="inherit" component={Link} to="/settings">
            Configurações
          </Button>
          <Typography variant="body2" sx={{ ml: 2 }}>
            {user?.name}
          </Typography>
          <Button color="inherit" onClick={() => void logout()} disabled={isLoading} sx={{ ml: 2 }}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}