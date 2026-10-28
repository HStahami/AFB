import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorsApi, slotsApi, attendanceApi } from '../../api';
import { JitsiClassroom } from '../../components/classroom/JitsiClassroom';
import { SmartNotebook } from '../../components/classroom/SmartNotebook';
import { Video, Calendar, Users, ArrowLeft, Maximize2, Minimize2, Layers, Radio, Square, Loader2, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export function InstructorClassroom() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedSlotId = searchParams.get('slot_id');
  const autoStartRequested = searchParams.get('auto_start') === 'true';

  const [classes, setClasses] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fullVideoMode, setFullVideoMode] = useState(false);
  const [isPopoutMode, setIsPopoutMode] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await instructorsApi.getMyClasses();
        const list = Array.isArray(data) ? data : [];
        if (isCancelled) return;
        setClasses(list);
        if (list.length > 0) {
          const matched = requestedSlotId ? (list.find(c => c.slot_id === requestedSlotId) || list[0]) : list[0];
          setSelectedSlot(matched);
          const liveStatus = Boolean(matched.is_live);
          setIsLive(liveStatus);

          // If launched with auto_start from dashboard, start immediately on first click
          if (autoStartRequested && !liveStatus) {
            try {
              setActionLoading(true);
              await slotsApi.startClass(matched.slot_id);
              if (!isCancelled) {
                setIsLive(true);
                setClasses(prev => prev.map(c => c.slot_id === matched.slot_id ? { ...c, is_live: true } : c));
              }
            } catch (autoErr) {
              console.error('Auto start error:', autoErr);
            } finally {
              if (!isCancelled) setActionLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching instructor classes:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    void fetchClasses();
    return () => { isCancelled = true; };
  }, [requestedSlotId, autoStartRequested]);

  const slotKey = selectedSlot?.slot_id || 'general';
  const roomName = `AFB_Class_${slotKey}`;
  const displayName = `Instructor ${user?.full_name || user?.name || user?.username || ''}`.trim();
  const slotTitle = selectedSlot ? `${selectedSlot.days || 'Class'} ${selectedSlot.time ? `— ${selectedSlot.time}` : ''}` : 'Live Class';

  // Check live status and live attendance count whenever selectedSlot changes
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

    const fetchAttendees = async () => {
      if (!slotKey) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const records = await attendanceApi.getAll({ date: today, slot_id: slotKey });
        const present = (records || []).filter(r => r.status === 'present').length;
        if (!isCancelled) setAttendeesCount(present);
      } catch {
        // non-blocking
      }
    };

    void fetchLiveStatus();
    void fetchAttendees();
    const interval = setInterval(() => {
      void fetchLiveStatus();
      void fetchAttendees();
    }, 8000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [slotKey]);

  const handleStartClass = async (overrideSlotKey = null) => {
    const targetKey = overrideSlotKey || selectedSlot?.slot_id || slotKey;
    if (!targetKey || targetKey === 'general') {
      alert('Please wait a moment while your assigned class schedule finishes loading.');
      return;
    }
    try {
      setActionLoading(true);
      await slotsApi.startClass(targetKey);
      setIsLive(true);
      setClasses(prev => prev.map(c => c.slot_id === targetKey ? { ...c, is_live: true } : c));
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
      setIsPopoutMode(false);
      setClasses(prev => prev.map(c => c.slot_id === slotKey ? { ...c, is_live: false } : c));
    } catch (err) {
      console.error('Error ending class:', err);
      alert(err.message || 'Could not end live class.');
    } finally {
      setActionLoading(false);
    }
  };

  const openUnlimitedWindow = () => {
    if (!isLive) {
      void handleStartClass();
    }
    setIsPopoutMode(true);
    const url = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.startWithVideoMuted=true&config.prejoinPageEnabled=false`;
    window.open(url, '_blank', 'noopener,noreferrer,width=1280,height=800');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: '#cbd5e1' }}>
        <Loader2 size={36} className="spin-animation" style={{ color: 'var(--color-primary)' }} />
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Connecting to Instructor Classroom...</h3>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>Loading assigned classes and active schedule.</p>
      </div>
    );
  }

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
                  ● YOU ARE LIVE (Students Notified)
                </span>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  ○ Session Offline (Ready to Launch)
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.35rem', color: '#fff', margin: '4px 0 0 0', fontWeight: 700 }}>
              Live Teaching Classroom & Digital Whiteboard
            </h1>
          </div>
        </div>

        {/* Slot Selector & Live Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '3px 8px', borderRadius: '4px' }} title="Automated real-time attendance count for today">
                <CheckCircle2 size={13} />
                {attendeesCount} Present Today
              </span>
            </div>
          )}

          {/* Go Live / End Class Button */}
          {isLive ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={openUnlimitedWindow}
                className="glass-panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '0.82rem',
                  color: '#38bdf8',
                  border: '1px solid #38bdf8',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontWeight: 600
                }}
                title="Open meeting in dedicated full window without any 5-minute timeout"
              >
                <ExternalLink size={14} /> Dedicated HD Window
              </button>

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
            </div>
          ) : (
            <button
              onClick={() => handleStartClass()}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#10b981',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
              }}
              title="Start live class and send in-app notification to all enrolled students"
            >
              {actionLoading ? <Loader2 size={14} className="spin-animation" /> : <Radio size={14} />}
              Start Live Class & Notify Students
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
        {/* Left Side: Jitsi Classroom or Pre-Launch Screen */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gridColumn: fullVideoMode ? '1 / -1' : 'span 2',
            minHeight: '520px'
          }}
        >
          {isLive ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#e2e8f0'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: '#38bdf8' }} />
                  <strong>Tip for Extended Classes:</strong> If you prefer no 5-minute embedded demo popup, click "Dedicated HD Window" to run in full unlimited mode!
                </span>
                <button
                  onClick={openUnlimitedWindow}
                  style={{
                    backgroundColor: '#38bdf8',
                    color: '#041416',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ExternalLink size={12} /> Launch Full Window
                </button>
              </div>

              <div style={{ flex: 1, minHeight: '480px' }}>
                {isPopoutMode ? (
                  <div
                    style={{
                      height: '100%',
                      minHeight: '480px',
                      backgroundColor: '#041416',
                      borderRadius: '12px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2rem',
                      textAlign: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '2px solid #38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8'
                    }}>
                      <ExternalLink size={28} />
                    </div>
                    <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>Meeting is Active in Dedicated Window</h3>
                    <p style={{ color: '#94a3b8', margin: 0, maxWidth: '420px', fontSize: '0.88rem', lineHeight: 1.6 }}>
                      Your classroom video is running in a separate window. In-portal video is paused here to ensure you only appear once in the meeting.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => setIsPopoutMode(false)}
                        className="btn-primary"
                        style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                      >
                        Re-embed Video in Portal
                      </button>
                      <button
                        onClick={openUnlimitedWindow}
                        className="glass-panel"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#38bdf8', border: '1px solid #38bdf8' }}
                      >
                        Re-open Dedicated Window
                      </button>
                    </div>
                  </div>
                ) : (
                  <JitsiClassroom
                    roomName={roomName}
                    displayName={displayName}
                    height="100%"
                    isInstructor={true}
                    onReturn={() => window.location.href = '/instructor'}
                  />
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                minHeight: '520px',
                backgroundColor: '#041416',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 168, 150, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                gap: '1.25rem'
              }}
            >
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(0, 168, 150, 0.15)',
                border: '2px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <Video size={36} />
              </div>

              <div style={{ maxWidth: '480px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.4rem', margin: '0 0 8px 0', fontWeight: 700 }}>
                  Ready to Start Live Class?
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  Clicking the button below officially launches the live virtual room, sets the class status to <strong>LIVE</strong>, and automatically sends a real-time notification to all enrolled students so they can join!
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: '#cbd5e1'
                }}>
                  <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>{slotTitle}</span>
                  <span style={{ color: '#64748b' }}>•</span>
                  <span>{selectedSlot?.students_count || 0} Students Enrolled</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleStartClass()}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)'
                  }}
                >
                  {actionLoading ? <Loader2 size={16} className="spin-animation" /> : <Radio size={16} />}
                  🔴 Start Live Class & Notify Students
                </button>

                <button
                  onClick={openUnlimitedWindow}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  title="Officially launch class and open meeting in separate HD window"
                >
                  <ExternalLink size={16} /> Start in Dedicated Window
                </button>
              </div>
            </div>
          )}
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
              isInstructor={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}


