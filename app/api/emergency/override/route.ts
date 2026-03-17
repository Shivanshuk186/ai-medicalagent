import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { overridePriority } from '@/lib/queueManager';
import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = 'shivanshuk186@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const userRow = await db.select().from(usersTable).where(eq(usersTable.email, userEmail)).limit(1);
    const isDbAdmin = Boolean(userRow[0]?.isAdmin);

    if (userEmail !== ADMIN_EMAIL && !isDbAdmin) {
      return NextResponse.json({ error: 'Only admins can override queue priority' }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body.id);
    const priority = Number(body.priority);

    if (!id || ![1, 2, 3].includes(priority)) {
      return NextResponse.json({ error: 'Valid id and priority are required' }, { status: 400 });
    }

    const updated = await overridePriority(id, priority as 1 | 2 | 3, body.assignedDoctor);

    if (!updated) {
      return NextResponse.json({ error: 'Queue item not found or already completed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Error overriding emergency priority:', error);
    return NextResponse.json({ error: 'Failed to override emergency priority' }, { status: 500 });
  }
}
