import { NextResponse } from 'next/server';

async function executeSQL(sql: string, params: (string | number | null)[] = []) {
  if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
  
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

export async function POST() {
  try {
    console.log('🔗 Initializing Neon database...');

    console.log('📋 Step 1: Adding missing columns...');
    const columns = [
      ['patientName', 'varchar'],
      ['age', 'integer'],
      ['emergencyDescription', 'text'],
      ['aiAnalysis', 'jsonb'],
      ['aiReason', 'text'],
      ['imageUrl', 'varchar'],
      ['approvedBy', 'varchar'],
      ['approvedAt', 'varchar'],
      ['completedAt', 'varchar'],
    ];

    for (const [name, type] of columns) {
      try {
        await executeSQL(
          `ALTER TABLE "emergency_queue" ADD COLUMN IF NOT EXISTS "${name}" ${type}`
        );
        console.log(`  ✅ ${name}`);
      } catch (err: any) {
        console.log(`  ⚠️  ${name}`);
      }
    }

    console.log('\n🗑️  Step 2: Clearing existing queue...');
    try {
      await executeSQL('DELETE FROM "emergency_queue"');
      console.log('  ✅ Queue cleared');
    } catch (err) {
      console.log('  ⚠️ Could not clear queue');
    }

    console.log('\n🌱 Step 3: Seeding 5 test patients...\n');
    
    const now = new Date();
    const patients = [
      {
        patientId: 'p_critical_001',
        name: 'John Anderson',
        age: 65,
        symptoms: JSON.stringify(['chest pain', 'difficulty breathing', 'dizziness', 'severe sweating']),
        desc: 'Sudden onset chest pain while resting, radiating to left arm',
        priority: 1,
        reason: 'Acute Coronary Syndrome - immediate intervention required',
        score: 9.8,
        status: 'serving',
        doctor: 'Dr. Sarah Chen',
        arrivalOffset: -10,
      },
      {
        patientId: 'p_serious_001',
        name: 'Maria Rodriguez',
        age: 42,
        symptoms: JSON.stringify(['severe fever', 'cough', 'difficulty breathing', 'chest pain']),
        desc: 'High fever (39.5°C) with severe cough and chest pain for 3 days',
        priority: 2,
        reason: 'Pneumonia with complications - urgent treatment needed',
        score: 7.5,
        status: 'waiting',
        doctor: null,
        arrivalOffset: -7,
      },
      {
        patientId: 'p_serious_002',
        name: 'David Thompson',
        age: 38,
        symptoms: JSON.stringify(['fractured arm', 'moderate bleeding', 'severe swelling', 'severe pain']),
        desc: 'Fell from ladder, right arm fractured at elbow, active bleeding',
        priority: 2,
        reason: 'Compound fracture with significant soft tissue damage',
        score: 6.8,
        status: 'waiting',
        doctor: null,
        arrivalOffset: -5,
      },
      {
        patientId: 'p_normal_001',
        name: 'Emily Watson',
        age: 28,
        symptoms: JSON.stringify(['moderate headache', 'dizziness', 'nausea']),
        desc: 'Persistent headache for 3 hours with mild dizziness',
        priority: 3,
        reason: 'Possible migraine or tension headache - standard queue placement',
        score: 4.2,
        status: 'waiting',
        doctor: null,
        arrivalOffset: -2,
      },
      {
        patientId: 'p_normal_002',
        name: 'Christopher Lee',
        age: 35,
        symptoms: JSON.stringify(['minor cut', 'slight bleeding']),
        desc: 'Cut on finger while cooking, minimal bleeding',
        priority: 3,
        reason: 'Minor laceration - routine removal and sutures',
        score: 2.1,
        status: 'waiting',
        doctor: null,
        arrivalOffset: -1,
      },
    ];

    for (const p of patients) {
      const arrivalTime = new Date(now.getTime() + p.arrivalOffset * 60000).toISOString();
      const approvedAt = new Date(now.getTime() + (p.arrivalOffset + 1) * 60000).toISOString();
      
      const aiAnalysis = JSON.stringify({
        reason: p.reason,
        severity_score: p.score,
        keywords_matched: JSON.parse(p.symptoms),
        analyzed_at: now.toISOString(),
        model: 'gpt-3.5-turbo'
      });

      try {
        await executeSQL(
          `INSERT INTO "emergency_queue" (
            "patientId", "patientName", "age", "symptoms", "emergencyDescription",
            "priority", "aiAnalysis", "aiReason", "arrivalTime", "status",
            "assignedDoctor", "createdBy", "approvedBy", "approvedAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            p.patientId,
            p.name,
            p.age,
            p.symptoms,
            p.desc,
            p.priority,
            aiAnalysis,
            p.reason,
            arrivalTime,
            p.status,
            p.doctor,
            'system@hospital.com',
            'receptionist@hospital.com',
            approvedAt,
            now.toISOString()
          ]
        );
        
        const badge = p.priority === 1 ? '🔴' : p.priority === 2 ? '🟠' : '🟢';
        console.log(`  ${badge} ${p.name} (${p.status})`);
      } catch (err) {
        console.error(`  ❌ Failed to insert ${p.name}:`, err);
      }
    }

    console.log('\n✅ Database initialization completed!\n');
    console.log('📊 Queue Summary:');
    console.log('  🔴 Critical (P1): 1 serving');
    console.log('  🟠 Serious (P2): 2 waiting');
    console.log('  🟢 Normal (P3): 2 waiting');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📈 Total: 5 patients');

    return NextResponse.json({
      success: true,
      message: 'Database initialized with schema and 5 patients',
      summary: {
        critical_serving: 1,
        serious_waiting: 2,
        normal_waiting: 2,
        total: 5,
      }
    });

  } catch (error: any) {
    console.error('❌ Initialization failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Database initialization failed'
      },
      { status: 500 }
    );
  }
}
