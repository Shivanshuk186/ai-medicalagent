import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseId, priority } = body;

    if (!caseId || priority === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the case priority in database
    const updated = await db
      .update(EmergencyQueueTable)
      .set({
        priority,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(EmergencyQueueTable.id, caseId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, case: updated[0] });
  } catch (error) {
    console.error('Error approving priority:', error);
    return NextResponse.json({ error: 'Failed to approve priority' }, { status: 500 });
  }
}
