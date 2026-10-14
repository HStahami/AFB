import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorsApi } from '../../api';
import { JitsiClassroom } from '../../components/classroom/JitsiClassroom';
import { SmartNotebook } from '../../components/classroom/SmartNotebook';
import { Video, Calendar, Users, ArrowLeft, Maximize2, Minimize2, CheckSquare, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export function InstructorClassroom() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullVideoMode, setFullVideoMode] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await instructorsApi.getMyClasses();
        const list = Array.isArray(data) ? data : [];
        setClasses(list);
        if (list.length > 0) {
          setSelectedSlot(list[0]);
        }
      } catch (err) {
        console.error('Error fetching instructor classes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const slotKey = selectedSlot?.slot_id || 'general';
  const roomName = `AFB_Class_${slotKey}`;
  const displayName = `Ustadh ${user?.full_name || user?.name || user?.username || 'Instructor'}`;
  const slotTitle = selectedSlot ? `${selectedSlot.days || 'Class'} ${selectedSlot.time ? `— ${selectedSlot.time}` : ''}` : 'Live Class';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#072224',
          borderLeft: '4px solid var(--color-primary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/instructor"
            className="glass-panel"
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              borderRadius: '8px',
              textDecoration: 'none'
            }}
            title="Return to Instructor Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', background: 'rgba(0, 168, 150, 0.2)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                TEACHER VIRTUAL ROOM
              </span>
              <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                ● Host / Moderator Enabled
              </span>
            </div>
            <h1 style={{ fontSize: '1.35rem', color: '#fff', margin: '4px 0 0 0', fontWeight: 700 }}>
              Live Teaching Classroom & Digital Whiteboard
            </h1>
          </div>
        </div>

        {/* Slot Selector & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {classes.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} style={{ color: 'var(--color-primary)' }} />
              <select
                value={selectedSlot?.slot_id || ''}
                onChange={e => {
                  const found = classes.find(c => c.slot_id === e.target.value);
                  if (found) setSelectedSlot(found);
                }}
                style={{
                  backgroundColor: '#092528',
                  border: '1px solid rgba(0, 168, 150, 0.4)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {classes.map(c => (
                  <option key={c.slot_id} value={c.slot_id}>
                    {c.days} — {c.time} ({c.students_count || 0} students)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedSlot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                {slotTitle}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px' }}>
                <Users size={13} style={{ color: '#38bdf8' }} />
                {selectedSlot.students_count || 0} Enrolled
              </span>
            </div>
          )}

          <button
            onClick={() => setFullVideoMode(!fullVideoMode)}
            className="glass-panel"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {fullVideoMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hide-on-mobile">{fullVideoMode ? "Split View" : "Full Screen"}</span>
          </button>
        </div>
      </div>

      {/* Main Split Section: Classroom + Lesson Notes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: fullVideoMode ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          flex: 1,
          alignItems: 'stretch'
        }}
      >
        {/* Left Side: Jitsi Classroom with Whiteboard */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gridColumn: fullVideoMode ? '1 / -1' : 'span 2',
            minHeight: '520px'
          }}
        >
          <JitsiClassroom
            roomName={roomName}
            displayName={displayName}
            height="100%"
          />
        </div>

        {/* Right Side: Instructor's Lesson & Dars Notes */}
        {!fullVideoMode && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gridColumn: 'span 1',
              minHeight: '520px'
            }}
          >
            <SmartNotebook
              slotId={slotKey}
              slotName={slotTitle}
            />
          </div>
        )}
      </div>
    </div>
  );
}
