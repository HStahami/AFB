import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Save, Check, Clock, Copy, Download, Palette } from 'lucide-react';
import { notesApi } from '../../api';
import { ArabicWhiteboard } from './ArabicWhiteboard';

export function SmartNotebook({ slotId, slotName, initialNoteId = null }) {
  const [activeView, setActiveView] = useState('notes'); // 'notes' | 'whiteboard'
  const [noteId, setNoteId] = useState(initialNoteId);
  const [title, setTitle] = useState(() => {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Class Notes — ${today}`;
  });
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Load existing note if initialNoteId provided, or check if there is an active note today
  useEffect(() => {
    let isMounted = true;
    const fetchExisting = async () => {
      try {
        if (initialNoteId) {
          const note = await notesApi.getById(initialNoteId);
          if (isMounted && note) {
            setNoteId(note.id || note._id);
            setTitle(note.title || title);
            setContent(note.content || '');
            setSaveStatus('saved');
          }
        } else {
          // Look for recent note for this slot
          const list = await notesApi.getAll(slotId);
          if (isMounted && Array.isArray(list) && list.length > 0) {
            const latest = list[0];
            const updatedDate = new Date(latest.updated_at).toDateString();
            const today = new Date().toDateString();
            // If modified today, resume it
            if (updatedDate === today) {
              setNoteId(latest.id || latest._id);
              setTitle(latest.title || title);
              setContent(latest.content || '');
              setSaveStatus('saved');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching initial note:', err);
      }
    };
    fetchExisting();
    return () => { isMounted = false; };
  }, [slotId, initialNoteId]);

  // Debounced auto-save function
  const saveNote = async (newTitle = title, newContent = content) => {
    if (!newContent.trim() && !newTitle.trim()) return;
    setSaveStatus('saving');
    try {
      if (noteId) {
        await notesApi.update(noteId, {
          title: newTitle.trim(),
          content: newContent,
          slot_id: slotId,
          slot_name: slotName
        });
      } else {
        const created = await notesApi.create({
          title: newTitle.trim() || 'Class Notes',
          content: newContent,
          slot_id: slotId,
          slot_name: slotName
        });
        if (created && (created.id || created._id)) {
          setNoteId(created.id || created._id);
        }
      }
      setSaveStatus('saved');
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to auto-save note:', err);
      setSaveStatus('unsaved');
    }
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(title, val);
    }, 1200);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(val, content);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${title}\n\n${content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([`${title}\n\n${content}\n\n---\nAlarabia Fi Buyutikum - Smart Classroom Notes`], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#072224',
        border: '1px solid rgba(0, 168, 150, 0.25)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
      }}
    >
      {/* Notebook Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#092528',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 168, 150, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}
          >
            {activeView === 'notes' ? <BookOpen size={18} /> : <Palette size={18} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>
              {activeView === 'notes' ? 'Smart Class Notebook' : 'Alarabia Digital Whiteboard'}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {activeView === 'notes' ? 'دفتر الملاحظات (Auto-Saved)' : 'اللوحة الرقمية التفاعلية'}
            </span>
          </div>
        </div>

        {/* Tab Switcher: Notes vs Whiteboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveView('notes')}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: 'none',
              background: activeView === 'notes' ? 'var(--color-primary)' : 'transparent',
              color: activeView === 'notes' ? '#041416' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <BookOpen size={12} /> Notes
          </button>
          <button
            onClick={() => setActiveView('whiteboard')}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: 'none',
              background: activeView === 'whiteboard' ? 'var(--color-primary)' : 'transparent',
              color: activeView === 'whiteboard' ? '#041416' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Palette size={12} /> Whiteboard
          </button>
        </div>

        {/* Status Badge & Action Buttons (Only in notes view) */}
        {activeView === 'notes' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: saveStatus === 'saved' ? '#10b981' : saveStatus === 'saving' ? '#38bdf8' : '#f59e0b',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              {saveStatus === 'saved' && <Check size={13} />}
              {saveStatus === 'saving' && <Clock size={13} className="spin-animation" />}
              {saveStatus === 'saved' ? (lastSavedAt ? `Saved ${lastSavedAt}` : 'Saved') : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
            </div>

            <button
              onClick={handleCopy}
              title="Copy Notes"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: copied ? '#10b981' : '#cbd5e1',
                padding: '5px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
            >
              <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={handleDownload}
              title="Download Notes as Text File"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#cbd5e1',
                padding: '5px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
            >
              <Download size={13} /> Export
            </button>
          </div>
        )}
      </div>

      {activeView === 'whiteboard' ? (
        <div style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          <ArabicWhiteboard slotName={slotName || 'Classroom'} />
        </div>
      ) : (
        <>
          {/* Note Title Input */}
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Dars Title (e.g. Dars 04 - Nahw Rules)..."
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            outline: 'none',
            padding: '2px 0'
          }}
        />
        {slotName && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '2px' }}>
            Class: {slotName}
          </div>
        )}
      </div>

      {/* Note Content Area */}
      <div style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Type your Arabic class notes, vocabularies, grammar rules and teacher notes here... Everything is auto-saved."
          style={{
            width: '100%',
            height: '100%',
            minHeight: '260px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#e2e8f0',
            fontSize: '0.95rem',
            lineHeight: '1.65',
            resize: 'none',
            outline: 'none',
            fontFamily: "'Segoe UI', Arial, sans-serif"
          }}
        />
      </div>

      {/* Footer Manual Save Bar */}
      <div
        style={{
          padding: '0.6rem 1.25rem',
          backgroundColor: '#092528',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          💡 Notes remain permanently in your student library for revision.
        </span>
        <button
          onClick={() => saveNote(title, content)}
          className="btn-primary"
          style={{
            padding: '6px 14px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <Save size={13} /> Save Now
        </button>
      </div>
    </>
  )}
</div>
  );
}
