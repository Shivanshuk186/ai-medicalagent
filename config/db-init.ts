import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export { db, schema };
