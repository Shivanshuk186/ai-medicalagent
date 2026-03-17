import { sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Initialize connection
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL not found in environment variables');
}

console.log('🔗 Connecting to Neon database...');
const client = neon(dbUrl);
const db = drizzle(client);

async function initializeDatabase() {
  try {
    console.log('📊 Starting database initialization...\n');

    // Step 1: Create emergency_queue table with all columns
    console.log('📋 Step 1: Creating emergency_queue table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "emergency_queue" (
        "id" SERIAL PRIMARY KEY,
        "patientId" VARCHAR NOT NULL UNIQUE,
        "patientName" VARCHAR NOT NULL,
        "age" INTEGER,
        "symptoms" JSONB NOT NULL,
        "emergencyDescription" TEXT,
        "priority" INTEGER NOT NULL,
        "aiAnalysis" JSONB,
        "aiReason" TEXT,
        "imageUrl" VARCHAR,
        "arrivalTime" VARCHAR NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'pending_approval',
        "assignedDoctor" VARCHAR,
        "createdBy" VARCHAR,
        "approvedBy" VARCHAR,
        "approvedAt" VARCHAR,
        "completedAt" VARCHAR,
        "updatedAt" VARCHAR
      );
    `);
    console.log('✅ Table created successfully!\n');

    // Step 2: Create indexes
    console.log('📇 Step 2: Creating indexes...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_emergency_status" ON "emergency_queue"("status");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_emergency_priority" ON "emergency_queue"("priority");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_emergency_arrival" ON "emergency_queue"("arrivalTime");
    `);
    console.log('✅ Indexes created!\n');

    // Step 3: Clear existing data
    console.log('🗑️  Step 3: Clearing existing queue data...');
    await db.execute(sql`DELETE FROM "emergency_queue";`);
    console.log('✅ Queue cleared!\n');

    // Step 4: Seed dummy data with varied priority
    console.log('🌱 Step 4: Seeding dummy data...\n');
    
    const now = new Date();
    const dummyPatients = [
      {
        patientId: 'critical_patient_001',
        patientName: 'John Anderson',
        age: 65,
        symptoms: JSON.stringify(['chest pain', 'difficulty breathing', 'dizziness', 'severe sweating']),
        emergencyDescription: 'Sudden onset chest pain while resting, radiating to left arm',
        priority: 1,
        aiAnalysis: JSON.stringify({
          reason: 'Acute Coronary Syndrome - immediate intervention required',
          severity_score: 9.8,
          keywords_matched: ['chest pain', 'sweating', 'difficulty breathing'],
          analyzed_at: now.toISOString(),
          model: 'gpt-3.5-turbo'
        }),
        aiReason: 'Acute Coronary Syndrome - immediate intervention required',
        arrivalTime: new Date(now.getTime() - 10 * 60000).toISOString(),
        status: 'serving',
        assignedDoctor: 'Dr. Sarah Chen',
        createdBy: 'system@hospital.com',
        approvedBy: 'receptionist@hospital.com',
        approvedAt: new Date(now.getTime() - 9 * 60000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        patientId: 'serious_patient_001',
        patientName: 'Maria Rodriguez',
        age: 42,
        symptoms: JSON.stringify(['severe fever', 'cough', 'difficulty breathing', 'chest pain']),
        emergencyDescription: 'High fever (39.5°C) with severe cough and chest pain for 3 days',
        priority: 2,
        aiAnalysis: JSON.stringify({
          reason: 'Pneumonia with complications - urgent treatment needed',
          severity_score: 7.5,
          keywords_matched: ['fever', 'difficulty breathing', 'cough', 'chest pain'],
          analyzed_at: now.toISOString(),
          model: 'gpt-3.5-turbo'
        }),
        aiReason: 'Pneumonia with complications - urgent treatment needed',
        arrivalTime: new Date(now.getTime() - 7 * 60000).toISOString(),
        status: 'waiting',
        assignedDoctor: null,
        createdBy: 'system@hospital.com',
        approvedBy: 'receptionist@hospital.com',
        approvedAt: new Date(now.getTime() - 6 * 60000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        patientId: 'serious_patient_002',
        patientName: 'David Thompson',
        age: 38,
        symptoms: JSON.stringify(['fractured arm', 'moderate bleeding', 'severe swelling', 'severe pain']),
        emergencyDescription: 'Fell from ladder, right arm fractured at elbow, active bleeding',
        priority: 2,
        aiAnalysis: JSON.stringify({
          reason: 'Compound fracture with significant soft tissue damage',
          severity_score: 6.8,
          keywords_matched: ['fractured', 'bleeding', 'swelling', 'pain'],
          analyzed_at: now.toISOString(),
          model: 'gpt-3.5-turbo'
        }),
        aiReason: 'Compound fracture with significant soft tissue damage',
        arrivalTime: new Date(now.getTime() - 5 * 60000).toISOString(),
        status: 'waiting',
        assignedDoctor: null,
        createdBy: 'system@hospital.com',
        approvedBy: 'receptionist@hospital.com',
        approvedAt: new Date(now.getTime() - 4 * 60000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        patientId: 'normal_patient_001',
        patientName: 'Emily Watson',
        age: 28,
        symptoms: JSON.stringify(['moderate headache', 'dizziness', 'nausea']),
        emergencyDescription: 'Persistent headache for 3 hours with mild dizziness',
        priority: 3,
        aiAnalysis: JSON.stringify({
          reason: 'Possible migraine or tension headache - standard queue placement',
          severity_score: 4.2,
          keywords_matched: ['headache', 'dizziness', 'nausea'],
          analyzed_at: now.toISOString(),
          model: 'gpt-3.5-turbo'
        }),
        aiReason: 'Possible migraine or tension headache - standard queue placement',
        arrivalTime: new Date(now.getTime() - 2 * 60000).toISOString(),
        status: 'waiting',
        assignedDoctor: null,
        createdBy: 'system@hospital.com',
        approvedBy: 'receptionist@hospital.com',
        approvedAt: new Date(now.getTime() - 1 * 60000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        patientId: 'normal_patient_002',
        patientName: 'Christopher Lee',
        age: 35,
        symptoms: JSON.stringify(['minor cut', 'slight bleeding']),
        emergencyDescription: 'Cut on finger while cooking, minimal bleeding',
        priority: 3,
        aiAnalysis: JSON.stringify({
          reason: 'Minor laceration - routine dressing and sutures',
          severity_score: 2.1,
          keywords_matched: ['cut', 'bleeding'],
          analyzed_at: now.toISOString(),
          model: 'gpt-3.5-turbo'
        }),
        aiReason: 'Minor laceration - routine dressing and sutures',
        arrivalTime: new Date(now.getTime() - 1 * 60000).toISOString(),
        status: 'waiting',
        assignedDoctor: null,
        createdBy: 'system@hospital.com',
        approvedBy: 'receptionist@hospital.com',
        approvedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    // Insert each patient one by one
    for (const patient of dummyPatients) {
      await db.execute(sql`
        INSERT INTO "emergency_queue" (
          "patientId", "patientName", "age", "symptoms", "emergencyDescription",
          "priority", "aiAnalysis", "aiReason", "arrivalTime", "status",
          "assignedDoctor", "createdBy", "approvedBy", "approvedAt", "updatedAt"
        ) VALUES (
          ${patient.patientId}, ${patient.patientName}, ${patient.age}, 
          ${patient.symptoms}, ${patient.emergencyDescription},
          ${patient.priority}, ${patient.aiAnalysis}, ${patient.aiReason}, 
          ${patient.arrivalTime}, ${patient.status},
          ${patient.assignedDoctor}, ${patient.createdBy}, ${patient.approvedBy}, 
          ${patient.approvedAt}, ${patient.updatedAt}
        )
      `);
      console.log(`  ✅ ${patient.patientName} (Priority ${patient.priority}) - ${patient.status}`);
    }

    console.log('\n📊 Database Statistics:');
    console.log('  🔴 Critical (P1): 1 serving');
    console.log('  🟠 Serious (P2): 2 waiting');
    console.log('  🟢 Normal (P3): 2 waiting');
    console.log('  ━━━━━━━━━━━━━━━━━━━━');
    console.log('  📈 Total: 5 patients');

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📌 Queue Order (by priority, then arrival time):');
    console.log('  1️⃣  John Anderson (CRITICAL) - Serving');
    console.log('  2️⃣  Maria Rodriguez (SERIOUS) - Waiting');
    console.log('  3️⃣  David Thompson (SERIOUS) - Waiting');
    console.log('  4️⃣  Emily Watson (NORMAL) - Waiting');
    console.log('  5️⃣  Christopher Lee (NORMAL) - Waiting');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
