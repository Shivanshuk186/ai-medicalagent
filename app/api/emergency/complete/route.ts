import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { markCurrentCompleted } from '@/lib/queueManager';

export async function POST() {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const completedPatient = await markCurrentCompleted();
    return NextResponse.json({ success: true, completedPatient });
  } catch (error) {
    console.error('Error completing emergency patient:', error);
    return NextResponse.json({ error: 'Failed to complete current patient' }, { status: 500 });
  }
}
