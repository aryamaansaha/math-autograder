'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, ErrorModal } from '@/components/ui';
import { api } from '@/services/api';

export default function CreateAssignment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{ problem_text: '', rubric: '' }]);
  const [generatingRubric, setGeneratingRubric] = useState<number | null>(null);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const addQuestion = () => {
    setQuestions([...questions, { problem_text: '', rubric: '' }]);
  };

  const updateQuestion = (index: number, field: 'problem_text' | 'rubric', value: string) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const generateRubric = async (index: number) => {
    const problemText = questions[index].problem_text;
    if (!problemText.trim()) {
      setErrorModal({ show: true, message: 'Please enter a problem text first' });
      return;
    }

    setGeneratingRubric(index);
    try {
      const { rubric } = await api.generateRubric(problemText);
      updateQuestion(index, 'rubric', rubric);
    } catch (error) {
      setErrorModal({ show: true, message: 'Failed to generate rubric: ' + (error as Error).message });
    } finally {
      setGeneratingRubric(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createAssignment(title, questions);
      router.push('/'); // Go back to dashboard
      router.refresh();
    } catch (error) {
      setErrorModal({ show: true, message: 'Failed to create assignment: ' + (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="nav">
        <a href="/">← Back to Dashboard</a>
      </div>
      
      <h1 className="title">Create New Assignment</h1>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <Input 
            label="Assignment Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Quadratic Equations Week 1"
          />
        </Card>

        {questions.map((q, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Question {i + 1}</h3>
              {questions.length > 1 && (
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => removeQuestion(i)}
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                >
                  Remove
                </Button>
              )}
            </div>

            <Input 
              label="Problem Text (What the student sees)" 
              value={q.problem_text}
              onChange={(e) => updateQuestion(i, 'problem_text', e.target.value)}
              required
              placeholder="e.g. Solve for x: x^2 + 5x + 6 = 0"
            />
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="label">Grading Rubric (Hidden from student)</label>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => generateRubric(i)}
                  disabled={generatingRubric !== null || !q.problem_text.trim()}
                  style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                >
                  {generatingRubric === i ? '✨ Generating...' : '✨ Generate Rubric'}
                </Button>
              </div>
              <textarea
                className="input"
                value={q.rubric}
                onChange={(e) => updateQuestion(i, 'rubric', e.target.value)}
                required
                placeholder="e.g. 20 points for factoring correctly, 40 points for each correct root..."
                rows={6}
                style={{ 
                  resize: 'vertical', 
                  minHeight: '100px',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
              />
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Tip: Click "Generate Rubric" to have AI create a rubric, then edit as needed.
              </div>
            </div>
          </Card>
        ))}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button type="button" variant="secondary" onClick={addQuestion}>
            + Add Another Question
          </Button>
          <Button type="submit" isLoading={loading}>
            Create Assignment
          </Button>
        </div>
      </form>

      <ErrorModal
        show={errorModal.show}
        message={errorModal.message}
        onClose={() => setErrorModal({ show: false, message: '' })}
      />
    </div>
  );
}
