import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
    }

    // Delete the case from queue
    const deleted = await db
      .delete(EmergencyQueueTable)
      .where(eq(EmergencyQueueTable.id, caseId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Case rejected' });
  } catch (error) {
    console.error('Error rejecting case:', error);
    return NextResponse.json({ error: 'Failed to reject case' }, { status: 500 });
  }
}
