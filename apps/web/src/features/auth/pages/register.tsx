import { useState } from 'react';
import { Box, TextField, Button, Alert, Typography } from '@mui/material';
import { useRegister } from '../hooks/use-register';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const { register, isLoading, error } = useRegister();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !email || !password) {
      return;
    }

    try {
      const result = await register({ name, email, password });
      setSuccess(result.message);
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
        Criar Conta
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField
        label="Nome"
        id="name"
        placeholder="Seu nome completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
      />

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
        helperText="Mínimo de 8 caracteres"
      />

      <Button type="submit" variant="contained" fullWidth disabled={isLoading}>
        {isLoading ? 'Criando conta...' : 'Criar Conta'}
      </Button>
    </Box>
  );
}
