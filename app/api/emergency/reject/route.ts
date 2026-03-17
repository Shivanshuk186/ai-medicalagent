import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

const ADMIN_EMAIL = 'shivanshuk186@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.primaryEmailAddress.emailAddress !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Receptionist access required' }, { status: 403 });
    }

    const body = await req.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 });
    }

    // TODO: Delete from pending_cases table when implemented
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: 'Case rejected',
    });
  } catch (error) {
    console.error('Error rejecting case:', error);
    return NextResponse.json({ error: 'Failed to reject case' }, { status: 500 });
  }
}
