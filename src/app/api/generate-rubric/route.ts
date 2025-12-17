import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy-initialized AI client
let _aiClient: OpenAI | null = null;

function getAIClient(): OpenAI {
  if (!_aiClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }
    _aiClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Goblins Auto-Grader',
      },
    });
  }
  return _aiClient;
}

interface GenerateRubricRequest {
  problem_text: string;
}

/**
 * POST /api/generate-rubric
 * Generate a grading rubric for a math problem using AI
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRubricRequest = await request.json();

    if (!body.problem_text || typeof body.problem_text !== 'string') {
      return NextResponse.json(
        { error: 'problem_text is required' },
        { status: 400 }
      );
    }

    const client = getAIClient();
    const response = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are an expert math teacher creating grading rubrics. Given a math problem, create a detailed grading rubric out of 100 points.

Your rubric should:
- Break down the solution into clear steps
- Assign point values to each step that sum to 100
- Include partial credit guidelines
- Be specific about what constitutes correct work
- Consider common mistakes students might make

Respond with ONLY the rubric text, no extra formatting or explanation. Be concise.`,
        },
        {
          role: 'user',
          content: `Create a grading rubric (out of 100 points) for this math problem:\n\n${body.problem_text}`,
        },
      ],
      max_tokens: 1024,
    });

    const rubric = response.choices[0]?.message?.content || '';

    if (!rubric.trim()) {
      return NextResponse.json(
        { error: 'Failed to generate rubric' },
        { status: 502 }
      );
    }

    return NextResponse.json({ rubric: rubric.trim() });
  } catch (error) {
    console.error('Error generating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to generate rubric' },
      { status: 500 }
    );
  }
}

