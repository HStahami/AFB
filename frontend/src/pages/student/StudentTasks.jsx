import React, { useState, useEffect } from 'react';
import { tasksApi, submissionsApi, uploadApi } from '../../api';

export function StudentTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'submitted', 'reviewed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Submission Modal State
  const [activeTask, setActiveTask] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksApi.getAll();
      setTasks(data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const openTaskModal = (task) => {
    setActiveTask(task);
    setSubmissionContent(task.submission_content || '');
    setSelectedFile(null);
    setModalError(null);
  };

  const closeTaskModal = () => {
    setActiveTask(null);
    setSubmissionContent('');
    setSelectedFile(null);
    setModalError(null);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!submissionContent.trim() && !selectedFile) {
      setModalError('Please provide your response text or attach a file.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);

      let attachmentUrls = [];
      if (selectedFile) {
        setUploading(true);
        const uploadRes = await uploadApi.uploadFile(selectedFile);
        if (uploadRes?.url) {
          attachmentUrls.push(uploadRes.url);
        }
        setUploading(false);
      }

      await submissionsApi.submit({
        task_id: activeTask.id,
        content: submissionContent.trim(),
        attachment_urls: attachmentUrls,
      });

      setSuccess(`Assignment "${activeTask.title}" submitted successfully!`);
      closeTaskModal();
      await loadTasks();
    } catch (err) {
      console.error('Error submitting task:', err);
      setModalError(err.message || 'Failed to submit task. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.is_submitted;
    if (filter === 'submitted') return t.is_submitted && t.submission_status === 'submitted';
    if (filter === 'reviewed') return t.is_submitted && t.submission_status === 'reviewed';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            Coursework & Assignments
          </h1>
          <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
            Review tasks assigned by your instructor, submit your homework, and track your grades.
          </p>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            borderLeft: '4px solid #10b981',
            color: '#34d399',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
          }}
        >
          {success}
        </div>
      )}
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

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '0.5rem',
        }}
      >
        {[
          { key: 'all', label: `All Tasks (${tasks.length})` },
          { key: 'pending', label: `Pending (${tasks.filter((t) => !t.is_submitted).length})` },
          { key: 'submitted', label: `Submitted (${tasks.filter((t) => t.is_submitted && t.submission_status === 'submitted').length})` },
          { key: 'reviewed', label: `Reviewed & Graded (${tasks.filter((t) => t.is_submitted && t.submission_status === 'reviewed').length})` },
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

      {/* Tasks Grid */}
      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
          Loading coursework assignments...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Tasks Found</h3>
          <p style={{ color: '#8892b0', margin: 0 }}>
            {filter === 'pending'
              ? 'You have no pending assignments! Great job.'
              : 'There are no coursework assignments matching this category.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: task.is_submitted
                  ? task.submission_status === 'reviewed'
                    ? '4px solid #a855f7'
                    : '4px solid #10b981'
                  : '4px solid #fbbf24',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)',
                      backgroundColor: 'rgba(197, 229, 232, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {task.module_title || 'Arabic Program'}
                  </span>

                  {task.is_submitted ? (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          task.submission_status === 'reviewed'
                            ? 'rgba(168, 85, 247, 0.15)'
                            : 'rgba(52, 211, 153, 0.15)',
                        color:
                          task.submission_status === 'reviewed' ? '#c084fc' : '#34d399',
                      }}
                    >
                      {task.submission_status === 'reviewed'
                        ? `Grade: ${task.grade || ''} (${task.score || 0}%)`
                        : '✓ Submitted'}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(251, 191, 36, 0.15)',
                        color: '#fbbf24',
                      }}
                    >
                      Pending
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                  {task.title}
                </h3>

                <p
                  style={{
                    color: '#b0c4c6',
                    fontSize: '0.85rem',
                    lineHeight: '1.45',
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {task.description || 'No description provided.'}
                </p>

                {task.due_date && (
                  <div style={{ fontSize: '0.75rem', color: '#8892b0', marginBottom: '1rem' }}>
                    ⏰ Due: <strong>{new Date(task.due_date).toLocaleDateString()}</strong>
                  </div>
                )}
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() => openTaskModal(task)}
                  className={task.is_submitted ? 'glass-panel' : 'btn-primary'}
                  style={{
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    border: task.is_submitted ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    fontWeight: 600,
                    color: task.is_submitted ? '#fff' : undefined,
                  }}
                >
                  {task.is_submitted ? 'View Submission & Grade ↗' : 'Open & Submit Task →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail & Submission Modal */}
      {activeTask && (
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
            overflowY: 'auto',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '620px',
              padding: '2.5rem',
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {activeTask.module_title}
                </span>
                <h2 style={{ fontSize: '1.35rem', color: '#fff', margin: '0.2rem 0 0 0', fontWeight: 700 }}>
                  {activeTask.title}
                </h2>
              </div>
              <button
                onClick={closeTaskModal}
                style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {modalError}
              </div>
            )}

            {/* Task Description & Instructions */}
            <div style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Instructions
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                {activeTask.instructions || activeTask.description || 'Follow standard module instructions.'}
              </p>

              {activeTask.attachments && activeTask.attachments.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Teacher Attachments:</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    {activeTask.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}
                      >
                        📄 Attachment {i + 1} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* If Already Submitted: Show Submission & Grade */}
            {activeTask.is_submitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: '8px', backgroundColor: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                      ✓ Your Submission
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>
                      {activeTask.submitted_at ? new Date(activeTask.submitted_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {activeTask.submission_content || 'No text content provided.'}
                  </p>
                </div>

                {/* Grade & Feedback if Reviewed */}
                {activeTask.submission_status === 'reviewed' ? (
                  <div style={{ padding: '1.25rem', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 700 }}>
                        Instructor Assessment
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#c084fc' }}>
                        Grade: {activeTask.grade} ({activeTask.score}%)
                      </span>
                    </div>
                    {activeTask.feedback && (
                      <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                        "{activeTask.feedback}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#fbbf24', textAlign: 'center', padding: '0.75rem', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.1)' }}>
                    ⏳ Your submission is currently waiting for instructor review and grading.
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button onClick={closeTaskModal} className="btn-primary" style={{ padding: '0.6rem 1.4rem', border: 'none', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Submission Form */
              <form onSubmit={handleSubmitTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                    Your Solution / Homework Content *
                  </label>
                  <textarea
                    rows="5"
                    required
                    placeholder="Type your translation, grammatical analysis, or homework notes here..."
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#8892b0', marginBottom: '0.4rem' }}>
                    Attach Homework File (Optional PDF / Image / Document)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#b0c4c6',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={closeTaskModal}
                    className="glass-panel"
                    style={{ padding: '0.65rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#8892b0', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="btn-primary"
                    style={{ padding: '0.65rem 1.5rem', border: 'none', cursor: (submitting || uploading) ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    {uploading ? 'Uploading File...' : submitting ? 'Submitting...' : 'Submit Assignment ✓'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
