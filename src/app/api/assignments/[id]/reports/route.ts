import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { StudentReport, StudentBreakdown } from '@/types';

// Disable caching for this route - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assignments/[id]/reports
 * Get the teacher's gradebook report for an assignment
 * Aggregates all submissions by student
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: assignmentId } = await params;

    // Validate UUID format (basic check)
    if (!assignmentId || assignmentId.length < 32) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // First, verify the assignment exists and get its questions
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, title')
      .eq('id', assignmentId)
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

    // Get all questions for this assignment
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, order_index')
      .eq('assignment_id', assignmentId)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Failed to fetch questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    const questionIds = questions?.map((q) => q.id) || [];
    const totalQuestions = questionIds.length;

    if (totalQuestions === 0) {
      return NextResponse.json({
        assignment: {
          id: assignment.id,
          title: assignment.title,
        },
        total_questions: 0,
        students: [],
      });
    }

    // Get all submissions for these questions, ordered by creation date (latest first)
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, question_id, student_name, ai_score, ai_feedback, image_data, created_at')
      .in('question_id', questionIds)
      .order('created_at', { ascending: false });

    if (submissionsError) {
      console.error('Failed to fetch submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Create a map of question_id to order_index for quick lookup
    const questionOrderMap = new Map<string, number>();
    questions?.forEach((q) => {
      questionOrderMap.set(q.id, q.order_index);
    });

    // Track the latest submission per (student_name, question_id) pair
    // Key format: `${student_name}:${question_id}`
    type SubmissionType = { 
      id: string; 
      question_id: string; 
      student_name: string; 
      ai_score: number | null; 
      ai_feedback: string | null;
      image_data: string;
      created_at: string;
    };
    const latestSubmissionMap = new Map<string, SubmissionType>();
    
    // Process submissions to keep only the latest per question per student
    for (const submission of submissions || []) {
      const key = `${submission.student_name}:${submission.question_id}`;
      if (!latestSubmissionMap.has(key)) {
        latestSubmissionMap.set(key, submission);
      }
    }

    // Aggregate submissions by student
    const studentMap = new Map<string, StudentReport>();

    for (const submission of Array.from(latestSubmissionMap.values())) {
      const { student_name, question_id, ai_score, ai_feedback, image_data } = submission;

      if (!studentMap.has(student_name)) {
        studentMap.set(student_name, {
          student_name,
          total_score: 0,
          max_possible_score: totalQuestions * 100,
          questions_answered: 0,
          total_questions: totalQuestions,
          breakdown: [],
        });
      }

      const studentReport = studentMap.get(student_name)!;
      
      // Add to breakdown (only one entry per question per student)
      studentReport.breakdown.push({
        question_id,
        question_order: questionOrderMap.get(question_id) || 0,
        score: ai_score,
        feedback: ai_feedback,
        image_data: image_data,
      });

      // Update totals
      if (ai_score !== null) {
        studentReport.total_score += ai_score;
        studentReport.questions_answered += 1;
      }
    }

    // Convert map to array and ensure each student has entries for ALL questions
    const students: StudentReport[] = Array.from(studentMap.values()).map(
      (student) => {
        // Create a map of question_id -> breakdown entry for quick lookup
        const breakdownMap = new Map<string, StudentBreakdown>();
        student.breakdown.forEach((entry) => {
          breakdownMap.set(entry.question_id, entry);
        });

        // Build complete breakdown with all questions (null score for unanswered)
        const completeBreakdown: StudentBreakdown[] = questions!.map((q) => {
          const existing = breakdownMap.get(q.id);
          return existing || {
            question_id: q.id,
            question_order: q.order_index,
            score: null,
            feedback: null,
            image_data: null,
          };
        });

        return {
          ...student,
          breakdown: completeBreakdown.sort(
            (a, b) => a.question_order - b.question_order
          ),
        };
      }
    );

    // Sort students alphabetically by name
    students.sort((a, b) => a.student_name.localeCompare(b.student_name));

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
      },
      total_questions: totalQuestions,
      students,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/assignments/[id]/reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

