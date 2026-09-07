import React, { useState, useEffect } from 'react';
import { instructorsApi, attendanceApi } from '../../api';

export function InstructorAttendance() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceSheet, setAttendanceSheet] = useState({});
  const [pastRecords, setPastRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClassesAndStudents();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadHistory();
    }
  }, [selectedDate, selectedSlotId]);

  const loadClassesAndStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const [classesData, studentsData] = await Promise.all([
        instructorsApi.getMyClasses(),
        instructorsApi.getMyStudents(),
      ]);
      setClasses(classesData || []);
      setStudents(studentsData || []);

      if (classesData && classesData.length > 0) {
        setSelectedSlotId(classesData[0].id);
      }
    } catch (err) {
      console.error('Error loading attendance metadata:', err);
      setError('Failed to load classes or students.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = { date: selectedDate };
      if (selectedSlotId) params.slot_id = selectedSlotId;
      const history = await attendanceApi.getAll(params);
      setPastRecords(history || []);

      // Also pre-populate attendance sheet with existing records for this date
      const sheet = {};
      (history || []).forEach((rec) => {
        sheet[rec.student_id] = {
          status: rec.status,
          remarks: rec.remarks || '',
          record_id: rec.id,
        };
      });
      setAttendanceSheet((prev) => ({ ...prev, ...sheet }));
    } catch (err) {
      console.error('Error loading attendance history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter students by selected slot
  const enrolledStudents = students.filter((st) => {
    if (!selectedSlotId) return true;
    return st.slot_id === selectedSlotId || st.slot_name?.toLowerCase().includes(selectedSlotId.toLowerCase());
  });

  const handleStatusChange = (studentId, status) => {
    setAttendanceSheet((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceSheet((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        remarks,
      },
    }));
  };

  const markAll = (status) => {
    const updated = { ...attendanceSheet };
    enrolledStudents.forEach((st) => {
      updated[st.id] = {
        ...(updated[st.id] || {}),
        status,
      };
    });
    setAttendanceSheet(updated);
  };

  const handleSaveAttendance = async () => {
    if (enrolledStudents.length === 0) {
      setMessage('No students to record attendance for.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const recordsToSave = enrolledStudents.map((st) => {
        const item = attendanceSheet[st.id] || {};
        return {
          student_id: st.id,
          slot_id: selectedSlotId || st.slot_id || null,
          enrollment_id: st.enrollment_id || null,
          date: selectedDate,
          status: item.status || 'present',
          remarks: item.remarks || '',
        };
      });

      await attendanceApi.bulkRecord(recordsToSave);
      setMessage(`Successfully recorded attendance for ${recordsToSave.length} students.`);
      await loadHistory();
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError(err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Quick summary counts
  const counts = enrolledStudents.reduce(
    (acc, st) => {
      const status = attendanceSheet[st.id]?.status || 'unmarked';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 }
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            Class Attendance
          </h1>
          <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
            Record and manage daily session attendance for your assigned students.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => markAll('present')}
            className="glass-panel"
            style={{
              padding: '0.6rem 1.2rem',
              color: '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Mark All Present
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading}
            className="btn-primary"
            style={{
              padding: '0.6rem 1.4rem',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
            }}
          >
            {saving ? 'Saving...' : '💾 Save Attendance'}
          </button>
        </div>
      </div>

      {/* Messages */}
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

      {/* Control Bar: Class selector, Date Picker, and Stat Badges */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Class / Slot
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                minWidth: '220px',
              }}
            >
              <option value="">All Assigned Students</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.slot_name || cls.slot_time} ({cls.schedule_days ? cls.schedule_days.join(', ') : 'Daily'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Session Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>

        {/* Counter Pills */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
            {counts.present} Present
          </div>
          <div style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
            {counts.absent} Absent
          </div>
          <div style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600 }}>
            {counts.late} Late
          </div>
          <div style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600 }}>
            {counts.excused} Excused
          </div>
        </div>
      </div>

      {/* Student Attendance Sheet */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '1.2rem', fontWeight: 600 }}>
          Roster for {selectedDate} ({enrolledStudents.length} Students)
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#8892b0' }}>Loading students...</div>
        ) : enrolledStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#8892b0' }}>
            No students found enrolled in this slot.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#8892b0', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Student</th>
                <th style={{ padding: '0.75rem 1rem' }}>Code / Contact</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              {enrolledStudents.map((st) => {
                const currentStatus = attendanceSheet[st.id]?.status || 'unmarked';
                const currentRemarks = attendanceSheet[st.id]?.remarks || '';

                return (
                  <tr
                    key={st.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>
                      {st.name}
                      <div style={{ fontSize: '0.75rem', color: '#8892b0', fontWeight: 400 }}>
                        {st.slot_name || 'Standard Slot'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#b0c4c6', fontSize: '0.85rem' }}>
                      <code>{st.student_code || 'N/A'}</code>
                      <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>{st.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {[
                          { key: 'present', label: 'Present', bg: 'rgba(52, 211, 153, 0.2)', activeBg: '#10b981', color: '#34d399' },
                          { key: 'absent', label: 'Absent', bg: 'rgba(239, 68, 68, 0.2)', activeBg: '#ef4444', color: '#f87171' },
                          { key: 'late', label: 'Late', bg: 'rgba(245, 158, 11, 0.2)', activeBg: '#f59e0b', color: '#fbbf24' },
                          { key: 'excused', label: 'Excused', bg: 'rgba(59, 130, 246, 0.2)', activeBg: '#3b82f6', color: '#60a5fa' },
                        ].map((btn) => {
                          const isSelected = currentStatus === btn.key;
                          return (
                            <button
                              key={btn.key}
                              type="button"
                              onClick={() => handleStatusChange(st.id, btn.key)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: isSelected ? 700 : 500,
                                border: isSelected ? `1px solid ${btn.color}` : '1px solid transparent',
                                backgroundColor: isSelected ? btn.activeBg : btn.bg,
                                color: isSelected ? '#ffffff' : btn.color,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input
                        type="text"
                        value={currentRemarks}
                        placeholder="Optional remarks..."
                        onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          width: '100%',
                          maxWidth: '280px',
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Historical Session Records */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '1.2rem', fontWeight: 600 }}>
          Recorded Sessions for {selectedDate}
        </h2>
        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#8892b0' }}>Loading session history...</div>
        ) : pastRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#8892b0' }}>
            No saved attendance records found for this date.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#8892b0', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Remarks</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {pastRecords.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: '#fff', fontWeight: 500 }}>
                    {rec.student_name || rec.student_id}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        backgroundColor:
                          rec.status === 'present'
                            ? 'rgba(52, 211, 153, 0.2)'
                            : rec.status === 'late'
                            ? 'rgba(251, 191, 36, 0.2)'
                            : rec.status === 'excused'
                            ? 'rgba(96, 165, 250, 0.2)'
                            : 'rgba(248, 113, 113, 0.2)',
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
                  <td style={{ padding: '0.75rem 1rem', color: '#b0c4c6', fontSize: '0.85rem' }}>
                    {rec.remarks || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#8892b0', fontSize: '0.85rem' }}>
                    {rec.date}
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
