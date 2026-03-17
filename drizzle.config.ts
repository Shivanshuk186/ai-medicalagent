import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL (or DRIZZLE_DATABASE_URL) is required for Drizzle config');
}

export default defineConfig({
  schema: './config/schema.tsx',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
