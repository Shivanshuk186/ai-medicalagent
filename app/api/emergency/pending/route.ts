import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';
import { eq, asc } from 'drizzle-orm';

const ADMIN_EMAILS = ['shivanshuk186@gmail.com', 'admin@medicalagent.com'];

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(user.primaryEmailAddress.emailAddress)) {
      return NextResponse.json({ error: 'Receptionist access required' }, { status: 403 });
    }

    // Fetch all cases with pending_approval status, sorted by arrival time
    const cases = await db
      .select()
      .from(EmergencyQueueTable)
      .where(eq(EmergencyQueueTable.status, 'pending_approval'))
      .orderBy(asc(EmergencyQueueTable.arrivalTime));

    return NextResponse.json({ success: true, cases, count: cases.length });
  } catch (error) {
    console.error('Error fetching pending cases:', error);
    return NextResponse.json({ error: 'Failed to fetch pending cases' }, { status: 500 });
  }
}
