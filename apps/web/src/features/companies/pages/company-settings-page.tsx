import { useState } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { useAuth } from '@/shared/auth/use-auth';
import { useUpdateCompany } from '../hooks/use-update-company';

export default function CompanySettingsPage() {
  const { company } = useAuth();
  const { update, isLoading, error, success } = useUpdateCompany();

  const [name, setName] = useState(company?.name ?? '');
  const [cnpj, setCnpj] = useState(company?.cnpj ?? '');
  const [phone, setPhone] = useState(company?.phone ?? '');
  const [email, setEmail] = useState(company?.email ?? '');
  const [street, setStreet] = useState(company?.street ?? '');
  const [number, setNumber] = useState(company?.number ?? '');
  const [complement, setComplement] = useState(company?.complement ?? '');
  const [neighborhood, setNeighborhood] = useState(company?.neighborhood ?? '');
  const [city, setCity] = useState(company?.city ?? '');
  const [state, setState] = useState(company?.state ?? '');
  const [zipCode, setZipCode] = useState(company?.zipCode ?? '');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company) return;

    void update(company.id, {
      name,
      cnpj: cnpj || null,
      phone: phone || null,
      email: email || null,
      street: street || null,
      number: number || null,
      complement: complement || null,
      neighborhood: neighborhood || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
    });
  };

  if (!company) {
    return <Alert severity="info">Empresa não encontrada</Alert>;
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}
    >
      <Typography variant="h4">Configurações da Empresa</Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">Dados salvos com sucesso</Alert>}

      <TextField
        label="Nome"
        id="companyName"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
      />
      <TextField label="CNPJ" id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} fullWidth />
      <TextField label="Telefone" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
      <TextField label="E-mail" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
      <TextField label="Logradouro" id="street" value={street} onChange={(e) => setStreet(e.target.value)} fullWidth />
      <TextField label="Número" id="number" value={number} onChange={(e) => setNumber(e.target.value)} fullWidth />
      <TextField label="Complemento" id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} fullWidth />
      <TextField label="Bairro" id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} fullWidth />
      <TextField label="Cidade" id="city" value={city} onChange={(e) => setCity(e.target.value)} fullWidth />
      <TextField label="UF" id="state" value={state} onChange={(e) => setState(e.target.value)} fullWidth />
      <TextField label="CEP" id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} fullWidth />

      <Button type="submit" variant="contained" disabled={isLoading}>
        {isLoading ? 'Salvando...' : 'Salvar'}
      </Button>
    </Box>
  );
}