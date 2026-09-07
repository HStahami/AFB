import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, LogOut } from 'lucide-react';
import { API_BASE, getAvatarUrl } from '../../api/client';
import { inputStyle } from '../../components/common/styles';

export function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, canceled: 0, total_students: 0, total_instructors: 0, total_modules: 0 });
  const [admissions, setAdmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [modules, setModules] = useState([]);
  const [slots, setSlots] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Instructor Form State
  const [newInstName, setNewInstName] = useState('');
  const [newInstAbout, setNewInstAbout] = useState('');
  const [newInstSpec, setNewInstSpec] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingInstId, setEditingInstId] = useState(null);
  const [instFormSuccess, setInstFormSuccess] = useState('');
  const [instFormError, setInstFormError] = useState('');
  const fileInputRef = useRef(null);

  // Module Form State
  const [modName, setModName] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modOrder, setModOrder] = useState(1);
  const [modFile, setModFile] = useState(null);
  const [editingModId, setEditingModId] = useState(null);
  const [modFormSuccess, setModFormSuccess] = useState('');
  const [modFormError, setModFormError] = useState('');
  const modFileInputRef = useRef(null);

  // Slot Form State
  const [slotDays, setSlotDays] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [slotStatus, setSlotStatus] = useState('Active');
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [slotFormSuccess, setSlotFormSuccess] = useState('');
  const [slotFormError, setSlotFormError] = useState('');

  // Assign modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignSlot, setAssignSlot] = useState('');
  const [assignInst, setAssignInst] = useState('');

  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, { headers });
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const fetchAdmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/admissions/`, { headers });
      const data = await res.json();
      setAdmissions(data);
    } catch (e) { console.error(e); }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/students/`, { headers });
      const data = await res.json();
      setStudents(data);
    } catch (e) { console.error(e); }
  };

  const fetchInstructors = async () => {
    try {
      const res = await fetch(`${API_BASE}/instructors/`, { headers });
      const data = await res.json();
      setInstructors(data);
    } catch (e) { console.error(e); }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(`${API_BASE}/modules/`);
      const data = await res.json();
      setModules(data);
    } catch (e) { console.error(e); }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_BASE}/slots/`);
      const data = await res.json();
      setSlots(data);
    } catch (e) { console.error(e); }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE}/contact/`, { headers });
      const data = await res.json();
      setContacts(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
    fetchInstructors();
    fetchSlots();
    if (activeTab === 'admissions') fetchAdmissions();
    if (activeTab === 'students') { fetchStudents(); fetchInstructors(); fetchSlots(); }
    if (activeTab === 'instructors') fetchInstructors();
    if (activeTab === 'modules') fetchModules();
    if (activeTab === 'slots') fetchSlots();
    if (activeTab === 'contacts') fetchContacts();
  }, [activeTab]);

  const handleSendFeeEmail = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/send-fee-email`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error();
      alert("Fee email queued!");
      fetchAdmissions();
    } catch (e) { alert("Failed to send fee email"); }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/approve`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error();
      alert("Admission Approved! Student record created.");
      fetchAdmissions();
      fetchStats();
    } catch (e) { alert("Failed to approve"); }
  };

  const handleCancel = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/cancel`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error();
      alert("Admission Canceled.");
      fetchAdmissions();
      fetchStats();
    } catch (e) { alert("Failed to cancel"); }
  };

  const handleAddOrUpdateInstructor = async (e) => {
    e.preventDefault();
    setInstFormSuccess('');
    setInstFormError('');
    try {
      const formData = new FormData();
      formData.append('name', newInstName);
      formData.append('about', newInstAbout);
      formData.append('specialty', newInstSpec || newInstAbout);
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const url = editingInstId ? `${API_BASE}/instructors/${editingInstId}` : `${API_BASE}/instructors/`;
      const method = editingInstId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Failed to save instructor.");

      setInstFormSuccess(editingInstId ? "Instructor updated successfully!" : "Instructor added successfully!");
      setNewInstName('');
      setNewInstAbout('');
      setNewInstSpec('');
      setSelectedFile(null);
      setEditingInstId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchInstructors();
      fetchStats();
    } catch (e) {
      console.error(e);
      setInstFormError("Failed to save instructor. Please try again.");
    }
  };

  const handleEditInstructorClick = (inst) => {
    setEditingInstId(inst._id || inst.id);
    setNewInstName(inst.name || '');
    setNewInstAbout(inst.about || inst.specialty || '');
    setNewInstSpec(inst.specialty || inst.about || '');
    setSelectedFile(null);
    setInstFormSuccess('');
    setInstFormError('');
  };

  const handleCancelEditInstructor = () => {
    setEditingInstId(null);
    setNewInstName('');
    setNewInstAbout('');
    setNewInstSpec('');
    setSelectedFile(null);
    setInstFormSuccess('');
    setInstFormError('');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteInstructor = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/instructors/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      fetchInstructors();
      fetchStats();
    } catch (e) { alert("Failed to delete instructor"); }
  };

  // Module Actions
  const handleAddOrUpdateModule = async (e) => {
    e.preventDefault();
    setModFormSuccess('');
    setModFormError('');
    try {
      const formData = new FormData();
      formData.append('name', modName);
      formData.append('description', modDesc);
      formData.append('order', modOrder);
      if (modFile) {
        formData.append('image', modFile);
      }

      const url = editingModId ? `${API_BASE}/modules/${editingModId}` : `${API_BASE}/modules/`;
      const method = editingModId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Failed to save module.");

      setModFormSuccess(editingModId ? "Module updated successfully!" : "Module added successfully!");
      setModName('');
      setModDesc('');
      setModOrder(1);
      setModFile(null);
      setEditingModId(null);
      if (modFileInputRef.current) modFileInputRef.current.value = "";
      fetchModules();
      fetchStats();
    } catch (e) {
      console.error(e);
      setModFormError("Failed to save module. Please try again.");
    }
  };

  const handleEditModuleClick = (mod) => {
    setEditingModId(mod._id || mod.id);
    setModName(mod.name || mod.title || '');
    setModDesc(mod.description || '');
    setModOrder(mod.order || 1);
    setModFile(null);
    setModFormSuccess('');
    setModFormError('');
  };

  const handleCancelEditModule = () => {
    setEditingModId(null);
    setModName('');
    setModDesc('');
    setModOrder(1);
    setModFile(null);
    setModFormSuccess('');
    setModFormError('');
    if (modFileInputRef.current) modFileInputRef.current.value = "";
  };

  const handleDeleteModule = async (id) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    try {
      const res = await fetch(`${API_BASE}/modules/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      fetchModules();
      fetchStats();
    } catch (e) { alert("Failed to delete module"); }
  };

  // Slot Actions
  const handleAddOrUpdateSlot = async (e) => {
    e.preventDefault();
    setSlotFormSuccess('');
    setSlotFormError('');
    try {
      const formData = new FormData();
      formData.append('days', slotDays);
      formData.append('time', slotTime);
      formData.append('status', slotStatus);

      const url = editingSlotId ? `${API_BASE}/slots/${editingSlotId}` : `${API_BASE}/slots/`;
      const method = editingSlotId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Failed to save slot.");

      setSlotFormSuccess(editingSlotId ? "Slot updated successfully!" : "Slot added successfully!");
      setSlotDays('');
      setSlotTime('');
      setSlotStatus('Active');
      setEditingSlotId(null);
      fetchSlots();
      fetchStats();
    } catch (e) {
      console.error(e);
      setSlotFormError("Failed to save slot. Please try again.");
    }
  };

  const handleEditSlotClick = (slotItem) => {
    setEditingSlotId(slotItem._id || slotItem.id);
    setSlotDays(slotItem.days || '');
    setSlotTime(slotItem.time || '');
    setSlotStatus(slotItem.status || 'Active');
    setSlotFormSuccess('');
    setSlotFormError('');
  };

  const handleCancelEditSlot = () => {
    setEditingSlotId(null);
    setSlotDays('');
    setSlotTime('');
    setSlotStatus('Active');
    setSlotFormSuccess('');
    setSlotFormError('');
  };

  const handleDeleteSlot = async (id) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;
    try {
      const res = await fetch(`${API_BASE}/slots/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      fetchSlots();
      fetchStats();
    } catch (e) { alert("Failed to delete slot"); }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/students/${selectedStudent._id}/assign?slot=${encodeURIComponent(assignSlot)}&instructor=${encodeURIComponent(assignInst)}`, {
        method: 'PATCH',
        headers
      });
      if (!res.ok) throw new Error();
      alert("Slot & Instructor assigned! Email sent to student.");
      setSelectedStudent(null);
      fetchStudents();
    } catch (e) { alert("Failed to assign"); }
  };

  const tableHeaderStyle = { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-primary)', textAlign: 'left' };
  const tableCellStyle = { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e0e0e0' };

  return (
    <div className="admin-layout">
      {/* Mobile Top Header */}
      <div className="admin-mobile-header">
        <h3 style={{ color: 'var(--color-white)', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }} className="gradient-text">LMS Panel</h3>
        <button className="glass-panel" style={{ padding: '6px 12px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ff6b6b', fontSize: '0.85rem' }} onClick={onLogout}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Mobile Horizontal Tab Navigation */}
      <div className="admin-mobile-tab-bar no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'admissions', label: 'Admissions' },
          { id: 'students', label: 'Students' },
          { id: 'instructors', label: 'Instructors' },
          { id: 'modules', label: 'Modules' },
          { id: 'slots', label: 'Slots' },
          { id: 'contacts', label: 'Messages' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`admin-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop Sidebar */}
      <div className="admin-sidebar">
        <h3 style={{ color: 'var(--color-white)', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }} className="gradient-text">LMS Panel</h3>
        <button className={activeTab === 'overview' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'admissions' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('admissions')}>Admissions</button>
        <button className={activeTab === 'students' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('students')}>Students</button>
        <button className={activeTab === 'instructors' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('instructors')}>Instructors</button>
        <button className={activeTab === 'modules' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('modules')}>Modules</button>
        <button className={activeTab === 'slots' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('slots')}>Slots</button>
        <button className={activeTab === 'contacts' ? 'btn-primary' : 'glass-panel'} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none' }} onClick={() => setActiveTab('contacts')}>Messages</button>

        <button className="glass-panel" style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff6b6b' }} onClick={onLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Main Admin Area */}
      <div className="admin-content-area">
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Institute Overview</h2>
            <div className="stats-cards-grid">
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Total Forms</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-white)' }}>{stats.total}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #f39c12' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Pending</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#f39c12' }}>{stats.pending}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #2ecc71' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Approved</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#2ecc71' }}>{stats.approved}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #e74c3c' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Canceled</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#e74c3c' }}>{stats.canceled}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid var(--color-primary)' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Active Students</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{stats.total_students}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid var(--color-accent)' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Active Instructors</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>{instructors.length}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #3498db' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Class Slots</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#3498db' }}>{stats.total_slots || slots.length || 0}</p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #9b59b6' }}>
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Modules</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#9b59b6' }}>{stats.total_modules || 0}</p>
              </div>
            </div>

            {/* Active Instructors & Assigned Classes Breakdown */}
            <div style={{ marginTop: '2.5rem' }}>
              <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
                Active Instructors & Class Workload Breakdown
              </h3>

              {instructors.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>
                  No active instructors registered yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {instructors.map(inst => {
                    const slotMap = {};
                    if (inst.students && inst.students.length > 0) {
                      inst.students.forEach(s => {
                        const sSlot = s.slot || 'Unassigned Slot';
                        if (!slotMap[sSlot]) slotMap[sSlot] = [];
                        slotMap[sSlot].push(s.name);
                      });
                    }

                    const assignedSlotsCount = Object.keys(slotMap).length;

                    return (
                      <div key={inst._id || inst.id} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(197, 229, 232, 0.15)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <img
                            src={getAvatarUrl(inst.avatar, inst.name)}
                            alt={inst.name}
                            style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', background: 'var(--color-bg-dark)' }}
                          />
                          <div>
                            <h4 style={{ color: 'var(--color-white)', fontSize: '1.1rem', fontWeight: '600' }}>{inst.name}</h4>
                            <p style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>{inst.specialty || inst.about || 'Arabic Instructor'}</p>
                          </div>
                          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{inst.total_students || 0}</span>
                            <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Students</div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#e0e0e0', marginBottom: '0.5rem' }}>
                            Assigned Classes ({assignedSlotsCount})
                          </div>
                          {assignedSlotsCount > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              {Object.entries(slotMap).map(([slotName, studentList], idx) => (
                                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)', fontWeight: '500', marginBottom: '4px' }}>
                                    <span>• {slotName}</span>
                                    <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{studentList.length} Student{studentList.length > 1 ? 's' : ''}</span>
                                  </div>
                                  <div style={{ color: '#aaa', fontSize: '0.8rem', paddingLeft: '0.8rem' }}>
                                    {studentList.join(', ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#666', fontSize: '0.85rem', italic: 'true' }}>No active class assignments yet</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'admissions' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Admission Forms</h2>
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Phone</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map(adm => (
                    <tr key={adm._id}>
                      <td style={tableCellStyle}>{adm.first_name} {adm.last_name}</td>
                      <td style={tableCellStyle}>{adm.email}</td>
                      <td style={tableCellStyle}>{adm.phone}</td>
                      <td style={tableCellStyle}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          background: adm.status === 'Approved' ? 'rgba(46, 204, 113, 0.2)' : adm.status === 'Canceled' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(243, 156, 18, 0.2)',
                          color: adm.status === 'Approved' ? '#2ecc71' : adm.status === 'Canceled' ? '#e74c3c' : '#f39c12'
                        }}>{adm.status}</span>
                      </td>
                      <td style={tableCellStyle}>
                        {adm.status === 'Pending' && (
                          <button onClick={() => handleSendFeeEmail(adm._id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: '8px' }}>Send Fee Info</button>
                        )}
                        {adm.status === 'Fee Email Sent' && (
                          <button onClick={() => handleApprove(adm._id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: '8px', background: '#2e7d32' }}>Approve (Paid)</button>
                        )}
                        {adm.status !== 'Approved' && adm.status !== 'Canceled' && (
                          <button onClick={() => handleCancel(adm._id)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#e74c3c', border: '1px solid #e74c3c' }}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Active Students</h2>
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Phone</th>
                    <th style={tableHeaderStyle}>Slot</th>
                    <th style={tableHeaderStyle}>Instructor</th>
                    <th style={tableHeaderStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(std => (
                    <tr key={std._id}>
                      <td style={tableCellStyle}>{std.first_name} {std.last_name}</td>
                      <td style={tableCellStyle}>{std.email}</td>
                      <td style={tableCellStyle}>{std.phone}</td>
                      <td style={tableCellStyle}>{std.slot || <span style={{ color: '#777' }}>Not Assigned</span>}</td>
                      <td style={tableCellStyle}>{std.instructor || <span style={{ color: '#777' }}>Not Assigned</span>}</td>
                      <td style={tableCellStyle}>
                        <button onClick={() => setSelectedStudent(std)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Assign/Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Assign Modal Overlay */}
            {selectedStudent && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '400px', width: '90%' }}>
                  <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem' }}>Assign Class Details</h3>
                  <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Student: {selectedStudent.first_name} {selectedStudent.last_name}</p>
                  <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Select Slot/Time</label>
                      <select required value={assignSlot} onChange={e => setAssignSlot(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                        <option value="" disabled>Choose Slot...</option>
                        {slots.filter(s => s.status === 'Active' || (selectedStudent && selectedStudent.slot && (selectedStudent.slot === `${s.days} — ${s.time}` || selectedStudent.slot === `${s.days} ${s.time}`))).map(s => {
                          const val = `${s.days} — ${s.time}`;
                          return <option key={s._id || s.id} value={val}>{val}</option>;
                        })}
                        {selectedStudent && selectedStudent.slot && !slots.some(s => `${s.days} — ${s.time}` === selectedStudent.slot || `${s.days} ${s.time}` === selectedStudent.slot) && (
                          <option value={selectedStudent.slot}>{selectedStudent.slot} (Current)</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Select Instructor</label>
                      <select required value={assignInst} onChange={e => setAssignInst(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                        <option value="" disabled>Choose Instructor...</option>
                        {instructors.map(inst => (
                          <option key={inst._id} value={inst.name}>{inst.name} ({inst.specialty})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>Confirm</button>
                      <button type="button" onClick={() => setSelectedStudent(null)} className="glass-panel" style={{ flex: 1, padding: '12px', border: 'none' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'instructors' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem' }}>Instructors Management</h2>

            {/* Instructor Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                {editingInstId ? 'Edit Instructor' : 'Add New Instructor'}
              </h3>
              {instFormSuccess && <p style={{ color: '#2ecc71', marginBottom: '1rem' }}>{instFormSuccess}</p>}
              {instFormError && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{instFormError}</p>}

              <form onSubmit={handleAddOrUpdateInstructor} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Instructor Name *</label>
                    <input type="text" placeholder="e.g. Ustadh Ahmed" value={newInstName} onChange={e => setNewInstName(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Specialty / Role</label>
                    <input type="text" placeholder="e.g. Grammar & Morphology" value={newInstSpec} onChange={e => setNewInstSpec(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>About / Description</label>
                  <textarea placeholder="Experienced Arabic language instructor specializing in grammar and morphology." value={newInstAbout} onChange={e => setNewInstAbout(e.target.value)} rows="3" style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Profile Picture (File Upload)</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} style={{ color: '#e0e0e0', padding: '8px 0' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> {editingInstId ? 'Update Instructor' : 'Add Instructor'}
                  </button>
                  {editingInstId && (
                    <button type="button" onClick={handleCancelEditInstructor} className="glass-panel" style={{ padding: '12px 20px', border: 'none', color: '#e0e0e0' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Picture</th>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>About / Specialty</th>
                    <th style={tableHeaderStyle}>Active Slots / Students</th>
                    <th style={tableHeaderStyle}>Total Students</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {instructors.map(inst => (
                    <tr key={inst._id || inst.id}>
                      <td style={tableCellStyle}>
                        <img src={getAvatarUrl(inst.avatar, inst.name)} alt={inst.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', background: 'var(--color-bg-dark)' }} />
                      </td>
                      <td style={tableCellStyle}><strong>{inst.name}</strong></td>
                      <td style={tableCellStyle}>
                        <div>{inst.about || inst.specialty || '-'}</div>
                        {inst.specialty && inst.about && inst.specialty !== inst.about && (
                          <div style={{ color: 'var(--color-primary)', fontSize: '0.8rem' }}>{inst.specialty}</div>
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                          {inst.students && inst.students.length > 0 ? (
                            inst.students.map((s, idx) => (
                              <span key={idx} style={{ color: '#b0c4c6' }}>
                                • {s.slot}: {s.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#666' }}>No active assignments</span>
                          )}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{inst.total_students || 0}</td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditInstructorClick(inst)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>Edit</button>
                          <button onClick={() => handleDeleteInstructor(inst._id || inst.id)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#e74c3c', border: '1px solid #e74c3c' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Modules / Arabic Levels</h2>

            {/* Module Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                {editingModId ? 'Edit Module' : 'Add New Module'}
              </h3>
              {modFormSuccess && <p style={{ color: '#2ecc71', marginBottom: '1rem' }}>{modFormSuccess}</p>}
              {modFormError && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{modFormError}</p>}

              <form onSubmit={handleAddOrUpdateModule} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: '220px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Module / Level Name *</label>
                    <input type="text" placeholder="e.g. A1 or Arabic for Quran" value={modName} onChange={e => setModName(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Display Order</label>
                    <input type="number" min="1" placeholder="1" value={modOrder} onChange={e => setModOrder(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: '100%' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Description / About *</label>
                  <textarea placeholder="Beginner Arabic level designed for students starting their learning journey." value={modDesc} onChange={e => setModDesc(e.target.value)} required rows="3" style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Optional Module Image/Icon (File Upload)</label>
                  <input ref={modFileInputRef} type="file" accept="image/*" onChange={e => setModFile(e.target.files[0])} style={{ color: '#e0e0e0', padding: '8px 0' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> {editingModId ? 'Update Module' : 'Add Module'}
                  </button>
                  {editingModId && (
                    <button type="button" onClick={handleCancelEditModule} className="glass-panel" style={{ padding: '12px 20px', border: 'none', color: '#e0e0e0' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Order</th>
                    <th style={tableHeaderStyle}>Icon/Image</th>
                    <th style={tableHeaderStyle}>Module Name</th>
                    <th style={tableHeaderStyle}>Description</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map(mod => {
                    const modTitle = mod.name || mod.title || 'Module';
                    return (
                      <tr key={mod._id || mod.id}>
                        <td style={tableCellStyle}><strong>#{mod.order || 1}</strong></td>
                        <td style={tableCellStyle}>
                          {mod.image ? (
                            <img src={getAvatarUrl(mod.image, modTitle)} alt={modTitle} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-primary)', color: 'var(--color-bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                              {modTitle.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={tableCellStyle}><strong>{modTitle}</strong></td>
                        <td style={tableCellStyle}>{mod.description || '-'}</td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEditModuleClick(mod)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>Edit</button>
                            <button onClick={() => handleDeleteModule(mod._id || mod.id)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#e74c3c', border: '1px solid #e74c3c' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'slots' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem' }}>Class Slots Management</h2>

            {/* Slot Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                {editingSlotId ? 'Edit Class Slot' : 'Add New Class Slot'}
              </h3>
              {slotFormSuccess && <p style={{ color: '#2ecc71', marginBottom: '1rem' }}>{slotFormSuccess}</p>}
              {slotFormError && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{slotFormError}</p>}

              <form onSubmit={handleAddOrUpdateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Day(s) *</label>
                    <input type="text" placeholder="e.g. Monday & Wednesday" value={slotDays} onChange={e => setSlotDays(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Time *</label>
                    <input type="text" placeholder="e.g. 6:00 PM" value={slotTime} onChange={e => setSlotTime(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Status *</label>
                    <select value={slotStatus} onChange={e => setSlotStatus(e.target.value)} style={{ ...inputStyle, width: '100%', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> {editingSlotId ? 'Update Slot' : 'Add Slot'}
                  </button>
                  {editingSlotId && (
                    <button type="button" onClick={handleCancelEditSlot} className="glass-panel" style={{ padding: '12px 20px', border: 'none', color: '#e0e0e0' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Days</th>
                    <th style={tableHeaderStyle}>Time</th>
                    <th style={tableHeaderStyle}>Full Slot String</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(s => (
                    <tr key={s._id || s.id}>
                      <td style={tableCellStyle}><strong>{s.days}</strong></td>
                      <td style={tableCellStyle}>{s.time}</td>
                      <td style={tableCellStyle}><span style={{ color: 'var(--color-primary)' }}>{s.days} — {s.time}</span></td>
                      <td style={tableCellStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          background: s.status === 'Active' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                          color: s.status === 'Active' ? '#2ecc71' : '#e74c3c'
                        }}>{s.status || 'Active'}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditSlotClick(s)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>Edit</button>
                          <button onClick={() => handleDeleteSlot(s._id || s.id)} className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#e74c3c', border: '1px solid #e74c3c' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Contact Messages</h2>
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Sender Name</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Message</th>
                    <th style={tableHeaderStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c._id}>
                      <td style={tableCellStyle}>{c.first_name} {c.last_name}</td>
                      <td style={tableCellStyle}>{c.email}</td>
                      <td style={tableCellStyle}>{c.message}</td>
                      <td style={tableCellStyle}>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
