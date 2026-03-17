import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { serveNextPatient } from '@/lib/queueManager';
import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';
import { eq, asc } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const nextPatient = await serveNextPatient(body.assignedDoctor || user.primaryEmailAddress.emailAddress);

    if (!nextPatient) {
      return NextResponse.json({
        success: true,
        message: 'No more patients in queue',
        nextPatient: null,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Now serving next patient',
      nextPatient,
    });
  } catch (error) {
    console.error('Error serving next emergency patient:', error);
    return NextResponse.json({ error: 'Failed to serve next patient' }, { status: 500 });
  }
}

// Also support GET to fetch next patient without marking as serving
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nextPatient = await db
      .select()
      .from(EmergencyQueueTable)
      .where(eq(EmergencyQueueTable.status, 'waiting'))
      .orderBy(asc(EmergencyQueueTable.priority), asc(EmergencyQueueTable.arrivalTime))
      .limit(1);

    return NextResponse.json({
      success: true,
      nextPatient: nextPatient[0] || null,
    });
  } catch (error) {
    console.error('Error fetching next patient:', error);
    return NextResponse.json({ error: 'Failed to fetch next patient' }, { status: 500 });
  }
}
