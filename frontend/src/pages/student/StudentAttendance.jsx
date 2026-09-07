import React, { useState, useEffect } from 'react';
import { attendanceApi, reportsApi } from '../../api';

export function StudentAttendance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [history, report] = await Promise.all([
        attendanceApi.getAll(),
        reportsApi.getMyReport(),
      ]);
      setRecords(history || []);
      setStats(report?.attendance || null);
    } catch (err) {
      console.error('Error loading student attendance:', err);
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate = stats?.attendance_rate ?? 100;
  const totalSessions = stats?.total_sessions ?? records.length;
  const presentCount = stats?.present ?? records.filter((r) => r.status === 'present').length;
  const lateCount = stats?.late ?? records.filter((r) => r.status === 'late').length;
  const excusedCount = stats?.excused ?? records.filter((r) => r.status === 'excused').length;
  const absentCount = stats?.absent ?? records.filter((r) => r.status === 'absent').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
          My Attendance Records
        </h1>
        <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
          Official session attendance logs and punctuality records maintained by your instructor.
        </p>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Attendance Rate
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#34d399', margin: '0.3rem 0' }}>
            {attendanceRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>{totalSessions} Total Sessions</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #34d399' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Present
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#34d399', margin: '0.3rem 0' }}>
            {presentCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Full participation</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #fbbf24' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Late
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24', margin: '0.3rem 0' }}>
            {lateCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Tardy entries</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #60a5fa' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Excused
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#60a5fa', margin: '0.3rem 0' }}>
            {excusedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Authorized leaves</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f87171' }}>
          <div style={{ fontSize: '0.75rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Absent
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f87171', margin: '0.3rem 0' }}>
            {absentCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Missed sessions</div>
        </div>
      </div>

      {/* Historical Session Records */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.25rem', fontWeight: 600 }}>
          Session-by-Session History ({records.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
            Loading attendance records...
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
            <h3 style={{ color: '#fff', marginBottom: '0.4rem' }}>No Attendance Logged Yet</h3>
            <p style={{ color: '#8892b0', margin: 0 }}>
              Your teacher will mark attendance during your live class sessions.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#8892b0', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Session Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Instructor Notes / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '1rem', color: '#fff', fontWeight: 600 }}>
                    {rec.date}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor:
                          rec.status === 'present'
                            ? 'rgba(52, 211, 153, 0.15)'
                            : rec.status === 'late'
                            ? 'rgba(251, 191, 36, 0.15)'
                            : rec.status === 'excused'
                            ? 'rgba(96, 165, 250, 0.15)'
                            : 'rgba(248, 113, 113, 0.15)',
                        color:
                          rec.status === 'present'
                            ? '#34d399'
                            : rec.status === 'late'
                            ? '#fbbf24'
                            : rec.status === 'excused'
                            ? '#60a5fa'
                            : '#f87171',
                      }}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#b0c4c6', fontSize: '0.85rem' }}>
                    {rec.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
