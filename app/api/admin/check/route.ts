import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

// Hardcoded admin email - this email will be automatically set as admin
const ADMIN_EMAIL = 'shivanshuk186@gmail.com';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // Check if user exists in database
    const dbUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail))
      .limit(1);

    // If user is the hardcoded admin email, make sure they're admin in DB
    if (userEmail === ADMIN_EMAIL) {
      if (dbUser.length === 0 || !dbUser[0].isAdmin) {
        // Update or insert as admin
        await db
          .insert(usersTable)
          .values({
            name: user.fullName || 'Admin',
            email: userEmail,
            credits: 100,
            isAdmin: true,
          })
          .onConflictDoUpdate({
            target: usersTable.email,
            set: { isAdmin: true },
          });
      }
      return NextResponse.json({ isAdmin: true });
    }

    // Check database for admin status
    const isAdmin = dbUser.length > 0 && dbUser[0].isAdmin === true;

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
