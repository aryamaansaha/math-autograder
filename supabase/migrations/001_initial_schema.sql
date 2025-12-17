-- Goblins Auto-Grader: Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: assignments
-- High-level metadata for a homework set
-- ============================================
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: questions
-- Individual problems linked to an assignment
-- ============================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    problem_text TEXT NOT NULL,
    rubric TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries by assignment
CREATE INDEX idx_questions_assignment_id ON questions(assignment_id);

-- Index for ordering questions within an assignment
CREATE INDEX idx_questions_order ON questions(assignment_id, order_index);

-- ============================================
-- Table: submissions
-- Records of student work and AI evaluation
-- ============================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    image_data TEXT NOT NULL,  -- Base64 encoded image
    ai_score INTEGER,          -- 0-100, nullable until graded
    ai_feedback TEXT,          -- nullable until graded
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries by question
CREATE INDEX idx_submissions_question_id ON submissions(question_id);

-- Index for efficient queries by student
CREATE INDEX idx_submissions_student_name ON submissions(student_name);

-- Composite index for gradebook queries (getting all submissions for an assignment by student)
CREATE INDEX idx_submissions_question_student ON submissions(question_id, student_name);

-- ============================================
-- Row Level Security (RLS) - Disabled for MVP
-- In production, enable RLS and add policies
-- ============================================
-- For now, we keep RLS disabled to simplify the MVP
-- ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

