import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../api';

export function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsApi.getAll();
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setMessage('All notifications marked as read.');
    } catch (err) {
      console.error('Error marking all notifications read:', err);
      setError('Failed to mark all as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((item) => {
    if (filter === 'unread') return !item.is_read;
    if (filter === 'read') return item.is_read;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'task':
        return '📝';
      case 'submission':
        return '📬';
      case 'assessment':
        return '⭐';
      case 'schedule':
        return '📅';
      default:
        return '🔔';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            Notifications & Alerts
          </h1>
          <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
            Updates on newly published coursework, instructor grading, and class announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={actionLoading}
            className="glass-panel"
            style={{
              padding: '0.6rem 1.25rem',
              color: 'var(--color-primary)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            ✓ Mark All Read
          </button>
        )}
      </div>

      {message && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            borderLeft: '4px solid #10b981',
            color: '#34d399',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
          }}
        >
          {message}
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: `Read (${notifications.length - unreadCount})` },
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

      {/* Notifications List */}
      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
          Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>All Caught Up</h3>
          <p style={{ color: '#8892b0', margin: 0 }}>
            {filter === 'unread'
              ? 'You have no unread notifications.'
              : 'Your notification inbox is currently clear.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className="glass-panel"
              style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1.25rem',
                borderLeft: notif.is_read ? '4px solid transparent' : '4px solid var(--color-primary)',
                backgroundColor: notif.is_read ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.75)',
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: notif.is_read ? 'rgba(255, 255, 255, 0.05)' : 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {getIcon(notif.notification_type || notif.type)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: notif.is_read ? 500 : 700,
                        color: notif.is_read ? '#e2e8f0' : '#fff',
                      }}
                    >
                      {notif.title}
                    </h3>
                    {!notif.is_read && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary)',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </div>

                  <p style={{ margin: 0, color: '#b0c4c6', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    {notif.message}
                  </p>

                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#8892b0' }}>
                    {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                  </div>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#8892b0',
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.65rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
