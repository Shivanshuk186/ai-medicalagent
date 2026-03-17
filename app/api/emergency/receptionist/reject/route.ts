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
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
    }

    // Delete the pending case
    const deleted = await db
      .delete(EmergencyQueueTable)
      .where(eq(EmergencyQueueTable.id, caseId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Case rejected and removed from pending',
      deletedCase: deleted[0],
    });
  } catch (error) {
    console.error('Error rejecting case:', error);
    return NextResponse.json({ error: 'Failed to reject case' }, { status: 500 });
  }
}
