import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Alert, Typography } from '@mui/material';
import { useRegister } from '../hooks/use-register';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [success, setSuccess] = useState('');
  const { register, isLoading, error } = useRegister();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !email || !password || !companyName) {
      return;
    }

    try {
      const result = await register({
        name,
        email,
        password,
        companyName,
        cnpj: cnpj || undefined,
        companyPhone: companyPhone || undefined,
        companyEmail: companyEmail || undefined,
      });
      setSuccess(result.message);
      navigate('/');
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

      <Typography variant="subtitle1" sx={{ mt: 1 }}>
        Dados da Empresa
      </Typography>

      <TextField
        label="Nome da empresa"
        id="companyName"
        placeholder="Empresa LTDA"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
        fullWidth
      />

      <TextField
        label="CNPJ"
        id="cnpj"
        placeholder="00.000.000/0000-00"
        value={cnpj}
        onChange={(e) => setCnpj(e.target.value)}
        fullWidth
      />

      <TextField
        label="Telefone da empresa"
        id="companyPhone"
        placeholder="(00) 00000-0000"
        value={companyPhone}
        onChange={(e) => setCompanyPhone(e.target.value)}
        fullWidth
      />

      <TextField
        label="E-mail da empresa"
        id="companyEmail"
        type="email"
        placeholder="contato@empresa.com"
        value={companyEmail}
        onChange={(e) => setCompanyEmail(e.target.value)}
        fullWidth
      />

      <Button type="submit" variant="contained" fullWidth disabled={isLoading}>
        {isLoading ? 'Criando conta...' : 'Criar Conta'}
      </Button>
    </Box>
  );
}