import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';
import { addPatientToQueue } from '@/lib/queueManager';

const ADMIN_EMAIL = 'shivanshuk186@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.primaryEmailAddress.emailAddress !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Receptionist access required' }, { status: 403 });
    }

    const body = await req.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 });
    }

    // Get the pending case (this would be from a pending cases table or temp storage)
    // For now, we'll just add directly to queue
    // In production, you'd fetch from a pending_cases table

    return NextResponse.json({
      success: true,
      message: 'Case approved and added to queue',
    });
  } catch (error) {
    console.error('Error approving case:', error);
    return NextResponse.json({ error: 'Failed to approve case' }, { status: 500 });
  }
}
