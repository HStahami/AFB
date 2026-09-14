import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, LogOut, Bell, CheckCircle2 } from 'lucide-react';
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
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

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

  // Assign & Profile View modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
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

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/`, { headers });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setNotifications(list);
        setUnreadNotifsCount(list.filter(n => !n.is_read).length);
      }
    } catch (e) { console.error(e); }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'PATCH', headers });
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const handleMarkSingleNotifRead = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH', headers });
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
    fetchInstructors();
    fetchSlots();
    fetchNotifications();

    const notifTimer = setInterval(fetchNotifications, 25000);

    if (activeTab === 'admissions') fetchAdmissions();
    if (activeTab === 'students') { fetchStudents(); fetchInstructors(); fetchSlots(); }
    if (activeTab === 'instructors') fetchInstructors();
    if (activeTab === 'modules') fetchModules();
    if (activeTab === 'slots') fetchSlots();
    if (activeTab === 'contacts') fetchContacts();
    if (activeTab === 'notifications') fetchNotifications();

    return () => clearInterval(notifTimer);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            className="glass-panel" 
            style={{ padding: '6px 10px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', color: unreadNotifsCount > 0 ? 'var(--color-primary)' : '#aaa', fontSize: '0.85rem' }} 
            onClick={() => setActiveTab('notifications')}
            title="Notifications"
          >
            <Bell size={15} />
            {unreadNotifsCount > 0 && (
              <span style={{ background: '#e74c3c', color: '#fff', borderRadius: '10px', padding: '1px 5px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                {unreadNotifsCount}
              </span>
            )}
          </button>
          <button className="glass-panel" style={{ padding: '6px 12px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ff6b6b', fontSize: '0.85rem' }} onClick={onLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Tab Navigation */}
      <div className="admin-mobile-tab-bar no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'notifications', label: unreadNotifsCount > 0 ? `Alerts (${unreadNotifsCount})` : 'Alerts' },
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
        <button 
          className={activeTab === 'notifications' ? 'btn-primary' : 'glass-panel'} 
          style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} 
          onClick={() => setActiveTab('notifications')}
        >
          <span>Notifications</span>
          {unreadNotifsCount > 0 && (
            <span style={{ background: '#e74c3c', color: '#fff', padding: '2px 7px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold' }}>
              {unreadNotifsCount}
            </span>
          )}
        </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.6rem' }}>Student Admissions & Fee Lifecycle</h2>
                <p style={{ color: '#aaa', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                  Review applications, verify fee submissions, and approve admissions to provision portal accounts.
                </p>
              </div>
            </div>

            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Applicant</th>
                    <th style={tableHeaderStyle}>Contact Details</th>
                    <th style={tableHeaderStyle}>Course</th>
                    <th style={tableHeaderStyle}>Fee & Lifecycle Status</th>
                    <th style={tableHeaderStyle}>Application Date</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map(adm => {
                    const isApproved = adm.status === 'Approved';
                    const isCanceled = adm.status === 'Canceled';
                    const feeSent = adm.fee_instructions_sent || adm.status === 'Fee Email Sent';

                    return (
                      <tr key={adm._id}>
                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: '600', color: '#fff' }}>
                            {adm.first_name} {adm.last_name}
                          </div>
                          {adm.student_code && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                              ID: {adm.student_code}
                            </div>
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ fontSize: '0.85rem' }}>{adm.email}</div>
                          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{adm.phone}</div>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: '500' }}>
                            {adm.course || 'Modern Standard Arabic'}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              background: isApproved ? 'rgba(46, 204, 113, 0.2)' : isCanceled ? 'rgba(231, 76, 60, 0.2)' : 'rgba(243, 156, 18, 0.2)',
                              color: isApproved ? '#2ecc71' : isCanceled ? '#e74c3c' : '#f39c12'
                            }}>
                              {adm.status}
                            </span>
                            {feeSent && (
                              <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                Fee Instructions Sent
                              </span>
                            )}
                            {isApproved && adm.credentials_delivered && (
                              <span style={{ fontSize: '0.72rem', color: '#2ecc71' }}>
                                Credentials Delivered
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ fontSize: '0.82rem', color: '#888' }}>
                            {adm.created_at ? new Date(adm.created_at).toLocaleDateString() : '—'}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {!isApproved && !isCanceled && (
                              <>
                                <button
                                  onClick={() => handleApprove(adm._id)}
                                  className="btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.82rem', background: '#2e7d32', borderColor: '#2e7d32', cursor: 'pointer' }}
                                  title="Confirm fee payment & dispatch portal credentials"
                                >
                                  Approve & Provision
                                </button>
                                <button
                                  onClick={() => handleSendFeeEmail(adm._id)}
                                  className="glass-panel"
                                  style={{ padding: '6px 10px', fontSize: '0.82rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)', cursor: 'pointer' }}
                                  title="Resend fee payment instructions email"
                                >
                                  Resend Fee Info
                                </button>
                                <button
                                  onClick={() => handleCancel(adm._id)}
                                  className="glass-panel"
                                  style={{ padding: '6px 10px', fontSize: '0.82rem', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.4)', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {isApproved && (
                              <button
                                onClick={() => setActiveTab('students')}
                                className="glass-panel"
                                style={{ padding: '6px 10px', fontSize: '0.82rem', color: 'var(--color-primary)', borderColor: 'var(--color-primary)', cursor: 'pointer' }}
                              >
                                View in Students
                              </button>
                            )}
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

        {activeTab === 'students' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Active Students</h2>
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Student ID</th>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Email / Phone</th>
                    <th style={tableHeaderStyle}>Course Preferences</th>
                    <th style={tableHeaderStyle}>Assigned Class</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(std => (
                    <tr key={std._id}>
                      <td style={tableCellStyle}>
                        <span style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                          {std.student_code || 'PENDING'}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{std.first_name} {std.last_name || std.name || ''}</div>
                        {std.city && std.country && (
                          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>{std.city}, {std.country}</div>
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ fontSize: '0.85rem' }}>{std.email}</div>
                        <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{std.phone || 'No phone'}</div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: '600', color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                          {std.course || std.preferred_course || 'Modern Standard Arabic'}
                        </div>
                        {(std.selected_module || std.module) && (
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                            Track: {std.selected_module || std.module}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {std.preferred_days || 'Weekdays'} • {std.preferred_class_type || '1 on 1'}
                        </div>
                        {std.preferred_time_slot && (
                          <div style={{ fontSize: '0.72rem', color: '#f39c12' }} title="Suggested Slot">
                            Suggested: {std.preferred_time_slot}
                          </div>
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ fontSize: '0.85rem', color: std.slot ? '#fff' : '#777' }}>
                          {std.slot || 'No Slot'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: std.instructor ? 'var(--color-primary)' : '#777' }}>
                          {std.instructor ? std.instructor : 'Unassigned'}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setViewingStudent(std)}
                            className="glass-panel"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', border: '1px solid rgba(197, 229, 232, 0.25)', color: 'var(--color-primary)', cursor: 'pointer' }}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(std);
                              setAssignSlot(std.slot || '');
                              setAssignInst(std.instructor || '');
                            }}
                            className="btn-primary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Assign/Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Assign Modal Overlay */}
            {selectedStudent && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3 style={{ color: 'var(--color-white)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Assign Class Details</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Student: <strong style={{ color: '#fff' }}>{selectedStudent.first_name} {selectedStudent.last_name || selectedStudent.name || ''}</strong> ({selectedStudent.student_code || 'ID Pending'})
                  </p>

                  {/* Student's Saved Preferences Notice for Admin */}
                  <div style={{ backgroundColor: 'rgba(197, 229, 232, 0.08)', border: '1px solid rgba(197, 229, 232, 0.2)', borderRadius: '8px', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#b0c4c6' }}>
                    <div style={{ fontWeight: '700', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>Student's Saved Preferences:</div>
                    <div>• <strong>Course:</strong> {selectedStudent.course || selectedStudent.preferred_course || 'Modern Standard Arabic'}</div>
                    {(selectedStudent.selected_module || selectedStudent.module) && (
                      <div>• <strong>Module / Track:</strong> {selectedStudent.selected_module || selectedStudent.module}</div>
                    )}
                    <div>• <strong>Format:</strong> {selectedStudent.preferred_days || 'Weekdays'} ({selectedStudent.preferred_class_type || '1 on 1'})</div>
                    <div>• <strong>Suggested Time:</strong> <span style={{ color: '#f39c12', fontWeight: '600' }}>{selectedStudent.preferred_time_slot || 'Not specified'}</span></div>
                  </div>

                  <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Assign Class Slot *</label>
                      <select required value={assignSlot} onChange={e => setAssignSlot(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.9rem' }}>
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
                      <label style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Assign Instructor *</label>
                      <select required value={assignInst} onChange={e => setAssignInst(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.9rem' }}>
                        <option value="" disabled>Choose Instructor...</option>
                        {instructors.map(inst => (
                          <option key={inst._id} value={inst.name}>{inst.name} ({inst.specialty})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>Confirm Assignment</button>
                      <button type="button" onClick={() => setSelectedStudent(null)} className="glass-panel" style={{ flex: 1, padding: '10px', border: 'none', color: '#cbd5e1' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* View Full Student Profile Modal */}
            {viewingStudent && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ color: 'var(--color-white)', fontSize: '1.35rem', fontWeight: 700 }}>
                        {viewingStudent.first_name} {viewingStudent.last_name || viewingStudent.name || ''}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        Student ID: {viewingStudent.student_code || 'PENDING'} • Status: {viewingStudent.status || 'Active'}
                      </div>
                    </div>
                    <button
                      onClick={() => setViewingStudent(null)}
                      className="glass-panel"
                      style={{ padding: '6px 12px', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      Close
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.88rem', color: '#b0c4c6' }}>
                    {/* Contact & Personal */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.92rem' }}>Personal & Contact Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        <div><strong style={{ color: '#fff' }}>Email:</strong> {viewingStudent.email || 'N/A'}</div>
                        <div><strong style={{ color: '#fff' }}>Phone:</strong> {viewingStudent.phone || 'N/A'}</div>
                        <div><strong style={{ color: '#fff' }}>Date of Birth:</strong> {viewingStudent.date_of_birth ? viewingStudent.date_of_birth.substring(0, 10) : 'N/A'}</div>
                        <div><strong style={{ color: '#fff' }}>Education:</strong> {viewingStudent.education || 'N/A'}</div>
                        <div><strong style={{ color: '#fff' }}>Country:</strong> {viewingStudent.country || 'N/A'}</div>
                        <div><strong style={{ color: '#fff' }}>City:</strong> {viewingStudent.city || 'N/A'}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#fff' }}>Address:</strong> {viewingStudent.address || 'N/A'}</div>
                        <div><strong style={{ color: '#fff' }}>Referral Source:</strong> {viewingStudent.referral_source || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Guardian Info */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.92rem' }}>Father / Guardian Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        <div><strong style={{ color: '#fff' }}>Father / Guardian Name:</strong> {viewingStudent.guardian_name || viewingStudent.father_name || 'Not provided'}</div>
                        <div><strong style={{ color: '#fff' }}>Father / Guardian Phone:</strong> {viewingStudent.guardian_phone || viewingStudent.father_phone || 'Not provided'}</div>
                      </div>
                    </div>

                    {/* Course & Preferences */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.92rem' }}>Course & Class Preferences</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        <div><strong style={{ color: '#fff' }}>Selected Course:</strong> {viewingStudent.course || viewingStudent.preferred_course || 'Modern Standard Arabic'}</div>
                        <div><strong style={{ color: '#fff' }}>Module / Track:</strong> {viewingStudent.selected_module || viewingStudent.module || 'All 4 Modules Included'}</div>
                        <div><strong style={{ color: '#fff' }}>Preferred Days:</strong> {viewingStudent.preferred_days || 'Weekdays'}</div>
                        <div><strong style={{ color: '#fff' }}>Class Type:</strong> {viewingStudent.preferred_class_type || '1 on 1'}</div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <strong style={{ color: '#fff' }}>Suggested Time Slot:</strong> <span style={{ color: '#f39c12', fontWeight: 600 }}>{viewingStudent.preferred_time_slot || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned LMS Class */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.92rem' }}>Current Class Assignment</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        <div><strong style={{ color: '#fff' }}>Assigned Slot:</strong> {viewingStudent.slot || 'Not Assigned'}</div>
                        <div><strong style={{ color: '#fff' }}>Assigned Instructor:</strong> {viewingStudent.instructor || 'Not Assigned'}</div>
                      </div>
                    </div>

                    {/* Bio */}
                    {viewingStudent.bio && (
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.92rem' }}>Academic Bio & Goals</div>
                        <div style={{ color: '#e0e0e0', lineHeight: '1.5' }}>{viewingStudent.bio}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
                    <button
                      onClick={() => {
                        const s = viewingStudent;
                        setViewingStudent(null);
                        setSelectedStudent(s);
                        setAssignSlot(s.slot || '');
                        setAssignInst(s.instructor || '');
                      }}
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                    >
                      Assign Slot / Instructor
                    </button>
                    <button
                      onClick={() => setViewingStudent(null)}
                      className="glass-panel"
                      style={{ padding: '8px 16px', border: 'none', color: '#cbd5e1' }}
                    >
                      Close
                    </button>
                  </div>
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

        {activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.6rem' }}>Live System Alerts & Notifications</h2>
                <p style={{ color: '#aaa', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                  Real-time notifications for student profile completions, registrations, and updates.
                </p>
              </div>
              {unreadNotifsCount > 0 && (
                <button
                  onClick={handleMarkAllNotifsRead}
                  className="glass-panel"
                  style={{ padding: '8px 16px', color: 'var(--color-primary)', borderColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <CheckCircle2 size={16} /> Mark All as Read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#888' }}>
                <Bell size={44} style={{ margin: '0 auto 1rem auto', opacity: 0.35, color: 'var(--color-primary)' }} />
                <p style={{ fontSize: '1.15rem', color: '#e0e0e0', margin: 0, fontWeight: '500' }}>No notifications yet</p>
                <p style={{ fontSize: '0.88rem', marginTop: '0.5rem', color: '#888' }}>
                  When a student completes their profile or registers, instant alerts will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notifications.map((notif) => {
                  const isUnread = !notif.is_read;
                  const isProfileCompleted = notif.notification_type === 'student_profile_completed';
                  return (
                    <div
                      key={notif._id || notif.id}
                      className="glass-panel"
                      style={{
                        padding: '1.25rem 1.5rem',
                        borderLeft: isUnread ? '4px solid var(--color-primary)' : '4px solid rgba(255,255,255,0.1)',
                        background: isUnread ? 'rgba(0, 168, 150, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isUnread ? 'rgba(0, 168, 150, 0.25)' : 'rgba(255,255,255,0.1)',
                            color: isUnread ? 'var(--color-primary)' : '#aaa'
                          }}>
                            {isProfileCompleted ? 'Profile Completed' : (notif.notification_type || 'Alert')}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#777' }}>
                            {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                          </span>
                          {isUnread && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} title="Unread" />
                          )}
                        </div>
                        <h4 style={{ color: 'var(--color-white)', margin: '0 0 0.4rem 0', fontSize: '1.05rem', fontWeight: '600' }}>
                          {notif.title}
                        </h4>
                        <p style={{ color: '#ccc', margin: 0, fontSize: '0.92rem', lineHeight: '1.4' }}>
                          {notif.message}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {isProfileCompleted && (
                          <button
                            onClick={() => {
                              setActiveTab('students');
                              if (notif.related_entity_id) {
                                const found = students.find(s => String(s._id) === String(notif.related_entity_id));
                                if (found) setViewingStudent(found);
                              }
                            }}
                            className="glass-panel"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--color-primary)', borderColor: 'var(--color-primary)', cursor: 'pointer' }}
                          >
                            View Student Profile
                          </button>
                        )}
                        {isUnread && (
                          <button
                            onClick={() => handleMarkSingleNotifRead(notif._id || notif.id)}
                            className="glass-panel"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#aaa', cursor: 'pointer' }}
                            title="Mark as read"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
