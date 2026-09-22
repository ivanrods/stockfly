import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/routes/auth-routes';
import companyRoutes from './modules/companies/routes/company-routes';
import userRoutes from './modules/users/routes/user-routes';
import roleRoutes from './modules/roles/routes/role-routes';
import categoryRoutes from './modules/categories/routes/category-routes';
import supplierRoutes from './modules/suppliers/routes/supplier-routes';
import productRoutes from './modules/products/routes/product-routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

app.use('/auth', authRoutes);
app.use('/companies', companyRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/categories', categoryRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/products', productRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: () => void) => {
  console.error('Unhandled error:', err.message || err);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

export { app };
