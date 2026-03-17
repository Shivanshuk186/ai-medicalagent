import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export async function POST() {
  try {
    console.log('🔗 Connecting to Neon database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }

    const client = neon(process.env.DATABASE_URL);
    const db = drizzle(client);

    console.log('📊 Starting database initialization...');

    // Step 1: Create emergency_queue table
    console.log('📋 Creating emergency_queue table...');
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

    // Step 2: Create indexes
    console.log('📇 Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_emergency_status" ON "emergency_queue"("status");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_emergency_priority" ON "emergency_queue"("priority");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_emergency_arrival" ON "emergency_queue"("arrivalTime");`);

    // Step 3: Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.execute(sql`DELETE FROM "emergency_queue";`);

    // Step 4: Seed dummy data
    console.log('🌱 Seeding 5 test patients with varied priority...\n');
    
    const now = new Date();
    const patients = [
      {
        id: 'critical_patient_001',
        name: 'John Anderson',
        age: 65,
        symptoms: ['chest pain', 'difficulty breathing', 'dizziness', 'severe sweating'],
        desc: 'Sudden onset chest pain while resting, radiating to left arm',
        priority: 1,
        reason: 'Acute Coronary Syndrome - immediate intervention required',
        score: 9.8,
        status: 'serving',
        doctor: 'Dr. Sarah Chen',
        offset: -10,
      },
      {
        id: 'serious_patient_001',
        name: 'Maria Rodriguez',
        age: 42,
        symptoms: ['severe fever', 'cough', 'difficulty breathing', 'chest pain'],
        desc: 'High fever (39.5°C) with severe cough and chest pain for 3 days',
        priority: 2,
        reason: 'Pneumonia with complications - urgent treatment needed',
        score: 7.5,
        status: 'waiting',
        doctor: null,
        offset: -7,
      },
      {
        id: 'serious_patient_002',
        name: 'David Thompson',
        age: 38,
        symptoms: ['fractured arm', 'moderate bleeding', 'severe swelling', 'severe pain'],
        desc: 'Fell from ladder, right arm fractured at elbow, active bleeding',
        priority: 2,
        reason: 'Compound fracture with significant soft tissue damage',
        score: 6.8,
        status: 'waiting',
        doctor: null,
        offset: -5,
      },
      {
        id: 'normal_patient_001',
        name: 'Emily Watson',
        age: 28,
        symptoms: ['moderate headache', 'dizziness', 'nausea'],
        desc: 'Persistent headache for 3 hours with mild dizziness',
        priority: 3,
        reason: 'Possible migraine or tension headache - standard queue placement',
        score: 4.2,
        status: 'waiting',
        doctor: null,
        offset: -2,
      },
      {
        id: 'normal_patient_002',
        name: 'Christopher Lee',
        age: 35,
        symptoms: ['minor cut', 'slight bleeding'],
        desc: 'Cut on finger while cooking, minimal bleeding',
        priority: 3,
        reason: 'Minor laceration - routine dressing and sutures',
        score: 2.1,
        status: 'waiting',
        doctor: null,
        offset: -1,
      },
    ];

    for (const p of patients) {
      const arrivalTime = new Date(now.getTime() + p.offset * 60000).toISOString();
      const approvedAt = new Date(now.getTime() + (p.offset + 1) * 60000).toISOString();
      
      await db.execute(sql`
        INSERT INTO "emergency_queue" (
          "patientId", "patientName", "age", "symptoms", "emergencyDescription",
          "priority", "aiAnalysis", "aiReason", "arrivalTime", "status",
          "assignedDoctor", "createdBy", "approvedBy", "approvedAt", "updatedAt"
        ) VALUES (
          ${p.id}, ${p.name}, ${p.age}, 
          ${JSON.stringify(p.symptoms)}, ${p.desc},
          ${p.priority}, 
          ${JSON.stringify({
            reason: p.reason,
            severity_score: p.score,
            keywords_matched: p.symptoms,
            analyzed_at: now.toISOString(),
            model: 'gpt-3.5-turbo'
          })},
          ${p.reason}, 
          ${arrivalTime}, ${p.status},
          ${p.doctor}, 'system@hospital.com', 'receptionist@hospital.com', 
          ${approvedAt}, ${now.toISOString()}
        )
      `);
      
      const badge = p.priority === 1 ? '🔴' : p.priority === 2 ? '🟠' : '🟢';
      console.log(`  ${badge} ${p.name} (P${p.priority}) - ${p.status}`);
    }

    console.log('\n✅ Database initialization completed!\n');
    console.log('📊 Queue Summary:');
    console.log('  🔴 Critical (P1): 1 serving');
    console.log('  🟠 Serious (P2): 2 waiting');
    console.log('  🟢 Normal (P3): 2 waiting');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📈 Total: 5 patients\n');

    console.log('📌 Queue Order (Priority-based):');
    console.log('  1️⃣  John Anderson (CRITICAL) - 🏥 Serving');
    console.log('  2️⃣  Maria Rodriguez (SERIOUS) - ⏳ Waiting');
    console.log('  3️⃣  David Thompson (SERIOUS) - ⏳ Waiting');
    console.log('  4️⃣  Emily Watson (NORMAL) - ⏳ Waiting');
    console.log('  5️⃣  Christopher Lee (NORMAL) - ⏳ Waiting');

    return NextResponse.json({
      success: true,
      message: 'Database initialized with 5 test patients',
      patients: 5,
      summary: {
        critical: 1,
        serious: 2,
        normal: 2,
        total: 5,
      },
      queue_order: [
        '1️⃣ John Anderson (CRITICAL) - Serving',
        '2️⃣ Maria Rodriguez (SERIOUS) - Waiting',
        '3️⃣ David Thompson (SERIOUS) - Waiting', 
        '4️⃣ Emily Watson (NORMAL) - Waiting',
        '5️⃣ Christopher Lee (NORMAL) - Waiting',
      ]
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error.message 
      },
      { status: 500 }
    );
  }
}
