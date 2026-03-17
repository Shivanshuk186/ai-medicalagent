import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getFullQueue } from '@/lib/queueManager';

export async function GET() {
  try {
    // Get queue with only waiting and serving (approved) patients
    const queue = await getFullQueue(['waiting', 'serving']);
    
    return NextResponse.json({ 
      success: true, 
      queue,
      count: queue.length,
      waiting: queue.filter(q => q.status === 'waiting').length,
      serving: queue.filter(q => q.status === 'serving').length,
    });
  } catch (error) {
    console.error('Error fetching emergency queue:', error);
    return NextResponse.json({ error: 'Failed to fetch emergency queue' }, { status: 500 });
  }
}
