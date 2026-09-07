import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export function StudentReports() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getMyReport();
      setReport(data);
    } catch (err) {
      console.error('Error loading student progress report:', err);
      setError('Failed to compute your academic progress report.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#8892b0' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📈</div>
        <p style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>Computing your dynamic progress report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>
        <p>{error || 'Report data currently unavailable.'}</p>
        <button onClick={loadReport} className="btn-primary" style={{ border: 'none', cursor: 'pointer', marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const tasks = report.tasks || {};
  const attendance = report.attendance || {};
  const assessments = report.assessments || {};
  const overallProgress = report.overall_progress_score || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Print Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            Academic Progress & Evaluation
          </h1>
          <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
            Real-time analytics across coursework completion, session attendance, and assessment grades.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-primary"
          style={{
            padding: '0.6rem 1.4rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          🖨️ Print Academic Report
        </button>
      </div>

      {/* Main Overall Progress Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(7, 34, 36, 0.85) 100%)',
          borderLeft: '4px solid #34d399',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
        }}
      >
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Overall Academic Progress Score
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0 0.75rem 0' }}>
            {overallProgress}%
          </div>

          <div style={{ height: '10px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', overflow: 'hidden', maxWidth: '480px' }}>
            <div
              style={{
                width: `${overallProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8 0%, #34d399 100%)',
              }}
            />
          </div>

          <p style={{ color: '#b0c4c6', fontSize: '0.85rem', marginTop: '0.75rem', marginBottom: 0 }}>
            Calculated dynamically based on 50% task completion, 30% attendance punctuality, and 20% assessment scores.
          </p>
        </div>

        {/* Student Dossier Badge */}
        <div style={{ padding: '1rem 1.5rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Student ID</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {user?.student_code || 'N/A'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#fff', marginTop: '0.2rem' }}>
            {user?.email}
          </div>
        </div>
      </div>

      {/* 3 Analytics Pillar Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* 1. Tasks Completion */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid #fbbf24' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>
              Coursework Completion
            </h3>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
              {tasks.completion_rate || 0}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
              <span>Total Tasks Assigned:</span>
              <strong style={{ color: '#fff' }}>{tasks.total_assigned || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
              <span>Submitted by You:</span>
              <strong style={{ color: '#34d399' }}>{tasks.total_submitted || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
              <span>Pending Tasks:</span>
              <strong style={{ color: '#fbbf24' }}>
                {(tasks.total_assigned || 0) - (tasks.total_submitted || 0)}
              </strong>
            </div>
          </div>
        </div>

        {/* 2. Attendance Standing */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid #34d399' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>
              Attendance Punctuality
            </h3>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
              {attendance.attendance_rate ?? 100}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
              <span>Total Sessions Logged:</span>
              <strong style={{ color: '#fff' }}>{attendance.total_sessions || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
              <span>Present:</span>
              <strong style={{ color: '#34d399' }}>{attendance.present || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
              <span>Late / Excused:</span>
              <strong style={{ color: '#fbbf24' }}>
                {(attendance.late || 0) + (attendance.excused || 0)}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
              <span>Absent:</span>
              <strong style={{ color: '#f87171' }}>{attendance.absent || 0}</strong>
            </div>
          </div>
        </div>

        {/* 3. Academic Assessments */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid #c084fc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>
              Assessment Grades
            </h3>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c084fc' }}>
              {assessments.average_score != null ? `${assessments.average_score}%` : 'N/A'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
              <span>Graded Submissions:</span>
              <strong style={{ color: '#fff' }}>{assessments.total_graded || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
              <span>Average Grade Score:</span>
              <strong style={{ color: '#c084fc' }}>
                {assessments.average_score != null ? `${assessments.average_score}%` : 'No scores yet'}
              </strong>
            </div>
            {assessments.grades_recorded && assessments.grades_recorded.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b0c4c6' }}>
                <span>Grades Earned:</span>
                <span style={{ color: '#fff' }}>
                  {assessments.grades_recorded.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
