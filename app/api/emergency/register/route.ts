import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { classifySeverity, normalizeSymptoms } from '@/lib/triage';
import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      patientName,
      patientId,
      age,
      symptoms,
      emergencyDescription,
      priority,
      aiAnalysis,
    } = body;

    if (!patientName || !patientId) {
      return NextResponse.json({ error: 'Patient name and ID are required' }, { status: 400 });
    }

    const symptomsList = normalizeSymptoms(symptoms ?? []);

    if (symptomsList.length === 0) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 });
    }

    const assignedPriority = [1, 2, 3].includes(priority)
      ? priority
      : classifySeverity(symptomsList);

    const now = new Date().toISOString();

    // Insert into database with pending_approval status
    const queueItem = await db
      .insert(EmergencyQueueTable)
      .values({
        patientId,
        patientName,
        age: age ? parseInt(age) : null,
        symptoms: symptomsList,
        emergencyDescription,
        priority: assignedPriority,
        aiAnalysis: aiAnalysis || null,
        aiReason: aiAnalysis?.reason || null,
        arrivalTime: now,
        status: 'pending_approval',
        createdBy: user.primaryEmailAddress.emailAddress,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({
      success: true,
      queueItem: queueItem[0],
      message: 'Patient registered and pending receptionist approval',
    });
  } catch (error: any) {
    console.error('Error registering emergency patient:', error);
    
    if (error.message?.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'Patient ID already registered. Please use a different name.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to register emergency patient' }, { status: 500 });
  }
}
