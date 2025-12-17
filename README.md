# Math Auto-Grader

An AI-powered math auto-grading system where students submit handwritten work via a digital canvas and receive instant feedback.

## Overview

Teachers create assignments with math problems and grading rubrics. Students draw their solutions on a whiteboard canvas, and a multimodal AI (via OpenRouter) grades the work in real-time based on the rubric.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                             │
├──────────────────────────┬──────────────────────────────────────┤
│       Frontend           │            Backend (API Routes)      │
│  • Teacher Dashboard     │  • POST /api/assignments             │
│  • Assignment Creator    │  • GET  /api/assignments             │
│  • Student Canvas        │  • GET  /api/assignments/[id]        │
│  • Gradebook View        │  • POST /api/grade                   │
│                          │  • GET  /api/assignments/[id]/reports│
│                          │  • POST /api/generate-rubric         │
└──────────────────────────┴──────────────────────────────────────┘
           │                              │
           │                              │
           ▼                              ▼
    ┌─────────────┐              ┌─────────────────┐
    │  Supabase   │              │   OpenRouter    │
    │  (Postgres) │              │   (AI Gateway)  │
    └─────────────┘              └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| AI | OpenRouter → Gemini 2.5 Flash |
| Styling | Pure CSS |
| Language | TypeScript |

## Database Schema

```sql
assignments (id, title, created_at)
     │
     └──< questions (id, assignment_id, problem_text, rubric, order_index)
              │
              └──< submissions (id, question_id, student_name, image_data, ai_score, ai_feedback)
```

## Key Features

**For Teachers:**
- Create assignments with multiple questions
- AI-assisted rubric generation
- View all questions and rubrics
- Gradebook with per-student breakdown
- View student submissions (whiteboard images) and AI feedback

**For Students:**
- Digital whiteboard with pen/eraser tools
- Fullscreen drawing mode
- Instant AI grading and feedback
- Question navigation

**AI Grading:**
- Multimodal vision analysis of handwritten work
- Rubric-based scoring (0-100)
- Detailed feedback explaining the grade
- Blank canvas detection

## Project Structure

```
src/
├── app/
│   ├── api/                 # Backend API routes
│   ├── teacher/             # Teacher pages (create, gradebook, view)
│   └── student/             # Student assignment page
├── components/
│   ├── DrawingCanvas.tsx    # Whiteboard with tools
│   └── ui.tsx               # Reusable UI components
├── lib/
│   ├── ai.ts                # OpenRouter client & grading logic
│   └── supabase.ts          # Database client
├── services/
│   └── api.ts               # Frontend API client
└── types/
    └── index.ts             # Shared TypeScript types
```

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Add: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENROUTER_API_KEY

# Run migrations in Supabase SQL Editor
# (see supabase/migrations/001_initial_schema.sql)

# Start dev server
npm run dev
```
