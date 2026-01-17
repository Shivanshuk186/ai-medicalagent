import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { PaymentTable } from '@/config/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 400 });
    }

    // Get the latest payment for this user
    const payments = await db
      .select()
      .from(PaymentTable)
      .where(eq(PaymentTable.userEmail, userEmail))
      .orderBy(desc(PaymentTable.id))
      .limit(10);

    if (!payments || payments.length === 0) {
      return NextResponse.json({ payments: [] });
    }

    return NextResponse.json({ 
      payments: payments.map(p => ({
        id: p.id,
        transactionId: p.transactionId,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
        approvedAt: p.approvedAt,
      }))
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}
