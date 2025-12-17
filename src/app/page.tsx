'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import type { Assignment } from '@/types';
import { Card, Button } from '@/components/ui';

export default function Dashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const data = await api.getAssignments();
        setAssignments(data.assignments);
      } catch (error) {
        console.error('Failed to fetch assignments', error);
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, []);

  return (
    <div className="container">
      <h1 className="title">Goblins Auto-Grader</h1>
      <p className="subtitle">AI-powered math grading system</p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <Link href="/teacher/create">
          <Button>+ Create Assignment</Button>
        </Link>
      </div>

      <h2 className="subtitle">Assignments</h2>
      
      {loading ? (
        <Card>Loading assignments...</Card>
      ) : assignments.length === 0 ? (
        <Card>No assignments yet. Create one to get started.</Card>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="assignment-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{assignment.title}</h3>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Created: {new Date(assignment.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/teacher/assignment/${assignment.id}`}>
                    <Button variant="secondary">📄 View</Button>
                  </Link>
                  <Link href={`/teacher/gradebook/${assignment.id}`}>
                    <Button variant="secondary">📊 Gradebook</Button>
                  </Link>
                  <Link href={`/student/assignment/${assignment.id}`}>
                    <Button>🎓 Student</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
