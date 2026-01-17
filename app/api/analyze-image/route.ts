import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/config/OpenAiModel';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, additionalContext } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const systemPrompt = `You are a medical image analysis AI. Analyze the image and provide a brief, easy-to-understand response in simple English.

Format your response EXACTLY like this:

**What I See:**
[Brief description in 1-2 simple sentences]

**Possible Conditions:**
1. [Most likely condition name]
2. [Second possibility]

**Specialist Needed:**
[MUST be one of these EXACT words ONLY: Dermatologist, Cardiologist, Orthopedic, Pediatrician, Gynecologist, Psychologist, Dentist, ENT Specialist, Nutritionist, General Physician]

**Key Signs:**
- [Sign 1]
- [Sign 2]

**How Serious:**
[Mild/Moderate/Severe]

**What To Do:**
1. [Simple action]
2. [When to see doctor]

**Important:** This is just guidance. Always see a real doctor for proper diagnosis.

Keep it simple and brief. Use everyday language, not complex medical terms.`;

    const userPrompt = additionalContext 
      ? `Analyze this medical image. Patient says: ${additionalContext}`
      : 'Analyze this medical image in simple, easy-to-understand English.';

    const response = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const analysis = response.choices[0].message.content;

    // Parse the analysis to extract structured data
    const structuredAnalysis = parseAnalysis(analysis || '');

    return NextResponse.json({
      success: true,
      analysis: analysis,
      structured: structuredAnalysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze image', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function parseAnalysis(text: string) {
  // Extract sections from the analysis
  const sections: any = {
    observation: '',
    conditions: [],
    specialist: '',
    indicators: [],
    severity: 'Unknown',
    recommendations: [],
  };

  try {
    // Extract What I See
    const obsMatch = text.match(/What I See:?\s*([\s\S]*?)(?=\n\n|\*\*Possible|$)/);
    if (obsMatch) sections.observation = obsMatch[1].trim();

    // Extract Possible Conditions
    const condMatch = text.match(/Possible Conditions:?\s*([\s\S]*?)(?=\n\n|\*\*Specialist|$)/);
    if (condMatch) {
      const conditions = condMatch[1].split('\n').filter(line => line.trim().length > 0);
      sections.conditions = conditions.map(c => c.replace(/^[-*•\d.]\s*/, '').trim()).filter(c => c);
    }

    // Extract Specialist Needed
    const specMatch = text.match(/Specialist Needed:?\s*([^\n]+)/);
    if (specMatch) sections.specialist = specMatch[1].trim();

    // Extract Key Signs
    const indMatch = text.match(/Key Signs:?\s*([\s\S]*?)(?=\n\n|\*\*How|$)/);
    if (indMatch) {
      const indicators = indMatch[1].split('\n').filter(line => line.trim().length > 0);
      sections.indicators = indicators.map(i => i.replace(/^[-*•]\s*/, '').trim()).filter(i => i);
    }

    // Extract Severity (How Serious)
    const sevMatch = text.match(/How Serious:?\s*(Mild|Moderate|Severe)/i);
    if (sevMatch) sections.severity = sevMatch[1];

    // Extract What To Do
    const recMatch = text.match(/What To Do:?\s*([\s\S]*?)(?=\n\n|\*\*Important|$)/);
    if (recMatch) {
      const recs = recMatch[1].split('\n').filter(line => line.trim().length > 0);
      sections.recommendations = recs.map(r => r.replace(/^[-*•\d.]\s*/, '').trim()).filter(r => r);
    }
  } catch (e) {
    console.error('Error parsing analysis:', e);
  }

  return sections;
}
