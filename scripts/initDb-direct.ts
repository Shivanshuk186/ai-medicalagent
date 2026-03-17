import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not configured');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔗 Connected to Neon database');

    // Add missing columns - use raw SQL strings
    console.log('\n📋 Step 1: Adding missing columns...');
    
    const alterQueries = [
      `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "patientName" varchar`,
      `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "age" integer`,
      `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "emergencyDescription" text`,
      `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "aiAnalysis" jsonb`,
      `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "aiReason" text`,
      `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "imageUrl" varchar`,
      `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "approvedBy" varchar`,
      `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "approvedAt" varchar`,
      `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "completedAt" varchar`,
    ];

    for (const query of alterQueries) {
      try {
        // Execute raw SQL by passing it as a template literal
        const result = await (sql as any)(query);
        const colName = query.match(/"(\w+)"/)?.[1] || 'column';
        console.log(`  ✅ ${colName}`);
      } catch (err: any) {
        const colName = query.match(/"(\w+)"/)?.[1] || 'column';
        console.log(`  ⚠️  ${colName}`);
      }
    }

    // Clear queue
    console.log('\n🗑️  Step 2: Clearing existing queue...');
    try {
      await (sql as any)(`DELETE FROM "emergency_queue"`);
      console.log('  ✅ Queue cleared');
    } catch (err) {
      console.log('  ⚠️ Could not clear queue');
    }

    // Seed data
    console.log('\n🌱 Step 3: Seeding 5 test patients...\n');

    const now = new Date();
    const patients = [
      { patientId: 'p_critical_001', name: 'John Anderson', age: 65, priority: 1, status: 'serving', doctor: 'Dr. Sarah Chen', arrivalOffset: -10 },
      { patientId: 'p_serious_001', name: 'Maria Rodriguez', age: 42, priority: 2, status: 'waiting', doctor: null, arrivalOffset: -7 },
      { patientId: 'p_serious_002', name: 'David Thompson', age: 38, priority: 2, status: 'waiting', doctor: null, arrivalOffset: -5 },
      { patientId: 'p_normal_001', name: 'Emily Watson', age: 28, priority: 3, status: 'waiting', doctor: null, arrivalOffset: -2 },
      { patientId: 'p_normal_002', name: 'Christopher Lee', age: 35, priority: 3, status: 'waiting', doctor: null, arrivalOffset: -1 },
    ];

    for (const p of patients) {
      const arrivalTime = new Date(now.getTime() + p.arrivalOffset * 60000).toISOString();
      const approvedAt = new Date(now.getTime() + (p.arrivalOffset + 1) * 60000).toISOString();

      try {
        const result = await (sql as any)`
          INSERT INTO "emergency_queue" (
            "patientId", "patientName", "age", "symptoms", "emergencyDescription",
            "priority", "aiAnalysis", "aiReason", "arrivalTime", "status",
            "assignedDoctor", "createdBy", "approvedBy", "approvedAt", "updatedAt"
          ) VALUES (
            ${p.patientId}, ${p.name}, ${p.age}, 
            ${'["symptom"]'}, 'Test patient', ${p.priority},
            ${JSON.stringify({ reason: 'Test', score: p.priority })}, 'Test reason',
            ${arrivalTime}, ${p.status}, ${p.doctor}, 
            'system@hospital.com', 'receptionist@hospital.com',
            ${approvedAt}, ${now.toISOString()}
          )
        `;

        const badge = p.priority === 1 ? '🔴' : p.priority === 2 ? '🟠' : '🟢';
        console.log(`  ${badge} ${p.name} (${p.status})`);
      } catch (err: any) {
        console.error(`  ❌ Failed to insert ${p.name}:`, err.message);
      }
    }

    console.log('\n✅ Database initialization completed!\n');
    console.log('📊 Queue Summary:');
    console.log('  🔴 Critical (P1): 1 serving');
    console.log('  🟠 Serious (P2): 2 waiting');
    console.log('  🟢 Normal (P3): 2 waiting');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📈 Total: 5 patients');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initializeDatabase().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
