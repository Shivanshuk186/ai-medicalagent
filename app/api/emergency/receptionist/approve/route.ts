import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

const ADMIN_EMAILS = ['shivanshuk186@gmail.com', 'admin@medicalagent.com'];

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(user.primaryEmailAddress.emailAddress)) {
      return NextResponse.json({ error: 'Receptionist access required' }, { status: 403 });
    }

    const body = await req.json();
    const { caseId, priority } = body;

    if (!caseId || priority === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Move case from pending_approval to waiting with confirmed priority
    const updated = await db
      .update(EmergencyQueueTable)
      .set({
        priority: parseInt(priority),
        status: 'waiting',
        approvedBy: user.primaryEmailAddress.emailAddress,
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(EmergencyQueueTable.id, caseId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Case approved and added to queue',
      queueItem: updated[0],
    });
  } catch (error) {
    console.error('Error approving case:', error);
    return NextResponse.json({ error: 'Failed to approve case' }, { status: 500 });
  }
}
