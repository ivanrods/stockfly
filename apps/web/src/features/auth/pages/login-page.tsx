import { useState } from 'react';
import { Box, TextField, Button, Alert, Typography } from '@mui/material';
import { useLogin } from '../hooks/use-login';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const { login, isLoading, error } = useLogin();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      const result = await login({ email, password });
      setSuccess(`Bem-vindo, ${result.user.name}!`);
    } catch {
      // error já está no hook
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 400,
        mx: 'auto',
        mt: 8,
        p: 3,
      }}
    >
      <Typography variant="h5" component="h1">
        Entrar
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField
        label="E-mail"
        id="email"
        type="email"
        placeholder="seu-email@exemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
      />

      <TextField
        label="Senha"
        id="password"
        type="password"
        placeholder="Digite sua senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
      />

      <Button type="submit" variant="contained" fullWidth disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
    </Box>
  );
}
