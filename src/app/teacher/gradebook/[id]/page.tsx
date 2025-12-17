'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { api } from '@/services/api';
import type { ReportResponse, StudentBreakdown } from '@/types';

interface SubmissionModalProps {
  studentName: string;
  questionNumber: number;
  breakdown: StudentBreakdown;
  onClose: () => void;
}

function SubmissionModal({ studentName, questionNumber, breakdown, onClose }: SubmissionModalProps) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 1,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              {studentName} — Question {questionNumber}
            </h2>
            <div style={{ 
              marginTop: '0.25rem',
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              Score: <span style={{ 
                fontWeight: 'bold',
                color: breakdown.score !== null 
                  ? (breakdown.score >= 80 ? 'green' : breakdown.score >= 50 ? 'orange' : 'red')
                  : '#94a3b8'
              }}>
                {breakdown.score !== null ? `${breakdown.score}/100` : 'Not graded'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Student's Work */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#475569' }}>
              Student&apos;s Work
            </h3>
            {breakdown.image_data ? (
              <div style={{
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#f8fafc',
              }}>
                <img
                  src={`data:image/png;base64,${breakdown.image_data}`}
                  alt="Student submission"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </div>
            ) : (
              <Card style={{ 
                backgroundColor: '#f8fafc', 
                color: '#94a3b8',
                textAlign: 'center',
                padding: '2rem'
              }}>
                No submission image available
              </Card>
            )}
          </div>

          {/* AI Feedback */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#475569' }}>
              AI Feedback
            </h3>
            {breakdown.feedback ? (
              <Card style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}>
                {breakdown.feedback}
              </Card>
            ) : (
              <Card style={{ 
                backgroundColor: '#f8fafc', 
                color: '#94a3b8',
                textAlign: 'center',
                padding: '2rem'
              }}>
                No feedback available
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Gradebook({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<{
    studentName: string;
    questionNumber: number;
    breakdown: StudentBreakdown;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const report = await api.getReport(params.id);
        setData(report);
      } catch (err) {
        setError('Failed to load gradebook');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  if (loading) return <div className="container">Loading gradebook...</div>;
  if (error) return <div className="container error-text">{error}</div>;
  if (!data) return <div className="container">No data found</div>;

  return (
    <div className="container">
      <div className="nav">
        <a href="/">← Back to Dashboard</a>
      </div>

      <h1 className="title">Gradebook: {data.assignment.title}</h1>
      
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Click on any score to view the student&apos;s submission and AI feedback.
      </p>

      {data.students.length === 0 ? (
        <Card>No submissions yet.</Card>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '1rem' }}>Student</th>
                {data.students[0]?.breakdown.map((_, i) => (
                  <th key={i} style={{ padding: '1rem' }}>Q{i + 1}</th>
                ))}
                <th style={{ padding: '1rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((student) => (
                <tr key={student.student_name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{student.student_name}</td>
                  {student.breakdown.map((q, index) => (
                    <td key={q.question_id} style={{ padding: '1rem' }}>
                      {q.score !== null ? (
                        <button
                          onClick={() => setSelectedSubmission({
                            studentName: student.student_name,
                            questionNumber: index + 1,
                            breakdown: q,
                          })}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            color: q.score >= 80 ? 'green' : q.score >= 50 ? 'orange' : 'red',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            transition: 'background-color 0.15s',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="Click to view submission"
                        >
                          {q.score}
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                    {student.total_score} / {student.max_possible_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submission Modal */}
      {selectedSubmission && (
        <SubmissionModal
          studentName={selectedSubmission.studentName}
          questionNumber={selectedSubmission.questionNumber}
          breakdown={selectedSubmission.breakdown}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}
