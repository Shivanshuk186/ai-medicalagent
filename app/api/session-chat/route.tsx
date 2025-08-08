import { db } from "@/config/db";
import { SessionChatTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const { notes, selectedDoctor } = await req.json();
  const user = await currentUser();

  try {
    const sessionId = uuidv4();

    const result = await db.insert(SessionChatTable).values({
      sessionId,
      createdBy: user?.primaryEmailAddress?.emailAddress,
      notes,
      selectedDoctor,
      createdOn: new Date().toString()
    }).returning(); 

    console.log("Inserted session:", result); 

    return NextResponse.json(result[0]); 
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMessage });
  }
}

export async function GET(req: NextRequest) {
  const {searchParams} = new URL(req.url);
  const sessionId= searchParams.get('sessionId');
  const user = await currentUser();
  
  if(sessionId=='all'){

      const result = await db.select().from(SessionChatTable)
    //@ts-ignore
    .where(eq(SessionChatTable.createdBy,user?.primaryEmailAddress?.emailAddress))
    .orderBy(desc(SessionChatTable.id));

    return NextResponse.json(result);
  

  }
  else{
    
  const result = await db.select().from(SessionChatTable)
  //@ts-ignore
  .where(eq(SessionChatTable.sessionId,sessionId));

  return NextResponse.json(result[0]);
  }
}