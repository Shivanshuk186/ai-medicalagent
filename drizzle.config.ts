import 'dotenv/config';

export default {
  schema: './config/schema.tsx',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
};
