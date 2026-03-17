import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getNextPatient } from '@/lib/queueManager';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nextPatient = await getNextPatient();
    return NextResponse.json({ success: true, nextPatient });
  } catch (error) {
    console.error('Error fetching next emergency patient:', error);
    return NextResponse.json({ error: 'Failed to fetch next patient' }, { status: 500 });
  }
}
