import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { PaymentTable, usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

// Hardcoded admin email - only this email can access admin panel
const ADMIN_EMAIL = 'shivanshuk186@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = user.emailAddresses[0]?.emailAddress;

    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user email matches admin email
    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    // Get payment details
    const payment = await db
      .select()
      .from(PaymentTable)
      .where(eq(PaymentTable.id, paymentId))
      .limit(1);

    if (!payment || payment.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'Payment has already been processed' },
        { status: 400 }
      );
    }

    // Update payment status
    await db
      .update(PaymentTable)
      .set({
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: adminEmail,
      })
      .where(eq(PaymentTable.id, paymentId));

    // Update user to premium
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    await db
      .update(usersTable)
      .set({
        isPremium: true,
        premiumExpiresAt: expiresAt.toISOString(),
      })
      .where(eq(usersTable.email, payment[0].userEmail));

    return NextResponse.json({
      success: true,
      message: 'Payment approved and user upgraded to premium',
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { error: 'Failed to approve payment' },
      { status: 500 }
    );
  }
}
