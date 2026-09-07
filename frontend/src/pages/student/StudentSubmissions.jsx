import React, { useState, useEffect } from 'react';
import { submissionsApi } from '../../api';

export function StudentSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await submissionsApi.getAll();
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error loading student submissions:', err);
      setError('Failed to load submission history.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter((s) => {
    if (filter === 'reviewed') return s.status === 'reviewed';
    if (filter === 'pending') return s.status === 'submitted';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          My Submissions & Feedback
        </h1>
        <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
          Complete history of your submitted assignments, instructor reviews, and academic grades.
        </p>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
        {[
          { key: 'all', label: `All Submissions (${submissions.length})` },
          { key: 'reviewed', label: `Graded & Reviewed (${submissions.filter((s) => s.status === 'reviewed').length})` },
          { key: 'pending', label: `Pending Review (${submissions.filter((s) => s.status === 'submitted').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 1rem',
              color: filter === tab.key ? 'var(--color-primary)' : '#8892b0',
              fontWeight: filter === tab.key ? 700 : 500,
              fontSize: '0.9rem',
              borderBottom: filter === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Submissions Table / Cards */}
      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
          Loading your submission history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Submissions Found</h3>
          <p style={{ color: '#8892b0', margin: 0 }}>
            {filter === 'reviewed'
              ? 'No reviewed submissions yet. Your instructor will grade your work soon.'
              : 'You have not submitted any coursework assignments yet.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#8892b0', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Task</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date Submitted</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Score & Grade</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '1rem', color: '#fff', fontWeight: 600 }}>
                    {sub.task_title}
                    {sub.module_title && (
                      <div style={{ fontSize: '0.75rem', color: '#8892b0', fontWeight: 400 }}>
                        {sub.module_title}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: '#b0c4c6', fontSize: '0.85rem' }}>
                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Recent'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        backgroundColor:
                          sub.status === 'reviewed'
                            ? 'rgba(52, 211, 153, 0.15)'
                            : 'rgba(251, 191, 36, 0.15)',
                        color: sub.status === 'reviewed' ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {sub.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {sub.grade ? (
                      <span style={{ fontWeight: 700, color: '#c084fc', fontSize: '0.9rem' }}>
                        Grade: {sub.grade} ({sub.score}%)
                      </span>
                    ) : (
                      <span style={{ color: '#8892b0', fontSize: '0.85rem' }}>Awaiting Review</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedSub(sub)}
                      className="glass-panel"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontWeight: 600,
                      }}
                    >
                      View Feedback ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submission & Feedback Modal */}
      {selectedSub && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase' }}>
                  Submission Details
                </span>
                <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: '0.2rem 0 0 0', fontWeight: 700 }}>
                  {selectedSub.task_title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Content Submitted */}
            <div style={{ marginBottom: '1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Your Submitted Text
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 }}>
                {selectedSub.content || 'No text content provided.'}
              </p>

              {selectedSub.attachment_urls && selectedSub.attachment_urls.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Your Attachments:</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    {selectedSub.attachment_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textDecoration: 'none' }}
                      >
                        📎 File {i + 1} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Feedback */}
            {selectedSub.status === 'reviewed' ? (
              <div style={{ padding: '1.25rem', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 700 }}>
                    Instructor Feedback
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c084fc' }}>
                    Grade: {selectedSub.grade} ({selectedSub.score}%)
                  </span>
                </div>
                {selectedSub.feedback ? (
                  <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                    "{selectedSub.feedback}"
                  </p>
                ) : (
                  <p style={{ color: '#8892b0', fontSize: '0.85rem', margin: 0 }}>
                    No written notes provided.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                ⏳ This submission is queued for grading by your instructor.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedSub(null)} className="btn-primary" style={{ padding: '0.6rem 1.4rem', border: 'none', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
