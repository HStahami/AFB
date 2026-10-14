import React, { useEffect, useRef, useState } from 'react';
import { Video, Loader2, AlertCircle, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';

export function JitsiClassroom({
  roomName,
  displayName,
  onLeave,
  onReturn,
  height = "100%",
  isInstructor = false,
  allowStudentWhiteboard = false
}) {
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLeft, setHasLeft] = useState(false);
  const [rejoinKey, setRejoinKey] = useState(0);

  // Clean and sanitize room name to safe ASCII string
  const cleanRoomName = (roomName || 'AFB_Live_Classroom')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');

  const formattedDisplayName = displayName || 'Student';

  useEffect(() => {
    let isMounted = true;

    if (hasLeft) return;

    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }

        const existingScript = document.getElementById('jitsi-meet-api-script');
        if (existingScript) {
          existingScript.onload = () => resolve(window.JitsiMeetExternalAPI);
          existingScript.onerror = () => reject(new Error('Failed to load Jitsi API'));
          return;
        }

        const script = document.createElement('script');
        script.id = 'jitsi-meet-api-script';
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve(window.JitsiMeetExternalAPI);
        script.onerror = () => reject(new Error('Failed to load Jitsi classroom script'));
        document.body.appendChild(script);
      });
    };

    const initJitsi = async () => {
      try {
        setLoading(true);
        setError(null);
        const JitsiAPI = await loadJitsiScript();

        if (!isMounted || !containerRef.current) return;

        // Clean up previous instance if any
        if (jitsiApiRef.current) {
          try {
            jitsiApiRef.current.dispose();
          } catch (e) {
            console.error('Error disposing previous Jitsi instance:', e);
          }
          jitsiApiRef.current = null;
        }

        const domain = 'meet.jit.si';
        const canUseWhiteboard = isInstructor || Boolean(allowStudentWhiteboard);
        const toolbarButtons = [
          'microphone',
          'camera',
          'desktop',
          ...(canUseWhiteboard ? ['whiteboard'] : []),
          'chat',
          'raisehand',
          'tileview',
          'videoquality',
          'filmstrip',
          'fullscreen',
          'hangup'
        ];

        const options = {
          roomName: cleanRoomName,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: formattedDisplayName,
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: true, // Privacy/Parda by default
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            disableThirdPartyRequests: true,
            whiteboard: {
              enabled: canUseWhiteboard
            },
            toolbarButtons: toolbarButtons
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#072224',
            TOOLBAR_BUTTONS: toolbarButtons
          }
        };

        const api = new JitsiAPI(domain, options);
        jitsiApiRef.current = api;

        api.addEventListener('videoConferenceJoined', () => {
          if (isMounted) setLoading(false);
        });

        // Intercept hangup and call exit cleanly before Jitsi displays close/advertisement page
        const handleSessionEnded = () => {
          if (jitsiApiRef.current) {
            try {
              jitsiApiRef.current.dispose();
            } catch (e) {
              console.error('Error disposing Jitsi on hangup:', e);
            }
            jitsiApiRef.current = null;
          }
          if (isMounted) {
            setHasLeft(true);
            setLoading(false);
          }
          if (onLeave) onLeave();
        };

        api.addEventListener('readyToClose', handleSessionEnded);
        api.addEventListener('videoConferenceLeft', handleSessionEnded);

        // Fallback in case videoConferenceJoined is delayed
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 3500);

      } catch (err) {
        console.error('Failed to initialize classroom:', err);
        if (isMounted) {
          setError('Unable to connect to live classroom. Please check your internet connection.');
          setLoading(false);
        }
      }
    };

    initJitsi();

    return () => {
      isMounted = false;
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi instance on unmount:', e);
        }
        jitsiApiRef.current = null;
      }
    };
  }, [cleanRoomName, formattedDisplayName, hasLeft, rejoinKey]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        minHeight: '520px',
        backgroundColor: '#041416',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 168, 150, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(4, 20, 22, 0.95)',
            zIndex: 10,
            gap: '1rem',
            color: '#e2e8f0'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(0, 168, 150, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--color-primary)'
          }}>
            <Loader2 size={30} className="spin-animation" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.1rem' }}>
              Connecting to Alarabia Virtual Classroom...
            </h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              Setting up audio, video, whiteboard & tools.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#041416',
            zIndex: 10,
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <AlertCircle size={44} style={{ color: '#ef4444' }} />
          <h4 style={{ color: '#fff', margin: 0 }}>Classroom Connection Issue</h4>
          <p style={{ color: '#94a3b8', margin: 0, maxWidth: '400px', fontSize: '0.9rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}
          >
            <RefreshCw size={16} /> Reconnect
          </button>
        </div>
      )}

      {hasLeft && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#041416',
            zIndex: 20,
            gap: '1.25rem',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 168, 150, 0.15)',
            border: '2px solid var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.35rem', margin: '0 0 8px 0', fontWeight: 700 }}>
              Class Session Ended
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
              You have cleanly left the live virtual classroom session. You can rejoin the live room at any time or navigate back to your dashboard.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setHasLeft(false);
                setRejoinKey(prev => prev + 1);
              }}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                fontSize: '0.9rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} /> Rejoin Class
            </button>
            <button
              onClick={() => {
                if (onReturn) {
                  onReturn();
                } else {
                  window.history.back();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                fontSize: '0.9rem',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <ArrowLeft size={16} /> Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Jitsi Target Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          flex: 1
        }}
      />
    </div>
  );
}
