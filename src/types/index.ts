// ============================================
// Database Entity Types
// ============================================

export interface Assignment {
  id: string;
  title: string;
  created_at: string;
}

export interface Question {
  id: string;
  assignment_id: string;
  problem_text: string;
  rubric: string;
  order_index: number;
  created_at: string;
}

export interface Submission {
  id: string;
  question_id: string;
  student_name: string;
  image_data: string;
  ai_score: number | null;
  ai_feedback: string | null;
  created_at: string;
}

// ============================================
// Input Types (for creating records)
// ============================================

export interface CreateAssignmentInput {
  title: string;
  questions: {
    problem_text: string;
    rubric: string;
    order_index?: number;
  }[];
}

export interface CreateSubmissionInput {
  question_id: string;
  student_name: string;
  image_data: string;
}

// ============================================
// API Request Types
// ============================================

export interface GradeRequestBody {
  question_id: string;
  student_name: string;
  image_base64: string;
}

// ============================================
// API Response Types
// ============================================

export interface GradingResult {
  submission_id: string;
  score: number;
  feedback: string;
}

export interface StudentBreakdown {
  question_id: string;
  question_order: number;
  score: number | null;
  feedback: string | null;
  image_data: string | null;
}

export interface StudentReport {
  student_name: string;
  total_score: number;
  max_possible_score: number;
  questions_answered: number;
  total_questions: number;
  breakdown: StudentBreakdown[];
}

export interface ReportResponse {
  assignment: {
    id: string;
    title: string;
  };
  total_questions: number;
  students: StudentReport[];
}

// ============================================
// Extended Types (for API responses with relations)
// ============================================

export interface AssignmentWithQuestions extends Assignment {
  questions: Question[];
}

// ============================================
// AI Grading Types
// ============================================

export interface AIGradingResult {
  score: number;
  feedback: string;
}

