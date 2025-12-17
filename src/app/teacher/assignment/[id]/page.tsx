'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { api } from '@/services/api';
import type { AssignmentWithQuestions } from '@/types';

export default function ViewAssignment({ params }: { params: { id: string } }) {
  const [assignment, setAssignment] = useState<AssignmentWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const data = await api.getAssignment(params.id);
        setAssignment(data.assignment);
      } catch (err) {
        setError('Failed to load assignment');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAssignment();
  }, [params.id]);

  if (loading) return <div className="container">Loading assignment...</div>;
  if (error) return <div className="container error-text">{error}</div>;
  if (!assignment) return <div className="container">Assignment not found.</div>;

  return (
    <div className="container">
      <div className="nav">
        <a href="/">← Back to Dashboard</a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="title">{assignment.title}</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button 
            variant="secondary"
            onClick={() => window.location.href = `/teacher/gradebook/${assignment.id}`}
          >
            📊 View Gradebook
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#64748b' }}>
          <div>
            <strong>Questions:</strong> {assignment.questions?.length || 0}
          </div>
          <div>
            <strong>Created:</strong> {new Date(assignment.created_at).toLocaleDateString()}
          </div>
          <div>
            <strong>Assignment ID:</strong> <code style={{ fontSize: '0.8rem' }}>{assignment.id}</code>
          </div>
        </div>
      </Card>

      <h2 style={{ marginBottom: '1rem' }}>Questions & Rubrics</h2>

      {assignment.questions && assignment.questions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {assignment.questions.map((question, index) => (
            <Card key={question.id} style={{ border: '1px solid #e2e8f0' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>
                  Question {index + 1}
                </h3>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#94a3b8',
                  fontFamily: 'monospace'
                }}>
                  ID: {question.id.slice(0, 8)}...
                </span>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#475569'
                }}>
                  Problem Text
                </label>
                <div style={{ 
                  backgroundColor: '#f1f5f9', 
                  padding: '1rem', 
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  lineHeight: 1.6
                }}>
                  {question.problem_text}
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#475569'
                }}>
                  Grading Rubric
                </label>
                <div style={{ 
                  backgroundColor: '#fefce8', 
                  padding: '1rem', 
                  borderRadius: '6px',
                  border: '1px solid #fef08a',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }}>
                  {question.rubric}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>No questions found for this assignment.</Card>
      )}
    </div>
  );
}

