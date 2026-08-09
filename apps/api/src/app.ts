import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/routes/auth-routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

app.use('/auth', authRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: () => void) => {
  console.error('Unhandled error:', err.message || err);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

export { app };
