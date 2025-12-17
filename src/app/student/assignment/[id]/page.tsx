'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button, Input, ErrorModal } from '@/components/ui';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { api } from '@/services/api';
import type { AssignmentWithQuestions, GradingResult } from '@/types';

export default function TakeAssignment({ params }: { params: { id: string } }) {
  const [assignment, setAssignment] = useState<AssignmentWithQuestions | null>(null);
  const [studentName, setStudentName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<Record<string, GradingResult>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

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

  const handleSubmit = async (imageBase64: string) => {
    if (!studentName || !studentName.trim()) {
      setErrorModal({ show: true, message: 'Please enter your name first' });
      return;
    }
    
    if (!assignment || !assignment.questions) return;
    
    const question = assignment.questions[currentQuestionIndex];
    setSubmitting(true);

    try {
      const result = await api.submitGrade(question.id, studentName, imageBase64);
      setResults(prev => ({ ...prev, [question.id]: result }));
    } catch (err) {
      setErrorModal({ show: true, message: 'Failed to submit: ' + (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (assignment && assignment.questions && currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (loading) return <div className="container">Loading assignment...</div>;
  if (error) return <div className="container error-text">{error}</div>;
  if (!assignment || !assignment.questions || assignment.questions.length === 0) {
    return <div className="container">Assignment not found or has no questions.</div>;
  }

  const currentQuestion = assignment.questions[currentQuestionIndex];
  const currentResult = results[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === assignment.questions.length - 1;
  const allQuestionsAnswered = assignment.questions.every(q => results[q.id]);

  return (
    <div className="container">
      <div className="nav">
        <a href="/">← Back to Dashboard</a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="title">{assignment.title}</h1>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          Question {currentQuestionIndex + 1} of {assignment.questions.length}
        </div>
      </div>

      {!hasStarted && (
        <Card style={{ marginBottom: '2rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginTop: 0 }}>Start Session</h3>
          <p>Please enter your name to start the assignment.</p>
          <Input 
            label="Student Name" 
            value={studentName} 
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="e.g. Alice Smith"
          />
          <Button 
            onClick={() => {
              if (!studentName.trim()) {
                setErrorModal({ show: true, message: 'Please enter your name first' });
                return;
              }
              setHasStarted(true);
            }}
            disabled={!studentName.trim()}
          >
            Start Assignment
          </Button>
        </Card>
      )}

      {hasStarted && (
        <>
          <Card style={{ 
            backgroundColor: '#eff6ff', 
            border: '1px solid #3b82f6',
            marginBottom: '1rem',
            padding: '0.75rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
              <span style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                <strong>Note:</strong> AI Coaching is disabled for this assignment. You will receive your grade only after submitting your work.
              </span>
            </div>
          </Card>

          <Card>
            <h2 style={{ marginTop: 0 }}>Problem:</h2>
            <p style={{ fontSize: '1.25rem' }}>{currentQuestion.problem_text}</p>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              <h3>Your Solution</h3>
              {currentResult ? (
                <Card style={{ textAlign: 'center', padding: '3rem' }}>
                  <h3>✅ Answer Submitted</h3>
                  <p>You can verify your score and feedback on the right.</p>
                </Card>
              ) : (
                <DrawingCanvas onSave={handleSubmit} isLoading={submitting} />
              )}
            </div>

            <div>
              <h3>AI Feedback</h3>
              {currentResult ? (
                <Card style={{ 
                  border: `2px solid ${currentResult.score >= 80 ? 'var(--success)' : 'orange'}`,
                  backgroundColor: '#f0fdf4' 
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: currentResult.score >= 80 ? 'var(--success)' : 'orange' }}>
                      {currentResult.score}
                    </div>
                    <div>Points</div>
                  </div>
                  <hr style={{ border: '0', borderTop: '1px solid #cbd5e1', margin: '1rem 0' }} />
                  <p style={{ whiteSpace: 'pre-wrap' }}>{currentResult.feedback}</p>
                </Card>
              ) : (
                <Card style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '3rem' }}>
                  Submit your work to see instant feedback.
                </Card>
              )}
            </div>
          </div>

          {isLastQuestion && currentResult ? (
            <Card style={{ 
              marginTop: '2rem', 
              backgroundColor: '#f0fdf4',
              border: '2px solid var(--success)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <h2 style={{ marginTop: 0, color: 'var(--success)' }}>🎉 Assignment Complete!</h2>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                You have completed all {assignment.questions.length} question{assignment.questions.length !== 1 ? 's' : ''}. 
                Great work!
              </p>
              <Button 
                onClick={() => {
                  window.location.href = '/';
                }}
                style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}
              >
                Finish & Return to Dashboard
              </Button>
            </Card>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <Button 
                variant="secondary" 
                onClick={prevQuestion} 
                disabled={currentQuestionIndex === 0}
              >
                ← Previous Question
              </Button>
              
              <Button 
                variant="secondary"
                onClick={nextQuestion} 
                disabled={isLastQuestion}
              >
                Next Question →
              </Button>
            </div>
          )}
        </>
      )}

      <ErrorModal
        show={errorModal.show}
        message={errorModal.message}
        onClose={() => setErrorModal({ show: false, message: '' })}
      />
    </div>
  );
}

