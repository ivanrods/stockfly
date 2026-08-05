import express from 'express';
import { sequelize } from './shared/config/database.js';
const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

initializeDatabase();
export { app };

// ... existing code ...
