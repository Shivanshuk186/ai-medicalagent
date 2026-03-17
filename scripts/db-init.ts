import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function runSQL(sql: any, name: string) {
  try {
    const result = await sql;
    console.log(`  ✅ ${name}`);
    return result;
  } catch (err: any) {
    console.log(`  ⚠️  ${name}: ${err.message.substring(0, 60)}`);
  }
}

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not configured');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔗 Connected to Neon database\n');
    console.log('📋 Step 1: Adding missing columns...');
    
    // Execute each ALTER TABLE as a promise
    await runSQL(sql`ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "patientName" varchar`, 'patientName');
    await runSQL(sql`ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "age" integer`, 'age');
    await runSQL(sql`ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "emergencyDescription" text`, 'emergencyDescription');
    await runSQL(sql`ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "aiAnalysis" jsonb`, 'aiAnalysis');
    await runSQL(sql`ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "aiReason" text`, 'aiReason');
    await runSQL(sql`ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "imageUrl" varchar`, 'imageUrl');
    await runSQL(sql`ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "approvedBy" varchar`, 'approvedBy');
    await runSQL(sql`ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "approvedAt" varchar`, 'approvedAt');
    await runSQL(sql`ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "completedAt" varchar`, 'completedAt');

    console.log('\n🗑️  Step 2: Clearing existing queue...');
    try {
      await sql`DELETE FROM "emergency_queue"`;
      console.log('  ✅ Queue cleared');
    } catch {
      console.log('  ⚠️ Could not clear queue');
    }

    console.log('\n🌱 Step 3: Seeding 5 test patients...\n');
    
    const now = new Date();
    const patients = [
      { id: 'p1', name: 'John Anderson', age: 65, priority: 1, status: 'serving', doctor: 'Dr. Sarah Chen', offset: -10 },
      { id: 'p2', name: 'Maria Rodriguez', age: 42, priority: 2, status: 'waiting', doctor: null, offset: -7 },
      { id: 'p3', name: 'David Thompson', age: 38, priority: 2, status: 'waiting', doctor: null, offset: -5 },
      { id: 'p4', name: 'Emily Watson', age: 28, priority: 3, status: 'waiting', doctor: null, offset: -2 },
      { id: 'p5', name: 'Christopher Lee', age: 35, priority: 3, status: 'waiting', doctor: null, offset: -1 },
    ];

    for (const p of patients) {
      const arrivalTime = new Date(now.getTime() + p.offset * 60000).toISOString();

      try {
        await sql`
          INSERT INTO "emergency_queue" (
            "patientId", "patientName", "age", "symptoms", "priority", 
            "arrivalTime", "status", "updatedAt"
          ) VALUES (
            ${p.id}, ${p.name}, ${p.age}, ${JSON.stringify(['urgent'])}, ${p.priority},
            ${arrivalTime}, ${p.status}, ${now.toISOString()}
          )
        `;
        
        const badge = p.priority === 1 ? '🔴' : p.priority === 2 ? '🟠' : '🟢';
        console.log(`  ${badge} ${p.name} (${p.status})`);
      } catch (err: any) {
        console.error(`  ❌ ${p.name}: ${err.message.substring(0, 60)}`);
      }
    }

    console.log('\n✅ Database initialization completed!\n');
    console.log('Queue ready at localhost:3001/emergency');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initializeDatabase().then(() => {
  console.log('\nAll done! Press Ctrl+C to exit.');
  // Keep process alive briefly to see output
  setTimeout(() => process.exit(0), 1000);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
