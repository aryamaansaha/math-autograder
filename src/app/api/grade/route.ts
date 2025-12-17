import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { gradeSubmission } from '@/lib/ai';
import type { GradeRequestBody } from '@/types';

/**
 * POST /api/grade
 * Submit student work and get AI grading
 * 
 * Flow:
 * 1. Validate input
 * 2. Fetch the question (to get rubric and problem_text)
 * 3. Create a submission record (initially without score/feedback)
 * 4. Call AI to grade the submission
 * 5. Update the submission with the AI result
 * 6. Return the score and feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body: GradeRequestBody = await request.json();

    // Validate input
    if (!body.question_id) {
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      );
    }

    if (!body.student_name || typeof body.student_name !== 'string') {
      return NextResponse.json(
        { error: 'student_name is required' },
        { status: 400 }
      );
    }

    if (!body.image_base64 || typeof body.image_base64 !== 'string') {
      return NextResponse.json(
        { error: 'image_base64 is required' },
        { status: 400 }
      );
    }

    // Step 1: Fetch the question to get the rubric and problem text
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, problem_text, rubric')
      .eq('id', body.question_id)
      .single();

    if (questionError || !question) {
      if (questionError?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
      console.error('Failed to fetch question:', questionError);
      return NextResponse.json(
        { error: 'Failed to fetch question' },
        { status: 500 }
      );
    }

    // Step 2: Create the submission record (without AI results yet)
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        question_id: body.question_id,
        student_name: body.student_name.trim(),
        image_data: body.image_base64,
      })
      .select('id')
      .single();

    if (submissionError || !submission) {
      console.error('Failed to create submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to create submission' },
        { status: 500 }
      );
    }

    // Step 3: Call AI to grade the submission
    let gradingResult;
    try {
      gradingResult = await gradeSubmission(
        question.problem_text,
        question.rubric,
        body.image_base64
      );
    } catch (aiError) {
      console.error('AI grading failed:', aiError);
      // Still return a response, but indicate the grading failed
      return NextResponse.json(
        { 
          error: 'AI grading failed. Please try again.',
          submission_id: submission.id,
        },
        { status: 502 }
      );
    }

    // Step 4: Update the submission with AI results
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        ai_score: gradingResult.score,
        ai_feedback: gradingResult.feedback,
      })
      .eq('id', submission.id);

    if (updateError) {
      console.error('Failed to update submission with AI result:', updateError);
      // The grading succeeded, so we still return the result
      // but log the error for debugging
    }

    // Step 5: Return the result
    return NextResponse.json({
      submission_id: submission.id,
      score: gradingResult.score,
      feedback: gradingResult.feedback,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/grade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

