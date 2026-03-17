import { db } from '@/config/db';
import * as fs from 'fs';
import * as path from 'path';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Running migration: update_emergency_queue_columns.sql');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'update_emergency_queue_columns.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = migrationContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await db.execute(sql.raw(statement));
    }
    
    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
