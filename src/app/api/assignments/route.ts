import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CreateAssignmentInput } from '@/types';

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/assignments
 * Create a new assignment with its questions (transactional)
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateAssignmentInput = await request.json();

    // Validate input
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }

    // Validate each question
    for (const q of body.questions) {
      if (!q.problem_text || !q.rubric) {
        return NextResponse.json(
          { error: 'Each question must have problem_text and rubric' },
          { status: 400 }
        );
      }
    }

    // Step 1: Create the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({ title: body.title })
      .select('id')
      .single();

    if (assignmentError || !assignment) {
      console.error('Failed to create assignment:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      );
    }

    // Step 2: Create all questions linked to this assignment
    const questionsToInsert = body.questions.map((q, index) => ({
      assignment_id: assignment.id,
      problem_text: q.problem_text,
      rubric: q.rubric,
      order_index: q.order_index ?? index + 1,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Failed to create questions:', questionsError);
      // Attempt to clean up the orphaned assignment
      await supabase.from('assignments').delete().eq('id', assignment.id);
      return NextResponse.json(
        { error: 'Failed to create questions' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { assignment_id: assignment.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assignments
 * List all assignments (ordered by creation date, newest first)
 */
export async function GET() {
  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch assignments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Unexpected error in GET /api/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

