import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/config/OpenAiModel";
import { SessionChatTable } from "@/config/schema";
import { db } from "@/config/db";
import { eq } from "drizzle-orm";
import { addPatientToQueue } from "@/lib/queueManager";
import { classifySeverity, normalizeSymptoms } from "@/lib/triage";


const REPORT_GEN_PROMPT=`You are an AI Medical Voice Agent that just finished a voice conversation with a user. Based on doctor AI agent info and Conversation between AI medical agent and user, generate a structured report with the following fields:

1. sessionId: a unique session identifier
2. agent: the medical specialist name (e.g., "General Physician AI")
3. user: name of the patient or "Anonymous" if not provided
4. timestamp: current date and time in ISO format
5. chiefComplaint: one-sentence summary of the main health concern
6. summary: a 2-3 sentence summary of the conversation, symptoms, and recommendations
7. symptoms: list of symptoms mentioned by the user
8. duration: how long the user has experienced the symptoms
9. severity: mild, moderate, or severe
10. riskLevel: overall health risk assessment - "low" (green), "moderate" (yellow), or "high" (red)
11. riskExplanation: doctor-style explanation of the risk level in 2-3 sentences (e.g., "Your symptoms suggest a mild viral infection. While uncomfortable, these typically resolve within 5-7 days with rest. However, if fever exceeds 101°F or symptoms worsen, immediate medical attention is advised.")
12. medicationsMentioned: list of any medicines mentioned
13. recommendations: list of AI suggestions (e.g., rest, see a doctor) with detailed doctor-style explanations
14. doctorExplanation: comprehensive doctor-style explanation of the condition in plain language (3-4 sentences)
15. warningSignsToWatch: list of symptoms that would require immediate medical attention
Return the result in this JSON format:
{
 "sessionId": "string",
 "agent": "string",
 "user": "string",
 "timestamp": "ISO Date string",
 "chiefComplaint": "string",
 "summary": "string",
 "symptoms": ["symptom1", "symptom2"],
 "duration": "string",
 "severity": "string",
 "riskLevel": "low" | "moderate" | "high",
 "riskExplanation": "string",
 "medicationsMentioned": ["med1", "med2"],
 "recommendations": ["rec1", "rec2"],
 "doctorExplanation": "string",
 "warningSignsToWatch": ["sign1", "sign2"]
}

Only include valid fields. Respond with nothing else.`

export async function POST(req: NextRequest) {
    const { sessionId, sessionDetail, messages } = await req.json();

    if (!sessionId || !sessionDetail || !messages) {
        return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
        );
    }

    try {
        const UserInput = "AI Doctor Agent Info:" + JSON.stringify(sessionDetail) + ", Conversation:" + JSON.stringify(messages);
        const completion = await openai.chat.completions.create({
            model: 'google/gemini-2.5-flash-lite',
            messages: [
                { role: 'system', content: REPORT_GEN_PROMPT },
                { role: 'user', content: UserInput },
            ],
        });
     
        const rawResp = completion.choices[0].message;
        const content = rawResp.content;
        
        if (!content) {
            throw new Error('No content in AI response');
        }

        const Resp = content.trim().replace('```json', '').replace('```', '');
        const JSONResp = JSON.parse(Resp);

        // Save consultation report and transcript
        await db.update(SessionChatTable).set({
            report: JSONResp,
            conversation: messages
        }).where(eq(SessionChatTable.sessionId, sessionId));

        const transcriptSymptoms = (Array.isArray(messages) ? messages : [])
            .map((msg: any) => msg?.text || msg?.content || '')
            .filter(Boolean)
            .join(', ');

        const symptoms = normalizeSymptoms(JSONResp?.symptoms?.length ? JSONResp.symptoms : transcriptSymptoms);

        if (symptoms.length > 0) {
            const priority = classifySeverity(symptoms);
            const patientId = sessionDetail?.createdBy || JSONResp?.user || 'Anonymous';
            const patientName = sessionDetail?.patientName || JSONResp?.user || 'Anonymous Patient';

            await addPatientToQueue(patientId, patientName, symptoms, priority, {
                assignedDoctor: sessionDetail?.selectedDoctor?.specialist,
                createdBy: sessionDetail?.createdBy,
            });
        }

        return NextResponse.json(JSONResp);

    } catch (e) {
        console.error('Error generating medical report:', e);
        return NextResponse.json(
            { error: 'Failed to generate medical report' },
            { status: 500 }
        );
    }
}