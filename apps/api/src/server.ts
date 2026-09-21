import 'dotenv/config';

import { app } from './app.js';
import { sequelize } from './shared/config/database.js';
import { seedRbac } from './shared/database/seed-rbac.js';

const PORT = process.env.PORT || 3333;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    await seedRbac();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

start();
