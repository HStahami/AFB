import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Trash2, Calendar, Download, Copy, Check, X, ArrowRight } from 'lucide-react';
import { notesApi } from '../../api';
import { Link } from 'react-router-dom';

export function StudentNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    void fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await notesApi.getAll();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title || 'Class Notes');
    setEditContent(note.content || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedNote) return;
    setIsSaving(true);
    try {
      const updated = await notesApi.update(selectedNote.id || selectedNote._id, {
        title: editTitle.trim() || 'Class Notes',
        content: editContent
      });
      setSelectedNote(updated);
      await fetchNotes();
    } catch {
      alert('Failed to update note.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete note "${title || 'this note'}"?`)) return;
    try {
      await notesApi.delete(id);
      if (selectedNote && (selectedNote.id === id || selectedNote._id === id)) {
        setSelectedNote(null);
      }
      await fetchNotes();
    } catch {
      alert('Failed to delete note.');
    }
  };

  const handleCopy = (note) => {
    void navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopiedId(note.id || note._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (note) => {
    const element = document.createElement('a');
    const file = new Blob([`${note.title}\n\n${note.content}\n\n---\nAlarabia Fi Buyutikum Archive`], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${(note.title || 'Class_Note').replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredNotes = notes.filter(n => {
    const q = searchTerm.toLowerCase();
    return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#072224',
          borderLeft: '4px solid var(--color-primary)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.8rem', background: 'rgba(0, 168, 150, 0.15)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              ACADEMIC REVISION
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', color: '#fff', margin: 0, fontWeight: 700 }}>
            My Class Notes & Vocabulary Archive
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Permanent repository of your live lecture notes, Arabic grammar rules, and exam revisions.
          </p>
        </div>

        <Link
          to="/student/classroom"
          className="btn-primary"
          style={{
            padding: '10px 20px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          Join Live Classroom <ArrowRight size={16} />
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search through saved lecture notes, grammar terms..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              backgroundColor: '#072224',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          Loading your saved notes...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: '#072224',
            borderRadius: '12px',
            color: '#94a3b8'
          }}
        >
          <BookOpen size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem auto', opacity: 0.8 }} />
          <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>No notes found</h3>
          <p style={{ margin: 0, maxWidth: '420px', marginInline: 'auto', fontSize: '0.9rem' }}>
            {searchTerm ? 'No notes match your search term.' : 'You have not saved any notes yet. Join your live classroom and type notes in the Smart Notebook to auto-save them here.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filteredNotes.map(n => {
            const dateStr = n.updated_at ? new Date(n.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            return (
              <div
                key={n.id || n._id}
                className="glass-panel"
                style={{
                  padding: '1.4rem',
                  backgroundColor: '#072224',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'border-color 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {dateStr}
                    </span>
                    {n.slot_name && (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        {n.slot_name}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenNote(n)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                      width: '100%',
                      fontFamily: 'inherit'
                    }}
                  >
                    <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                      {n.title || 'Class Notes'}
                    </h3>
                  </button>
                  <p
                    style={{
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      lineHeight: '1.5',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {n.content || 'Empty note...'}
                  </p>
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '0.75rem'
                  }}
                >
                  <button
                    onClick={() => handleOpenNote(n)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      padding: 0
                    }}
                  >
                    Read & Edit ➔
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleCopy(n)}
                      title="Copy"
                      className="glass-panel"
                      style={{ padding: '5px 8px', border: '1px solid rgba(255,255,255,0.08)', color: copiedId === (n.id || n._id) ? '#10b981' : '#cbd5e1' }}
                    >
                      {copiedId === (n.id || n._id) ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <button
                      onClick={() => handleDownload(n)}
                      title="Export Text"
                      className="glass-panel"
                      style={{ padding: '5px 8px', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(n.id || n._id, n.title)}
                      title="Delete Note"
                      className="glass-panel"
                      style={{ padding: '5px 8px', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note View / Edit Modal */}
      {selectedNote && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close note modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setSelectedNote(null)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') setSelectedNote(null); }}
        >
          <div
            role="presentation"
            style={{
              backgroundColor: '#072224',
              border: '1px solid rgba(0, 168, 150, 0.3)',
              borderRadius: '14px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: '#092528',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1, marginRight: '1rem' }}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    width: '100%',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Last updated: {new Date(selectedNote.updated_at || Date.now()).toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => setSelectedNote(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={16}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '0.95rem',
                  lineHeight: '1.65',
                  padding: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: "'Segoe UI', Arial, sans-serif"
                }}
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: '#092528',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                onClick={() => handleDownload({ title: editTitle, content: editContent })}
                className="glass-panel"
                style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> Download (.txt)
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="glass-panel"
                  style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#94a3b8', border: 'none' }}
                >
                  Close
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
