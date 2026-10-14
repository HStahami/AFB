import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorsApi, slotsApi } from '../../api';
import { JitsiClassroom } from '../../components/classroom/JitsiClassroom';
import { SmartNotebook } from '../../components/classroom/SmartNotebook';
import { Video, Calendar, Users, ArrowLeft, Maximize2, Minimize2, Layers, Radio, Square, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function InstructorClassroom() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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
          setIsLive(Boolean(list[0].is_live));
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
  const displayName = `Instructor ${user?.full_name || user?.name || user?.username || ''}`.trim();
  const slotTitle = selectedSlot ? `${selectedSlot.days || 'Class'} ${selectedSlot.time ? `— ${selectedSlot.time}` : ''}` : 'Live Class';

  // Check live status whenever selectedSlot changes
  useEffect(() => {
    let isCancelled = false;
    const fetchLiveStatus = async () => {
      if (!slotKey) return;
      try {
        const res = await slotsApi.getLiveStatus(slotKey);
        if (!isCancelled) {
          setIsLive(Boolean(res?.is_live));
        }
      } catch (err) {
        console.error('Error fetching slot live status:', err);
      }
    };

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 10000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [slotKey]);

  const handleStartClass = async () => {
    try {
      setActionLoading(true);
      const res = await slotsApi.startClass(slotKey);
      setIsLive(true);
      // update classes list item
      setClasses(prev => prev.map(c => c.slot_id === slotKey ? { ...c, is_live: true } : c));
    } catch (err) {
      console.error('Error starting class:', err);
      alert(err.message || 'Could not start live class.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndClass = async () => {
    if (!window.confirm('Are you sure you want to end this live class session for students?')) {
      return;
    }
    try {
      setActionLoading(true);
      await slotsApi.endClass(slotKey);
      setIsLive(false);
      // update classes list item
      setClasses(prev => prev.map(c => c.slot_id === slotKey ? { ...c, is_live: false } : c));
    } catch (err) {
      console.error('Error ending class:', err);
      alert(err.message || 'Could not end live class.');
    } finally {
      setActionLoading(false);
    }
  };

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
                INSTRUCTOR VIRTUAL ROOM
              </span>
              {isLive ? (
                <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  ● YOU ARE LIVE (Students Can Join)
                </span>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  ○ Session Offline (Students Waiting)
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.35rem', color: '#fff', margin: '4px 0 0 0', fontWeight: 700 }}>
              Live Teaching Classroom & Digital Whiteboard
            </h1>
          </div>
        </div>

        {/* Slot Selector & Live Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {classes.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} style={{ color: 'var(--color-primary)' }} />
              <select
                value={selectedSlot?.slot_id || ''}
                onChange={e => {
                  const found = classes.find(c => c.slot_id === e.target.value);
                  if (found) {
                    setSelectedSlot(found);
                    setIsLive(Boolean(found.is_live));
                  }
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
                    {c.days} — {c.time} ({c.students_count || 0} students) {c.is_live ? '• LIVE' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedSlot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1' }}>
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

          {/* Go Live / End Class Button */}
          {isLive ? (
            <button
              onClick={handleEndClass}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              title="End live class session for students"
            >
              {actionLoading ? <Loader2 size={14} className="spin-animation" /> : <Square size={14} />}
              End Class Session
            </button>
          ) : (
            <button
              onClick={handleStartClass}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 15px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#10b981',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)'
              }}
              title="Start live class so students can join"
            >
              {actionLoading ? <Loader2 size={14} className="spin-animation" /> : <Radio size={14} />}
              Start Live Class (Go Live)
            </button>
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
            onReturn={() => window.location.href = '/instructor'}
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

