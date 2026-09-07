import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentsApi, reportsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await studentsApi.getDashboardSummary();
      setData(summary);
    } catch (err) {
      console.error('Error loading student dashboard:', err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#8892b0' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>Loading your learning dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>
        <p>{error}</p>
        <button onClick={loadDashboard} className="btn-primary" style={{ border: 'none', cursor: 'pointer', marginTop: '1rem' }}>
          Try Again
        </button>
      </div>
    );
  }

  const progress = data?.progress || {};
  const course = data?.course;
  const instructor = data?.instructor;
  const slot = data?.slot;
  const upcomingTasks = data?.upcoming_tasks || [];
  const recentSubmissions = data?.recent_submissions || [];
  const attendanceRate = progress?.attendance?.attendance_rate ?? 100;
  const overallProgress = progress?.overall_progress_score ?? 0;
  const avgScore = progress?.assessments?.average_score;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome & Class Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(7, 34, 36, 0.8) 100%)',
          borderLeft: '4px solid var(--color-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              {data?.student?.student_code || 'STUDENT'}
            </span>
            <span style={{ fontSize: '0.8rem', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              Active Enrolled
            </span>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: '0 0 0.4rem 0' }}>
            Ahlan wa Sahlan, {data?.student?.name || user?.username}!
          </h1>

          <p style={{ color: '#b0c4c6', fontSize: '0.95rem', margin: 0, maxWidth: '600px', lineHeight: '1.45' }}>
            Welcome to your AlArabia learning portal. Track assignments, attend live sessions, and view your academic achievements.
          </p>
        </div>

        {/* Course & Slot Summary Badge */}
        {slot && (
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minWidth: '220px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Class Timetable
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '0.25rem' }}>
              {slot.days} {slot.time ? `— ${slot.time}` : ''}
            </div>
            {instructor && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                Ustadh: {instructor.name}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.4rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Overall Progress
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: '0.3rem 0' }}>
            {overallProgress}%
          </div>
          <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${overallProgress}%`, height: '100%', backgroundColor: '#38bdf8' }} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.4rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Attendance Rate
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399', margin: '0.3rem 0' }}>
            {attendanceRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>
            {progress?.attendance?.present || 0} sessions attended
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.4rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tasks Completed
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fbbf24', margin: '0.3rem 0' }}>
            {progress?.tasks?.total_submitted || 0} / {progress?.tasks?.total_assigned || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>
            {progress?.tasks?.completion_rate || 0}% completion
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.4rem', borderLeft: '4px solid #a855f7' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Average Grade
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c084fc', margin: '0.3rem 0' }}>
            {avgScore !== null && avgScore !== undefined ? `${avgScore}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>
            {progress?.assessments?.total_graded || 0} graded tasks
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Quick LMS Actions:</span>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/student/tasks" className="btn-primary" style={{ textDecoration: 'none', padding: '0.55rem 1.2rem', fontSize: '0.85rem' }}>
            📝 View Tasks
          </Link>
          <Link to="/student/courses" className="glass-panel" style={{ textDecoration: 'none', padding: '0.55rem 1.2rem', fontSize: '0.85rem', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
            📚 Course Syllabus
          </Link>
          <Link to="/student/attendance" className="glass-panel" style={{ textDecoration: 'none', padding: '0.55rem 1.2rem', fontSize: '0.85rem', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
            📅 Attendance Sheet
          </Link>
          <Link to="/student/resources" className="glass-panel" style={{ textDecoration: 'none', padding: '0.55rem 1.2rem', fontSize: '0.85rem', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
            📁 Study Materials
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Tasks & Recent Grades */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Upcoming Tasks */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', color: '#fff', margin: 0, fontWeight: 600 }}>
              Coursework & Assignments
            </h2>
            <Link to="/student/tasks" style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
              View All →
            </Link>
          </div>

          {upcomingTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8892b0', fontSize: '0.85rem' }}>
              No tasks currently assigned for your course.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                      {t.title}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>
                      {t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString()}` : 'No deadline'}
                    </div>
                  </div>

                  <div>
                    {t.is_submitted ? (
                      <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontWeight: 600 }}>
                        ✓ Submitted
                      </span>
                    ) : (
                      <Link
                        to="/student/tasks"
                        className="btn-primary"
                        style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Submit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Grades & Feedback */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', color: '#fff', margin: 0, fontWeight: 600 }}>
              Recent Submissions & Feedback
            </h2>
            <Link to="/student/submissions" style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
              View All →
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8892b0', fontSize: '0.85rem' }}>
              You have not submitted any coursework yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                      {sub.task_title}
                    </h4>
                    {sub.grade ? (
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', fontWeight: 700 }}>
                        Grade: {sub.grade} ({sub.score}%)
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontWeight: 600 }}>
                        Pending Review
                      </span>
                    )}
                  </div>

                  {sub.feedback && (
                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#34d399', fontStyle: 'italic', background: 'rgba(16, 185, 129, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                      "{sub.feedback}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Module & Instructor Dossier */}
      {course && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.25rem', fontWeight: 600 }}>
            Active Module & Faculty
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Course Card */}
            <div style={{ padding: '1.25rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>
                Enrolled Course
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>
                {course.title}
              </h3>
              <p style={{ color: '#b0c4c6', fontSize: '0.85rem', lineHeight: '1.45', margin: 0 }}>
                {course.description || 'Comprehensive curriculum designed for mastery in Arabic syntax, morphology, and reading.'}
              </p>
            </div>

            {/* Instructor Card */}
            {instructor && (
              <div style={{ padding: '1.25rem', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '2px solid var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                  }}
                >
                  {instructor.name?.[0] || 'I'}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Assigned Instructor
                  </div>
                  <h4 style={{ margin: '0.1rem 0 0.2rem 0', color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
                    {instructor.name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {instructor.specialization || 'Classical Arabic & Quranic Studies'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
