import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsApi, slotsApi } from '../../api';
import { JitsiClassroom } from '../../components/classroom/JitsiClassroom';
import { SmartNotebook } from '../../components/classroom/SmartNotebook';
import { Video, BookOpen, User, Calendar, Maximize2, Minimize2, ArrowLeft, Clock, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StudentClassroom() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [checkingLive, setCheckingLive] = useState(true);
  const [activeTabMobile, setActiveTabMobile] = useState('video'); // 'video' | 'notes'
  const [fullVideoMode, setFullVideoMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await studentsApi.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching student profile for classroom:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const student = profile?.student || profile;
  const slot = profile?.slot;
  const instructor = profile?.instructor;

  // Derive unique, consistent room name for this enrolled slot
  const slotKey = slot?._id || slot?.id || student?.slot_id || 'general';
  const roomName = `AFB_Class_${slotKey}`;
  const displayName = student?.name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || user?.username || 'Student';
  const slotLabel = slot ? `${slot.days || ''} ${slot.time ? `— ${slot.time}` : ''}`.trim() : (student?.slot || 'Class Session');

  // Poll live status of this slot every 6 seconds
  useEffect(() => {
    let isCancelled = false;

    const checkLive = async () => {
      try {
        const res = await slotsApi.getLiveStatus(slotKey);
        if (!isCancelled) {
          setIsLive(Boolean(res?.is_live));
        }
      } catch (err) {
        console.error('Error checking live status:', err);
      } finally {
        if (!isCancelled) setCheckingLive(false);
      }
    };

    checkLive();
    const interval = setInterval(checkLive, 6000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [slotKey]);

  const openUnlimitedWindow = () => {
    const url = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.startWithVideoMuted=true&config.prejoinPageEnabled=false`;
    window.open(url, '_blank', 'noopener,noreferrer,width=1280,height=800');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      {/* Top Header Card */}
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
            to="/student"
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
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                LIVE CLASSROOM
              </span>
              {isLive ? (
                <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  Instructor is Live Now
                </span>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                  <Clock size={13} />
                  Class Not Started Yet
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.35rem', color: '#fff', margin: '4px 0 0 0', fontWeight: 700 }}>
              Alarabia Virtual Smart Classroom
            </h1>
          </div>
        </div>

        {/* Timetable & Instructor Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {slotLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
              <span>{slotLabel}</span>
            </div>
          )}

          {instructor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <User size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Instructor: <strong style={{ color: '#fff' }}>{instructor.name}</strong></span>
            </div>
          )}

          {/* Dedicated HD Window (No 5-min timeout) */}
          {isLive && (
            <button
              onClick={openUnlimitedWindow}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
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
          )}

          {/* Desktop Full-Video Toggle */}
          <button
            onClick={() => setFullVideoMode(!fullVideoMode)}
            className="glass-panel"
            title={fullVideoMode ? "Show Notes Panel" : "Hide Notes (Full Video)"}
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
            <span className="hide-on-mobile">{fullVideoMode ? "Split Screen" : "Full Video"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Switch Tabs (Only visible on small devices) */}
      <div
        className="show-on-mobile-only"
        style={{
          display: 'none', // Overridden by CSS media queries
          backgroundColor: '#092528',
          borderRadius: '8px',
          padding: '4px',
          gap: '4px'
        }}
      >
        <button
          onClick={() => setActiveTabMobile('video')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            background: activeTabMobile === 'video' ? 'var(--color-primary)' : 'transparent',
            color: activeTabMobile === 'video' ? '#041416' : '#94a3b8',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Video size={16} /> Live Lecture
        </button>
        <button
          onClick={() => setActiveTabMobile('notes')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            background: activeTabMobile === 'notes' ? 'var(--color-primary)' : 'transparent',
            color: activeTabMobile === 'notes' ? '#041416' : '#94a3b8',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <BookOpen size={16} /> Smart Notebook
        </button>
      </div>

      {/* Main Split Section: 70% Video + 30% Notebook */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: fullVideoMode ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          flex: 1,
          alignItems: 'stretch'
        }}
      >
        {/* Left Side: Jitsi Virtual Classroom or Waiting Card */}
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
                color: '#e2e8f0',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: '#38bdf8' }} />
                  <strong>Tip for Extended Classes:</strong> If you see an embedded 5-minute demo notice, click "Dedicated HD Window" for full unlimited duration!
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
                <JitsiClassroom
                  roomName={roomName}
                  displayName={displayName}
                  height="100%"
                  onReturn={() => window.location.href = '/student'}
                />
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
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b'
              }}>
                <Clock size={34} />
              </div>

              <div style={{ maxWidth: '460px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.35rem', margin: '0 0 8px 0', fontWeight: 700 }}>
                  Class Has Not Started Yet
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: 0, lineHeight: 1.6 }}>
                  Your instructor has not launched this live class session yet.
                  Please wait — this screen will connect automatically as soon as your instructor goes live!
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#cbd5e1',
                fontSize: '0.82rem',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <RefreshCw size={13} className="spin-animation" style={{ color: 'var(--color-primary)' }} />
                <span>Checking live status every 6s...</span>
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                  to="/student"
                  style={{
                    padding: '9px 18px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Smart Notebook (Can be toggled or viewed side-by-side) */}
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
              slotName={slotLabel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

