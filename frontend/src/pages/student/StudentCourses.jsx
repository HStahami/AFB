import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentsApi } from '../../api';

export function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentsApi.getMyCourses();
      setCourses(data || []);
    } catch (err) {
      console.error('Error loading enrolled courses:', err);
      setError('Failed to load course information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          My Enrolled Courses
        </h1>
        <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
          Modules, academic curriculum, faculty instructor, and live class schedule.
        </p>
      </div>

      {error && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            borderLeft: '4px solid #ef4444',
            color: '#f87171',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
          Loading your active courses...
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Active Enrollments</h3>
          <p style={{ color: '#8892b0', margin: 0 }}>
            You are not currently enrolled in any module. Please contact the administrator.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {courses.map((item) => {
            const mod = item.module || {};
            const inst = item.instructor || {};
            const slot = item.slot || {};

            return (
              <div
                key={item.enrollment_id || item.id || Math.random()}
                className="glass-panel"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  borderLeft: '4px solid var(--color-primary)',
                }}
              >
                {/* Top: Module info & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(52, 211, 153, 0.15)',
                        color: '#34d399',
                        display: 'inline-block',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {item.status || 'Active'}
                    </span>
                    <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                      {mod.title || item.title || item.module_title || 'Arabic Program'}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.8rem', color: '#b0c4c6' }}>
                      📝 {item.tasks_count || 0} Tasks Assigned
                    </div>
                    <div style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.8rem', color: '#b0c4c6' }}>
                      📁 {item.resources_count || 0} Learning Materials
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: '#b0c4c6', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                  {mod.description || 'Comprehensive Arabic program covering foundational grammar, morphology, and reading skills.'}
                </p>

                {/* Details Grid: Instructor & Schedule */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {/* Instructor */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        fontSize: '1.2rem',
                        flexShrink: 0,
                      }}
                    >
                      {inst.name?.[0] || 'I'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase' }}>
                        Course Instructor
                      </div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                        {inst.name || 'Assigned Instructor'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                        {inst.specialization || 'Classical Arabic'}
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase' }}>
                      Class Days & Timetable
                    </div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                      📅 {slot.days || 'Weekly Schedule'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#b0c4c6', marginTop: '0.1rem' }}>
                      ⏰ {slot.time || 'Check schedule calendar'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Link
                    to="/student/tasks"
                    className="btn-primary"
                    style={{ textDecoration: 'none', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    View Module Tasks →
                  </Link>
                  <Link
                    to="/student/resources"
                    className="glass-panel"
                    style={{ textDecoration: 'none', padding: '0.6rem 1.25rem', fontSize: '0.85rem', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  >
                    View Course Resources →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
