import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { normalizeSymptoms, classifySeverity } from '@/lib/triage';

interface AnalysisResponse {
  priority: 1 | 2 | 3;
  symptoms: string[];
  reason: string;
  estimatedWaitTime: number;
  severity_score: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symptoms } = body;

    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 });
    }

    const apiKey = process.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    // Very strict prompt that forces accurate triage
    const triagePrompt = `You are an EMERGENCY MEDICAL TRIAGE AI. Your job is to immediately classify patients by severity.

PATIENT SYMPTOMS: ${symptoms}

CRITICAL RULES (Priority 1 - IMMEDIATE LIFE THREAT):
- Any chest pain, difficulty breathing, choking, unconsciousness
- Severe bleeding, trauma, poisoning, overdose
- Rabies, anaphylaxis, stroke, heart attack
- Any condition that could be fatal within minutes/hours

SERIOUS RULES (Priority 2 - URGENT, needs attention soon):
- High fever with severe symptoms, severe pain, fractures, severe headache
- Severe vomiting/diarrhea, inability to function
- Conditions needing treatment within hours
- Significant infections or injuries

NORMAL RULES (Priority 3):
- Mild pain, minor cuts, colds, common complaints
- Can wait hours without danger

Respond with ONLY this JSON (no markdown/explanation):
{"priority":1,"symptoms":["symptom1","symptom2"],"reason":"exact reason","severity_score":9}

MUST assign Priority 1 for: chest pain, breathing issues, rabies, poisoning, unconscious, severe bleeding, seizures, severe allergic, drowning, shock`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',  // Changed from gemini to more stable model
        messages: [
          {
            role: 'user',
            content: triagePrompt,
          },
        ],
        temperature: 0.1, // Very low temp for consistent results
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    let analysisText = data.choices?.[0]?.message?.content || '';
    
    console.log('Raw Gemini response:', analysisText);

    // Clean and parse
    let analysis: AnalysisResponse;
    try {
      const cleaned = analysisText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/markdown/g, '')
        .trim();
      
      const parsed = JSON.parse(cleaned);
      
      // Force to valid priority
      let priority = parsed.priority || 3;
      if (priority < 1 || priority > 3) priority = 3;
      
      analysis = {
        priority: priority as 1 | 2 | 3,
        symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : normalizeSymptoms(symptoms),
        reason: parsed.reason || 'Emergency triage assessment',
        estimatedWaitTime: priority === 1 ? 5 : priority === 2 ? 15 : 30,
        severity_score: parsed.severity_score || (10 - priority * 3),
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response, using fallback:', analysisText);
      
      // AGGRESSIVE FALLBACK - catch rabies and severe symptoms
      const haystack = symptoms.toLowerCase();
      const symptomsList = normalizeSymptoms(symptoms);
      
      let priority = 3;
      let reason = 'Standard medical assessment';
      let severity = 3;
      
      if (haystack.includes('rabies') || haystack.includes('chest pain') || 
          haystack.includes('breathing') || haystack.includes('cant breathe') ||
          haystack.includes('unconscious') || haystack.includes('bleeding') ||
          haystack.includes('choking') || haystack.includes('stroke') ||
          haystack.includes('poisoning') || haystack.includes('overdose')) {
        priority = 1;
        reason = 'CRITICAL: Life-threatening condition detected';
        severity = 9;
      } else if (haystack.includes('severe') || haystack.includes('fever') || 
                 haystack.includes('fracture') || haystack.includes('vomiting') ||
                 haystack.includes('severe pain') || haystack.includes('infection')) {
        priority = 2;
        reason = 'SERIOUS: Requires urgent attention';
        severity = 6;
      }
      
      analysis = {
        priority: priority as 1 | 2 | 3,
        symptoms: symptomsList,
        reason,
        estimatedWaitTime: priority === 1 ? 5 : priority === 2 ? 15 : 30,
        severity_score: severity,
      };
    }

    return NextResponse.json({
      success: true,
      priority: analysis.priority,
      symptoms: analysis.symptoms,
      reason: analysis.reason,
      estimatedWaitTime: analysis.estimatedWaitTime,
      severity_score: analysis.severity_score,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    );
  }
}
