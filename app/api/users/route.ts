import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();

        if (!user?.primaryEmailAddress?.emailAddress) {
            // Fallback for development/testing when Clerk auth is not configured
            const fallbackEmail = 'demo@example.com';
            const users = await db.select().from(usersTable)
                .where(eq(usersTable.email, fallbackEmail));
            
            if (users?.length === 0) {
                const result = await db.insert(usersTable).values({
                    name: 'Demo User',
                    email: fallbackEmail,
                    credits: 10
                }).returning();
                return NextResponse.json(result[0]);
            }
            return NextResponse.json(users[0]);
        }

        const userEmail = user.primaryEmailAddress.emailAddress;
        const users = await db.select().from(usersTable)
            .where(eq(usersTable.email, userEmail));
    
        if (users?.length === 0) {
            const result = await db.insert(usersTable).values({
                name: user?.fullName || 'User',
                email: userEmail,
                credits: 10
            }).returning();
            return NextResponse.json(result[0]);
        }
        return NextResponse.json(users[0]);
    } catch (e) {
        console.error('Error in POST /api/users:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to create or fetch user', details: errorMessage },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();

        if (!user?.primaryEmailAddress?.emailAddress) {
            return NextResponse.json(
                { error: 'User email not found' },
                { status: 401 }
            );
        }

        const userEmail = user.primaryEmailAddress.emailAddress;
        const users = await db.select().from(usersTable)
            .where(eq(usersTable.email, userEmail));
    
        if (users?.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(users[0]);
    } catch (e) {
        console.error('Error in GET /api/users:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch user', details: errorMessage },
            { status: 500 }
        );
    }
}