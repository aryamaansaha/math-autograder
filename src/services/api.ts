// Import shared types
import type {
  Assignment,
  Question,
  GradingResult,
  ReportResponse,
  AssignmentWithQuestions,
} from '@/types';

// API Service
export const api = {
  // Assignments
  async createAssignment(title: string, questions: { problem_text: string; rubric: string }[]): Promise<{ assignment_id: string }> {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, questions }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAssignments(): Promise<{ assignments: Assignment[] }> {
    const res = await fetch('/api/assignments');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAssignment(id: string): Promise<{ assignment: AssignmentWithQuestions }> {
    const res = await fetch(`/api/assignments/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Grading
  async submitGrade(question_id: string, student_name: string, image_base64: string): Promise<GradingResult> {
    const res = await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id, student_name, image_base64 }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Reports
  async getReport(assignmentId: string): Promise<ReportResponse> {
    const res = await fetch(`/api/assignments/${assignmentId}/reports`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Rubric Generation
  async generateRubric(problem_text: string): Promise<{ rubric: string }> {
    const res = await fetch('/api/generate-rubric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem_text }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

