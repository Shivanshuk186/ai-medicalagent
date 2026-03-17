import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all cases pending receptionist approval
    const pendingCases = await db
      .select()
      .from(EmergencyQueueTable)
      .where(eq(EmergencyQueueTable.status, 'pending_approval'))
      .orderBy(asc(EmergencyQueueTable.priority), asc(EmergencyQueueTable.arrivalTime));

    return NextResponse.json({
      success: true,
      cases: pendingCases,
      count: pendingCases.length,
    });
  } catch (error) {
    console.error('Error fetching pending cases:', error);
    return NextResponse.json({ error: 'Failed to fetch pending cases' }, { status: 500 });
  }
}
