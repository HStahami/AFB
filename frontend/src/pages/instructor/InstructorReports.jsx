import React, { useState, useEffect } from 'react';
import { instructorsApi, reportsApi } from '../../api';

export function InstructorReports() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detailed Modal State
  const [detailedStudent, setDetailedStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [classesData, studentsData] = await Promise.all([
        instructorsApi.getMyClasses(),
        instructorsApi.getMyStudents(),
      ]);
      setClasses(classesData || []);
      setStudents(studentsData || []);
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to generate instructor reports.');
    } finally {
      setLoading(false);
    }
  };

  const openStudentDetailReport = async (student) => {
    setDetailedStudent(student);
    try {
      setReportLoading(true);
      const report = await reportsApi.getStudentReport(student.id);
      setStudentReport(report);
    } catch (err) {
      console.error('Error fetching detailed student report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  // Filter students by selected slot
  const filteredStudents = students.filter((st) => {
    if (!selectedSlotId) return true;
    return st.slot_id === selectedSlotId || st.slot_name?.toLowerCase().includes(selectedSlotId.toLowerCase());
  });

  // Calculate Class-wide Averages
  const totalStudents = filteredStudents.length;
  const avgAttendance =
    totalStudents > 0
      ? Math.round(
          filteredStudents.reduce((acc, st) => acc + (parseFloat(st.attendance_rate) || 0), 0) / totalStudents
        )
      : 0;

  const avgCompletion =
    totalStudents > 0
      ? Math.round(
          filteredStudents.reduce((acc, st) => acc + (parseFloat(st.task_completion_rate) || 0), 0) / totalStudents
        )
      : 0;

  const studentsWithScores = filteredStudents.filter((st) => st.average_score != null);
  const avgScore =
    studentsWithScores.length > 0
      ? Math.round(
          studentsWithScores.reduce((acc, st) => acc + (parseFloat(st.average_score) || 0), 0) /
            studentsWithScores.length
        )
      : null;

  const exportCSV = () => {
    const headers = ['Student Name', 'Student Code', 'Email', 'Slot', 'Attendance %', 'Task Completion %', 'Average Score %', 'Overall Progress'];
    const rows = filteredStudents.map((st) => [
      `"${st.name}"`,
      `"${st.student_code || ''}"`,
      `"${st.email}"`,
      `"${st.slot_name || ''}"`,
      st.attendance_rate || '100',
      st.task_completion_rate || '0',
      st.average_score != null ? st.average_score : 'N/A',
      st.overall_progress || '0',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `instructor_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            Academic Performance Reports
          </h1>
          <p style={{ color: '#8892b0', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
            Dynamic analytics across your classes, student submissions, and attendance milestones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.print()}
            className="glass-panel"
            style={{
              padding: '0.6rem 1.2rem',
              color: '#b0c4c6',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            🖨️ Print Summary
          </button>
          <button
            onClick={exportCSV}
            disabled={filteredStudents.length === 0}
            className="btn-primary"
            style={{
              padding: '0.6rem 1.4rem',
              border: 'none',
              cursor: filteredStudents.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

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

      {/* Class Filter Dropdown */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#8892b0', fontWeight: 600 }}>
            Scope Filter:
          </label>
          <select
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              minWidth: '240px',
            }}
          >
            <option value="">All Classes & Students ({students.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.slot_name || cls.slot_time} ({cls.schedule_days ? cls.schedule_days.join(', ') : 'Daily'})
              </option>
            ))}
          </select>
        </div>

        <div style={{ color: '#8892b0', fontSize: '0.85rem' }}>
          Metrics computed in real-time from active LMS logs
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Students
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', margin: '0.4rem 0' }}>
            {totalStudents}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Currently enrolled in scope</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg Attendance Rate
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#34d399', margin: '0.4rem 0' }}>
            {avgAttendance}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>Across recorded sessions</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg Task Completion
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24', margin: '0.4rem 0' }}>
            {avgCompletion}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>Assigned homework & quizzes</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #a855f7' }}>
          <div style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg Assessment Score
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#c084fc', margin: '0.4rem 0' }}>
            {avgScore !== null ? `${avgScore}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>Based on graded submissions</div>
        </div>
      </div>

      {/* Student Roster Performance Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.2rem', fontWeight: 600 }}>
          Individual Student Breakdown ({filteredStudents.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>Computing student metrics...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
            No students found in this selection.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#8892b0', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Slot</th>
                <th style={{ padding: '0.75rem 1rem' }}>Attendance</th>
                <th style={{ padding: '0.75rem 1rem' }}>Task Completion</th>
                <th style={{ padding: '0.75rem 1rem' }}>Avg Grade</th>
                <th style={{ padding: '0.75rem 1rem' }}>Progress Score</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st) => (
                <tr
                  key={st.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.2s',
                  }}
                >
                  <td style={{ padding: '1rem', color: '#fff', fontWeight: 600 }}>
                    {st.name}
                    <div style={{ fontSize: '0.75rem', color: '#8892b0', fontWeight: 400 }}>
                      <code>{st.student_code || 'N/A'}</code>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: '#b0c4c6', fontSize: '0.85rem' }}>
                    {st.slot_name || 'Standard'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          minWidth: '60px',
                        }}
                      >
                        <div
                          style={{
                            width: `${st.attendance_rate || 0}%`,
                            height: '100%',
                            backgroundColor: (st.attendance_rate || 0) >= 80 ? '#34d399' : '#f87171',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                        {st.attendance_rate || 100}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          minWidth: '60px',
                        }}
                      >
                        <div
                          style={{
                            width: `${st.task_completion_rate || 0}%`,
                            height: '100%',
                            backgroundColor: '#fbbf24',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                        {st.task_completion_rate || 0}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: '#c084fc', fontWeight: 600 }}>
                    {st.average_score != null ? `${st.average_score}%` : '—'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        backgroundColor:
                          (st.overall_progress || 0) >= 70
                            ? 'rgba(52, 211, 153, 0.15)'
                            : 'rgba(251, 191, 36, 0.15)',
                        color: (st.overall_progress || 0) >= 70 ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {st.overall_progress || 0}%
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => openStudentDetailReport(st)}
                      className="glass-panel"
                      style={{
                        padding: '0.35rem 0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      View Report ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detailed Student Report Modal */}
      {detailedStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '640px',
              padding: '2rem',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                  Academic Progress Report: {detailedStudent.name}
                </h2>
                <div style={{ color: '#8892b0', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Code: <code>{detailedStudent.student_code}</code> | Email: {detailedStudent.email}
                </div>
              </div>
              <button
                onClick={() => {
                  setDetailedStudent(null);
                  setStudentReport(null);
                }}
                style={{ background: 'none', border: 'none', color: '#8892b0', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {reportLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
                Fetching real-time academic records...
              </div>
            ) : studentReport ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Overall Score Badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>Overall Progress Score</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399' }}>
                      {studentReport.overall_progress_score}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>Active Enrollments</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>
                      {studentReport.enrollments_count}
                    </div>
                  </div>
                </div>

                {/* Attendance Metric Breakdown */}
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                    Attendance Analytics ({studentReport.attendance?.attendance_rate}%)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.1)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                        {studentReport.attendance?.present || 0}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Present</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.1)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>
                        {studentReport.attendance?.late || 0}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Late</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(96, 165, 250, 0.1)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#60a5fa' }}>
                        {studentReport.attendance?.excused || 0}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Excused</div>
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(248, 113, 113, 0.1)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>
                        {studentReport.attendance?.absent || 0}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>Absent</div>
                    </div>
                  </div>
                </div>

                {/* Tasks & Assessments */}
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                    Tasks & Academic Milestones
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>Tasks Submitted</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: '0.2rem 0' }}>
                        {studentReport.tasks?.total_submitted} / {studentReport.tasks?.total_assigned}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
                        {studentReport.tasks?.completion_rate}% Completion Rate
                      </div>
                    </div>

                    <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>Graded Assessments</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: '0.2rem 0' }}>
                        {studentReport.assessments?.total_graded} Graded
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#c084fc' }}>
                        Average Score: {studentReport.assessments?.average_score != null ? `${studentReport.assessments.average_score}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setDetailedStudent(null);
                      setStudentReport(null);
                    }}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.4rem', border: 'none', cursor: 'pointer' }}
                  >
                    Close Report
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#8892b0' }}>
                Unable to load report for this student.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
