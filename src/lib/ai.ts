import OpenAI from 'openai';

// Model to use for grading (via OpenRouter)
export const GRADING_MODEL = 'google/gemini-2.5-flash';

// Lazy-initialized AI client for OpenRouter using OpenAI SDK
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

// Import shared types
import type { AIGradingResult } from '@/types';

/**
 * Grade a student's submission using the configured model via OpenRouter
 * OpenRouter normalizes the API across providers (Anthropic, Google, OpenAI, etc.),
 * so the OpenAI SDK works with any model supported by OpenRouter.
 * 
 * @param problemText The problem/question text
 * @param rubric The grading rubric
 * @param imageBase64 The student's work as a base64 image (with or without data URL prefix)
 * @returns The score (0-100) and feedback
 */
export async function gradeSubmission(
  problemText: string,
  rubric: string,
  imageBase64: string
): Promise<AIGradingResult> {
  // the image should have the proper data URL format
  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  const client = getAIClient();
  const response = await client.chat.completions.create({
    model: GRADING_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a math teacher grading student work. Grade the student's handwritten solution based ONLY on the provided rubric. Be fair but thorough.

IMPORTANT: First, check if the image contains ANY visible student work (handwriting, drawings, calculations, etc.).
- If the image is blank, empty, or contains only a white/empty canvas with no visible work, give a score of 0 and feedback explaining that no work was submitted.
- Only grade actual visible work. Do not hallucinate or imagine work that isn't there.

You MUST respond with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "feedback": "<string explaining the grade. be concise with the feedback>"
}

Do not include any other text, markdown formatting, or code blocks. Just the raw JSON object.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Problem: ${problemText}\n\nRubric: ${rubric}\n\nGrade the student's work shown in the image.`,
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
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || '';
  
  // Parse the JSON response, handling potential markdown code blocks
  const jsonStr = extractJson(content);
  
  try {
    const result = JSON.parse(jsonStr);
    return {
      score: Math.max(0, Math.min(100, Number(result.score) || 0)),
      feedback: String(result.feedback || 'No feedback provided'),
    };
  } catch (error) {
    console.error('Failed to parse grading response:', content);
    throw new Error('Failed to parse AI grading response');
  }
}

/**
 * Extract JSON from a string that might contain markdown code blocks
 */
function extractJson(content: string): string {
  // Try to extract JSON from markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find a JSON object directly
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  // Return the original content if no patterns match
  return content.trim();
}


