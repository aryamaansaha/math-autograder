import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assignments/[id]
 * Get a single assignment with all its questions (ordered by order_index)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate UUID format (basic check)
    if (!id || id.length < 32) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // Fetch the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, title, created_at')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      if (assignmentError?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        );
      }
      console.error('Failed to fetch assignment:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to fetch assignment' },
        { status: 500 }
      );
    }

    // Fetch all questions for this assignment, ordered by order_index
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, problem_text, rubric, order_index')
      .eq('assignment_id', id)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Failed to fetch questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assignment: {
        ...assignment,
        questions: questions || [],
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/assignments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

