import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { modulesApi, tasksApi, resourcesApi, instructorsApi } from '../../api';

export function StudentCourseDetail() {
  const { id } = useParams();
  const [module, setModule] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseDetails();
  }, [id]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [modulesList, tasksList, resourcesList] = await Promise.all([
        modulesApi.getAll(),
        tasksApi.getAll(id),
        resourcesApi.getAll(id),
      ]);

      const found = (modulesList || []).find((m) => m.id === id);
      setModule(found || (modulesList && modulesList[0]) || null);
      setTasks(tasksList || []);
      setResources(resourcesList || []);
    } catch (err) {
      console.error('Error loading course details:', err);
      setError('Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
        Loading course curriculum...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Back button */}
      <div>
        <Link to="/student/courses" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
          ← Back to All Courses
        </Link>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {module && (
        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem 0' }}>
            {module.title}
          </h1>
          <p style={{ color: '#b0c4c6', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
            {module.description || 'Comprehensive curriculum designed for Arabic language students.'}
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.85rem' }}>
              📝 {tasks.length} Assigned Tasks
            </div>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', fontSize: '0.85rem' }}>
              📁 {resources.length} Learning Resources
            </div>
          </div>
        </div>
      )}

      {/* Two Column: Tasks & Resources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Tasks */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '1rem', fontWeight: 600 }}>
            Module Tasks ({tasks.length})
          </h2>
          {tasks.length === 0 ? (
            <div style={{ color: '#8892b0', fontSize: '0.85rem' }}>No tasks assigned for this module yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{t.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8892b0', marginTop: '0.2rem' }}>
                    {t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString()}` : 'No deadline'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resources */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '1rem', fontWeight: 600 }}>
            Course Materials ({resources.length})
          </h2>
          {resources.length === 0 ? (
            <div style={{ color: '#8892b0', fontSize: '0.85rem' }}>No learning materials uploaded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {resources.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{r.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>{r.type || 'Document'}</div>
                  </div>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Download ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
