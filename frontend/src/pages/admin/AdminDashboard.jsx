import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, LogOut, Bell, CheckCircle2, Megaphone, Shield, MessageSquare, Send, RefreshCw, Mail, Award, Search, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE, getAvatarUrl } from '../../api/client';
import { inputStyle } from '../../components/common/styles';
import { notificationsApi, messagesApi, studentsApi } from '../../api';

export function AdminDashboard({ onLogout }) {
  const { user: authUser } = useAuth();
  const isCurrentSystemAdmin = authUser?.is_system_admin === true || authUser?.username === 'admin';
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, canceled: 0, total_students: 0, total_instructors: 0, total_modules: 0, graduated_students: 0, dropout_students: 0 });
  const [admissions, setAdmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentFilter, setStudentFilter] = useState('active'); // 'active', 'all', 'graduated', 'dropout'
  const [studentSearch, setStudentSearch] = useState('');
  const [instructors, setInstructors] = useState([]);
  const [modules, setModules] = useState([]);
  const [slots, setSlots] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Instructor Form State
  const [newInstName, setNewInstName] = useState('');
  const [newInstEmail, setNewInstEmail] = useState('');
  const [newInstAbout, setNewInstAbout] = useState('');
  const [newInstSpec, setNewInstSpec] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingInstId, setEditingInstId] = useState(null);
  const [instFormSuccess, setInstFormSuccess] = useState('');
  const [instFormError, setInstFormError] = useState('');
  const [resendingInstId, setResendingInstId] = useState(null);
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

  // Admin Management State
  const [admins, setAdmins] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [adminFormSuccess, setAdminFormSuccess] = useState('');
  const [adminFormError, setAdminFormError] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [changePwdAdmin, setChangePwdAdmin] = useState(null);
  const [resetPwdInput, setResetPwdInput] = useState('');
  const [resetPwdConfirm, setResetPwdConfirm] = useState('');
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetPwdError, setResetPwdError] = useState('');
  const [resetPwdSuccess, setResetPwdSuccess] = useState('');

  // Announcements Broadcast State
  const [bcTitle, setBcTitle] = useState('');
  const [bcMessage, setBcMessage] = useState('');
  const [bcTargetRole, setBcTargetRole] = useState('all');
  const [bcTargetUser, setBcTargetUser] = useState('');
  const [bcSending, setBcSending] = useState(false);
  const [bcSuccess, setBcSuccess] = useState('');
  const [bcError, setBcError] = useState('');

  // Chat Audit State
  const [auditThreads, setAuditThreads] = useState([]);
  const [auditActiveThread, setAuditActiveThread] = useState(null);
  const [auditMessages, setAuditMessages] = useState([]);
  const [loadingAuditThreads, setLoadingAuditThreads] = useState(false);
  const [loadingAuditHistory, setLoadingAuditHistory] = useState(false);

  // Assign & Profile View modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [admissionFilter, setAdmissionFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false); // 'all', 'pending', 'approved', 'canceled'
  const [editingStudent, setEditingStudent] = useState(null);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [editStudentError, setEditStudentError] = useState('');
  const [editStudentSuccess, setEditStudentSuccess] = useState('');
  const [assignSlot, setAssignSlot] = useState('');
  const [assignInst, setAssignInst] = useState('');

  // Graduates & Dropouts State
  const [graduatesSearch, setGraduatesSearch] = useState('');
  const [dropoutsSearch, setDropoutsSearch] = useState('');
  const [graduatingStudent, setGraduatingStudent] = useState(null);
  const [graduateForm, setGraduateForm] = useState({
    graduation_date: new Date().toISOString().split('T')[0],
    final_grade: 'A',
    final_score: '90%',
    graduation_course: '',
    graduation_remarks: 'Completed program successfully with distinction.',
  });
  const [isSubmittingGraduate, setIsSubmittingGraduate] = useState(false);

  const [droppingStudent, setDroppingStudent] = useState(null);
  const [dropoutForm, setDropoutForm] = useState({
    dropped_at: new Date().toISOString().split('T')[0],
    dropout_reason: 'Time constraints / Schedule conflict',
    dropout_remarks: '',
  });
  const [isSubmittingDropout, setIsSubmittingDropout] = useState(false);

  const isStudentGraduated = (s) => ['Graduated', 'graduated'].includes(s?.status);
  const isStudentDropout = (s) => ['Cancelled', 'cancelled', 'Dropout', 'dropout'].includes(s?.status);
  const isStudentActive = (s) => !isStudentGraduated(s) && !isStudentDropout(s);

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBcSending(true);
    setBcSuccess('');
    setBcError('');
    try {
      await notificationsApi.broadcast({
        title: bcTitle,
        message: bcMessage,
        target_role: bcTargetRole,
        target_user_id: bcTargetRole === 'specific' ? bcTargetUser : null,
      });
      setBcSuccess('Announcement successfully broadcasted!');
      setBcTitle('');
      setBcMessage('');
      setBcTargetUser('');
    } catch (err) {
      console.error(err);
      setBcError(err.message || 'Failed to send broadcast announcement');
    } finally {
      setBcSending(false);
    }
  };

  const fetchAuditThreads = async () => {
    setLoadingAuditThreads(true);
    try {
      const data = await messagesApi.getThreads();
      const list = Array.isArray(data) ? data : [];
      setAuditThreads(list);
      if (list.length > 0 && !auditActiveThread) {
        const first = list[0];
        const firstId = first.thread_id || first._id || first.id;
        setAuditActiveThread(first);
        if (firstId) void fetchAuditHistory(firstId);
      }
    } catch (err) {
      console.error("Error fetching audit threads:", err);
    } finally {
      setLoadingAuditThreads(false);
    }
  };

  const fetchAuditHistory = async (threadId) => {
    if (!threadId) return;
    setLoadingAuditHistory(true);
    try {
      const msgs = await messagesApi.getHistory(threadId);
      setAuditMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error("Error fetching audit history:", err);
    } finally {
      setLoadingAuditHistory(false);
    }
  };

  const handleSelectAuditThread = (thread) => {
    const threadId = thread.thread_id || thread._id || thread.id;
    setAuditActiveThread(thread);
    if (threadId) void fetchAuditHistory(threadId);
  };

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
      void fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const handleMarkSingleNotifRead = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH', headers });
      void fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE}/admins`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAdmins(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch admins:', e);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminFormError('');
    setAdminFormSuccess('');

    if (!newAdminUsername.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setAdminFormError('Please fill in all required fields.');
      return;
    }

    if (newAdminPassword !== newAdminConfirmPassword) {
      setAdminFormError('Passwords do not match.');
      return;
    }

    if (newAdminPassword.length < 6) {
      setAdminFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const res = await fetch(`${API_BASE}/admins`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: newAdminUsername.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword.trim(),
          full_name: newAdminFullName.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create administrator account.');
      }

      setAdminFormSuccess(`Administrator '${newAdminUsername}' created successfully!`);
      setNewAdminUsername('');
      setNewAdminEmail('');
      setNewAdminFullName('');
      setNewAdminPassword('');
      setNewAdminConfirmPassword('');
      void fetchAdmins();
      setTimeout(() => {
        setShowAddAdminModal(false);
        setAdminFormSuccess('');
      }, 1500);
    } catch (err) {
      setAdminFormError(err.message || 'Error creating administrator account.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleOpenPasswordModal = (adm) => {
    setChangePwdAdmin(adm);
    setResetPwdInput('');
    setResetPwdConfirm('');
    setResetPwdError('');
    setResetPwdSuccess('');
  };

  const handleResetAdminPassword = async (e) => {
    e.preventDefault();
    if (!resetPwdInput || resetPwdInput.length < 6) {
      setResetPwdError('Password must be at least 6 characters long.');
      return;
    }
    if (resetPwdInput !== resetPwdConfirm) {
      setResetPwdError('Passwords do not match.');
      return;
    }

    setResetPwdLoading(true);
    setResetPwdError('');
    setResetPwdSuccess('');

    try {
      const res = await fetch(`${API_BASE}/admins/${changePwdAdmin._id || changePwdAdmin.id}/password`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ new_password: resetPwdInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update administrator password.');
      }
      setResetPwdSuccess('Password updated successfully!');
      setTimeout(() => {
        setChangePwdAdmin(null);
        setResetPwdInput('');
        setResetPwdConfirm('');
        setResetPwdSuccess('');
      }, 1400);
    } catch (err) {
      setResetPwdError(err.message || 'Failed to update administrator password.');
    } finally {
      setResetPwdLoading(false);
    }
  };

  const handleToggleAdminStatus = async (adminId, _adminUsername) => {
    try {
      const res = await fetch(`${API_BASE}/admins/${adminId}/toggle-status`, {
        method: 'PATCH',
        headers
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || 'Failed to update administrator status.');
        return;
      }
      await fetchAdmins();
    } catch {
      alert('Error updating administrator status.');
    }
  };

  const handleDeleteAdmin = async (adminId, adminUsername) => {
    if (!window.confirm(`Are you sure you want to permanently delete administrator '${adminUsername}'? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admins/${adminId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || 'Failed to delete administrator account.');
        return;
      }
      await fetchAdmins();
    } catch {
      alert('Error deleting administrator account.');
    }
  };


  const handleStartEditStudent = (std) => {
    setEditingStudent({
      _id: std._id || std.id,
      student_code: std.student_code || '',
      first_name: std.first_name || '',
      last_name: std.last_name || '',
      email: std.email || '',
      phone: std.phone || '',
      guardian_name: std.guardian_name || std.father_name || '',
      guardian_phone: std.guardian_phone || std.father_phone || '',
      date_of_birth: std.date_of_birth ? std.date_of_birth.substring(0, 10) : '',
      country: std.country || '',
      city: std.city || '',
      address: std.address || '',
      education: std.education || '',
      referral_source: std.referral_source || '',
      course: std.course || std.preferred_course || 'Modern Standard Arabic',
      selected_module: std.selected_module || std.module || 'All 4 Modules Included',
      preferred_days: std.preferred_days || 'Weekdays',
      preferred_class_type: std.preferred_class_type || '1 on 1',
      slot: std.slot || '',
      preferred_time_slot: std.preferred_time_slot || '',
      bio: std.bio || '',
      status: std.status || 'Active',
    });
    setEditStudentError('');
    setEditStudentSuccess('');
  };

  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSavingStudent(true);
    setEditStudentError('');
    setEditStudentSuccess('');
    try {
      const studentId = editingStudent._id;
      const res = await fetch(`${API_BASE}/students/${studentId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(editingStudent)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update student profile.');
      }
      setEditStudentSuccess('Student profile updated successfully!');
      setStudents(prev => prev.map(s => (s._id === studentId || s.id === studentId) ? { ...s, ...data } : s));
      if (viewingStudent && (viewingStudent._id === studentId || viewingStudent.id === studentId)) {
        setViewingStudent(prev => ({ ...prev, ...data, update_requested: false, update_request_note: null }));
      }
      setTimeout(() => {
        setEditingStudent(null);
        setEditStudentSuccess('');
      }, 1200);
    } catch (err) {
      setEditStudentError(err.message || 'Error updating student.');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDismissUpdateRequest = async (studentId) => {
    try {
      const res = await fetch(`${API_BASE}/students/${studentId}/dismiss-update-request`, {
        method: 'PATCH',
        headers
      });
      if (res.ok) {
        if (viewingStudent && (viewingStudent._id === studentId || viewingStudent.id === studentId)) {
          setViewingStudent(prev => prev ? { ...prev, update_requested: false, update_request_note: null } : null);
        }
        await fetchStudents();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error dismissing update request:', err);
    }
  };

  useEffect(() => {
    void fetchStats();
    void fetchInstructors();
    void fetchSlots();
    void fetchNotifications();

    const notifTimer = setInterval(() => { void fetchNotifications(); }, 25000);

    if (activeTab === 'admissions') void fetchAdmissions();
    if (activeTab === 'students' || activeTab === 'graduates' || activeTab === 'dropouts') { 
      void fetchStudents(); 
      void fetchInstructors(); 
      void fetchSlots(); 
    }
    if (activeTab === 'instructors') void fetchInstructors();
    if (activeTab === 'modules') void fetchModules();
    if (activeTab === 'slots') void fetchSlots();
    if (activeTab === 'contacts') void fetchContacts();
    if (activeTab === 'notifications') void fetchNotifications();
    if (activeTab === 'admins') void fetchAdmins();
    if (activeTab === 'announcements') { void fetchStudents(); void fetchInstructors(); }
    if (activeTab === 'chataudit') void fetchAuditThreads();

    return () => clearInterval(notifTimer);
  }, [activeTab]);

  const handleSendFeeEmail = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/send-fee-email`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error();
      alert("Fee email queued!");
      await fetchAdmissions();
    } catch { alert("Failed to send fee email"); }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/approve`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error();
      alert("Admission Approved! Student record created.");
      await fetchAdmissions();
      await fetchStats();
    } catch { alert("Failed to approve"); }
  };

  const handleCancel = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admissions/${id}/cancel`, { method: 'PATCH', headers });
      if (!res.ok) throw new Error();
      alert("Admission Canceled.");
      await fetchAdmissions();
      await fetchStats();
    } catch { alert("Failed to cancel"); }
  };

  const handleOpenGraduateModal = (std) => {
    setGraduatingStudent(std);
    setGraduateForm({
      graduation_date: new Date().toISOString().split('T')[0],
      final_grade: 'A',
      final_score: '90%',
      graduation_course: std.course || std.preferred_course || 'Modern Standard Arabic',
      graduation_remarks: 'Completed program successfully with distinction.',
    });
  };

  const handleGraduateSubmit = async (e) => {
    e.preventDefault();
    if (!graduatingStudent) return;
    setIsSubmittingGraduate(true);
    try {
      const studentId = graduatingStudent._id || graduatingStudent.id;
      await studentsApi.graduate(studentId, graduateForm);
      alert(`Student ${graduatingStudent.first_name} ${graduatingStudent.last_name || ''} has been marked as Graduated!`);
      setGraduatingStudent(null);
      await fetchStudents();
      await fetchStats();
      if (viewingStudent && (String(viewingStudent._id) === String(studentId) || String(viewingStudent.id) === String(studentId))) {
        setViewingStudent(prev => ({
          ...prev,
          status: 'Graduated',
          ...graduateForm,
          graduated_at: graduateForm.graduation_date,
        }));
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to mark student as graduated');
    } finally {
      setIsSubmittingGraduate(false);
    }
  };

  const handleOpenDropoutModal = (std) => {
    setDroppingStudent(std);
    setDropoutForm({
      dropped_at: new Date().toISOString().split('T')[0],
      dropout_reason: 'Time constraints / Schedule conflict',
      dropout_remarks: '',
    });
  };

  const handleDropoutSubmit = async (e) => {
    e.preventDefault();
    if (!droppingStudent) return;
    setIsSubmittingDropout(true);
    try {
      const studentId = droppingStudent._id || droppingStudent.id;
      await studentsApi.dropout(studentId, dropoutForm);
      alert(`Student ${droppingStudent.first_name} ${droppingStudent.last_name || ''} has been marked as Dropout. Portal login revoked.`);
      setDroppingStudent(null);
      await fetchStudents();
      await fetchStats();
      if (viewingStudent && (String(viewingStudent._id) === String(studentId) || String(viewingStudent.id) === String(studentId))) {
        setViewingStudent(prev => ({
          ...prev,
          status: 'Dropout',
          ...dropoutForm,
        }));
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to mark student as dropout');
    } finally {
      setIsSubmittingDropout(false);
    }
  };

  const handleReactivateStudent = async (id, name) => {
    if (!confirm(`Are you sure you want to reactivate admission for ${name || 'this student'}?`)) return;
    try {
      await studentsApi.reactivate(id);
      alert("Student admission has been reactivated to Active status.");
      await fetchStudents();
      await fetchStats();
      if (viewingStudent && (String(viewingStudent._id) === String(id) || String(viewingStudent.id) === String(id))) {
        setViewingStudent(prev => ({ ...prev, status: 'Active' }));
      }
    } catch { alert("Failed to reactivate student"); }
  };

  const handleAddOrUpdateInstructor = async (e) => {
    e.preventDefault();
    setInstFormSuccess('');
    setInstFormError('');

    if (!newInstName.trim()) {
      setInstFormError('Instructor Name is required.');
      return;
    }

    if (!newInstEmail.trim() || !newInstEmail.includes('@')) {
      setInstFormError('A valid Instructor Email is required to provision their portal account.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newInstName.trim());
      formData.append('email', newInstEmail.trim().toLowerCase());
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to save instructor.");
      }

      setInstFormSuccess(
        editingInstId 
          ? "Instructor updated successfully!" 
          : "Instructor added successfully! Login credentials have been dispatched to their email."
      );
      setNewInstName('');
      setNewInstEmail('');
      setNewInstAbout('');
      setNewInstSpec('');
      setSelectedFile(null);
      setEditingInstId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchInstructors();
      await fetchStats();
    } catch (e) {
      console.error(e);
      setInstFormError(e.message || "Failed to save instructor. Please try again.");
    }
  };

  const handleEditInstructorClick = (inst) => {
    setEditingInstId(inst._id || inst.id);
    setNewInstName(inst.name || '');
    setNewInstEmail(inst.email || '');
    setNewInstAbout(inst.about || inst.specialty || '');
    setNewInstSpec(inst.specialty || inst.about || '');
    setSelectedFile(null);
    setInstFormSuccess('');
    setInstFormError('');
  };

  const handleCancelEditInstructor = () => {
    setEditingInstId(null);
    setNewInstName('');
    setNewInstEmail('');
    setNewInstAbout('');
    setNewInstSpec('');
    setSelectedFile(null);
    setInstFormSuccess('');
    setInstFormError('');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResendInstructorCredentials = async (instId, instName, instEmail) => {
    if (!confirm(`Are you sure you want to resend login credentials to ${instName} (${instEmail || 'instructor'})? A new temporary password will be generated and emailed.`)) return;
    setResendingInstId(instId);
    try {
      const res = await fetch(`${API_BASE}/instructors/${instId}/resend-credentials`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to resend credentials.");
      }
      alert(data.message || `Credentials sent successfully to ${instEmail}!`);
    } catch (err) {
      alert(err.message || "Failed to resend credentials.");
    } finally {
      setResendingInstId(null);
    }
  };

  const handleDeleteInstructor = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/instructors/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      await fetchInstructors();
      await fetchStats();
    } catch { alert("Failed to delete instructor"); }
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
      await fetchModules();
      await fetchStats();
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
      await fetchModules();
      await fetchStats();
    } catch { alert("Failed to delete module"); }
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
      await fetchSlots();
      await fetchStats();
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
      await fetchSlots();
      await fetchStats();
    } catch { alert("Failed to delete slot"); }
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
      await fetchStudents();
    } catch { alert("Failed to assign"); }
  };

  const tableStyle = { width: '100%', borderCollapse: 'collapse' };
  const tableHeaderStyle = { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-primary)', textAlign: 'left' };
  const tableCellStyle = { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e0e0e0' };

  const allAdminTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'chataudit', label: 'Chat Audit' },
    { id: 'notifications', label: unreadNotifsCount > 0 ? `Alerts (${unreadNotifsCount})` : 'Alerts' },
    { id: 'admissions', label: 'Admissions' },
    { id: 'students', label: 'Students' },
    { id: 'graduates', label: 'Graduates' },
    { id: 'dropouts', label: 'Dropouts' },
    { id: 'instructors', label: 'Instructors' },
    { id: 'modules', label: 'Modules' },
    { id: 'slots', label: 'Slots' },
    { id: 'contacts', label: 'Messages' },
    { id: 'admins', label: 'Admins' },
  ];

  return (
    <div className="admin-layout" style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '90vh' }}>
      {/* Top Header Bar with Hamburger / Toggle Menu */}
      <div className="admin-top-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.5rem',
        background: 'rgba(7, 34, 36, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(197, 229, 232, 0.2)',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => setSidebarOpen(prev => !prev)}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '8px 16px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
            title={sidebarOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
            aria-label={sidebarOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{sidebarOpen ? '✕' : '☰'}</span>
            <span>{sidebarOpen ? 'Close Menu' : 'Menu'}</span>
          </button>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
            onClick={() => {
              setActiveTab('overview');
              setSidebarOpen(false);
            }}
            title="Go to Overview"
          >
            <h3 style={{ color: 'var(--color-white)', fontWeight: 700, margin: 0, fontSize: '1.25rem' }} className="gradient-text">
              LMS Panel
            </h3>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>•</span>
            <span style={{ color: 'var(--color-primary)', fontSize: '0.95rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {activeTab === 'chataudit' ? 'Chat Audit' : activeTab}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('overview');
              setSidebarOpen(false);
            }}
            style={{
              background: activeTab === 'overview' ? 'var(--color-primary)' : 'rgba(197, 229, 232, 0.08)',
              color: activeTab === 'overview' ? 'var(--color-bg-dark)' : 'var(--color-primary)',
              border: '1px solid rgba(197, 229, 232, 0.25)',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Go to Overview Dashboard"
          >
            Overview
          </button>

          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'rgba(231, 76, 60, 0.12)',
              color: '#ff6b6b',
              border: '1px solid rgba(231, 76, 60, 0.3)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Off-canvas Toggleable Sidebar Drawer */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 499
            }}
          />

          <div
            className="admin-sidebar-drawer"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              maxWidth: '85vw',
              background: '#072224',
              borderRight: '1px solid rgba(197, 229, 232, 0.25)',
              boxShadow: '10px 0 40px rgba(0, 0, 0, 0.9)',
              padding: '1.5rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              zIndex: 500,
              overflowY: 'auto',
              overscrollBehavior: 'contain'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(197, 229, 232, 0.15)' }}>
              <h4 style={{ color: 'var(--color-white)', fontWeight: 'bold', margin: 0, fontSize: '1.15rem' }} className="gradient-text">
                Navigation Menu
              </h4>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="glass-panel"
                style={{ padding: '4px 10px', fontSize: '0.85rem', border: 'none', color: '#aaa', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {allAdminTabs.map(tab => (
              <button
                key={tab.id}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '11px 16px',
                  border: activeTab === tab.id ? '1px solid var(--color-primary)' : '1px solid rgba(197, 229, 232, 0.12)',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  background: activeTab === tab.id ? 'var(--color-primary)' : 'rgba(197, 229, 232, 0.05)',
                  color: activeTab === tab.id ? 'var(--color-bg-dark)' : 'var(--color-primary)',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              className="glass-panel"
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '11px 16px',
                border: 'none',
                marginTop: 'auto',
                color: '#ff6b6b',
                fontSize: '0.9rem',
                borderRadius: '8px',
                background: 'rgba(231, 76, 60, 0.1)',
                cursor: 'pointer'
              }}
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </>
      )}

      {/* Main Admin Content Area - Full width with zero sidebar blockage */}
      <div className="admin-content-area" style={{ flex: 1, padding: '2rem', width: '100%' }}>
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ color: 'var(--color-white)', marginBottom: '1.5rem', fontSize: '1.6rem' }}>Institute Overview</h2>
            <div className="stats-cards-grid">
              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: 'transparent', width: '100%', border: 'none' }}
                onClick={() => { setActiveTab('admissions'); setAdmissionFilter('all'); }}
                title="Click to view all admission forms"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Total Forms</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-white)', margin: 0 }}>{stats.total}</p>
              </button>

              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #f39c12', cursor: 'pointer', background: 'transparent', width: '100%', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
                onClick={() => { setActiveTab('admissions'); setAdmissionFilter('pending'); }}
                title="Click to view pending admissions"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Pending</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#f39c12', margin: 0 }}>{stats.pending}</p>
              </button>

              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #2ecc71', cursor: 'pointer', background: 'transparent', width: '100%', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
                onClick={() => { setActiveTab('admissions'); setAdmissionFilter('approved'); }}
                title="Click to view approved admissions"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Approved</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#2ecc71', margin: 0 }}>{stats.approved}</p>
              </button>

              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #e74c3c', cursor: 'pointer', background: 'transparent', width: '100%', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
                onClick={() => { setActiveTab('admissions'); setAdmissionFilter('canceled'); }}
                title="Click to view canceled admissions"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Canceled</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#e74c3c', margin: 0 }}>{stats.canceled}</p>
              </button>

              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid var(--color-primary)', cursor: 'pointer', background: 'transparent', width: '100%', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
                onClick={() => { setActiveTab('students'); setStudentFilter('active'); }}
                title="Click to view active enrolled students"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Active Students</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0 }}>{stats.total_students}</p>
              </button>

              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #2ecc71', cursor: 'pointer', background: 'transparent', width: '100%', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
                onClick={() => setActiveTab('graduates')}
                title="Click to view all graduated students"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Graduates</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#2ecc71', margin: 0 }}>{stats.graduated_students || 0}</p>
              </button>

              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #e74c3c', cursor: 'pointer', background: 'transparent', width: '100%', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
                onClick={() => setActiveTab('dropouts')}
                title="Click to view all dropout students"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Dropouts</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#e74c3c', margin: 0 }}>{stats.dropout_students || 0}</p>
              </button>

              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid var(--color-accent)', cursor: 'pointer', background: 'transparent', width: '100%', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
                onClick={() => setActiveTab('instructors')}
                title="Click to view active instructors"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Active Instructors</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-accent)', margin: 0 }}>{instructors.length}</p>
              </button>

              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #3498db', cursor: 'pointer', background: 'transparent', width: '100%', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
                onClick={() => setActiveTab('slots')}
                title="Click to view class slots"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Class Slots</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#3498db', margin: 0 }}>{stats.total_slots || slots.length || 0}</p>
              </button>

              <button
                type="button"
                className="glass-panel stat-card-btn"
                style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '4px solid #9b59b6', cursor: 'pointer', background: 'transparent', width: '100%', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
                onClick={() => setActiveTab('modules')}
                title="Click to view modules"
              >
                <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Modules</h4>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#9b59b6', margin: 0 }}>{stats.total_modules || 0}</p>
              </button>
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

            {/* Admission Filter Pill Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All Applications (${admissions.length})` },
                { id: 'pending', label: `Pending Review (${admissions.filter(a => a.status === 'Pending' || a.status === 'Fee Email Sent').length})` },
                { id: 'approved', label: `Approved (${admissions.filter(a => a.status === 'Approved').length})` },
                { id: 'canceled', label: `Canceled (${admissions.filter(a => a.status === 'Canceled').length})` },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAdmissionFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: admissionFilter === f.id ? '700' : '500',
                    cursor: 'pointer',
                    background: admissionFilter === f.id ? 'var(--color-primary)' : 'rgba(197, 229, 232, 0.08)',
                    color: admissionFilter === f.id ? 'var(--color-bg-dark)' : 'var(--color-primary)',
                    border: admissionFilter === f.id ? '1px solid var(--color-primary)' : '1px solid rgba(197, 229, 232, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
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
                  {admissions.filter(adm => {
                    if (admissionFilter === 'pending') return adm.status === 'Pending' || adm.status === 'Fee Email Sent';
                    if (admissionFilter === 'approved') return adm.status === 'Approved';
                    if (admissionFilter === 'canceled') return adm.status === 'Canceled';
                    return true;
                  }).map(adm => {
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.6rem' }}>Students & Enrolled Admissions</h2>
                <p style={{ color: '#aaa', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                  Manage enrolled students, class assignments, and admission status.
                </p>
              </div>

              {/* Search and Filters */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search student, email, ID..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    minWidth: '220px'
                  }}
                />

                <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {[
                    { key: 'active', label: `Active (${students.filter(isStudentActive).length})` },
                    { key: 'all', label: `All (${students.length})` },
                    { key: 'graduated', label: `Graduates (${students.filter(isStudentGraduated).length})` },
                    { key: 'dropout', label: `Dropouts (${students.filter(isStudentDropout).length})` }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setStudentFilter(tab.key)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: studentFilter === tab.key ? 'var(--color-primary)' : 'transparent',
                        color: studentFilter === tab.key ? '#072224' : '#aaa'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Student ID</th>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Email / Phone</th>
                    <th style={tableHeaderStyle}>Course Preferences</th>
                    <th style={tableHeaderStyle}>Assigned Class</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => {
                    if (studentFilter === 'active' && !isStudentActive(s)) return false;
                    if (studentFilter === 'graduated' && !isStudentGraduated(s)) return false;
                    if (studentFilter === 'dropout' && !isStudentDropout(s)) return false;
                    if (studentSearch.trim()) {
                      const q = studentSearch.toLowerCase();
                      const name = `${s.first_name || ''} ${s.last_name || ''} ${s.name || ''}`.toLowerCase();
                      const email = (s.email || '').toLowerCase();
                      const code = (s.student_code || '').toLowerCase();
                      const course = (s.course || s.preferred_course || '').toLowerCase();
                      return name.includes(q) || email.includes(q) || code.includes(q) || course.includes(q);
                    }
                    return true;
                  }).map(std => {
                    const isGrad = isStudentGraduated(std);
                    const isDrop = isStudentDropout(std);
                    const isActive = isStudentActive(std);
                    return (
                      <tr key={std._id || std.id} style={{ opacity: isDrop ? 0.75 : 1 }}>
                        <td style={tableCellStyle}>
                          <span style={{ 
                            fontWeight: '700', 
                            color: isGrad ? '#2ecc71' : isDrop ? '#e74c3c' : 'var(--color-primary)', 
                            fontSize: '0.85rem' 
                          }}>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              background: isGrad ? 'rgba(46, 204, 113, 0.2)' : isDrop ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)',
                              color: isGrad ? '#2ecc71' : isDrop ? '#e74c3c' : '#38bdf8',
                              border: isGrad ? '1px solid rgba(46, 204, 113, 0.3)' : isDrop ? '1px solid rgba(231, 76, 60, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'
                            }}>
                              {std.status || 'Active'}
                            </span>
                            {std.update_requested && (
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                background: 'rgba(243, 156, 18, 0.2)',
                                color: '#f39c12',
                                border: '1px solid rgba(243, 156, 18, 0.4)'
                              }}>
                                Update Requested
                              </span>
                            )}
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
                            {isActive ? (
                              <>
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
                                <button
                                  onClick={() => handleOpenGraduateModal(std)}
                                  className="glass-panel"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.4)', cursor: 'pointer' }}
                                  title="Mark student as graduated"
                                >
                                  Graduate
                                </button>
                                <button
                                  onClick={() => handleOpenDropoutModal(std)}
                                  className="glass-panel"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.4)', cursor: 'pointer' }}
                                  title="Mark student as dropout / cancel admission"
                                >
                                  Dropout
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleReactivateStudent(std._id || std.id, `${std.first_name} ${std.last_name || std.name || ''}`)}
                                className="glass-panel"
                                style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.4)', cursor: 'pointer' }}
                                title="Reactivate student account"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#aaa' }}>
                        No students enrolled yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Assign Modal Overlay */}
            {selectedStudent && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3, 14, 15, 0.88)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                <div style={{ padding: '2rem', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', backgroundColor: '#092528', border: '1px solid rgba(197, 229, 232, 0.25)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)' }}>
                  <h3 style={{ color: 'var(--color-white)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Assign Class Details</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Student: <strong style={{ color: '#fff' }}>{selectedStudent.first_name} {selectedStudent.last_name || selectedStudent.name || ''}</strong> ({selectedStudent.student_code || 'ID Pending'})
                  </p>

                  {/* Student's Saved Preferences Notice for Admin */}
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(197, 229, 232, 0.2)', borderRadius: '8px', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#b0c4c6' }}>
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
                      <label htmlFor="admin_assign_slot" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Assign Class Slot *</label>
                      <select id="admin_assign_slot" required value={assignSlot} onChange={e => setAssignSlot(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.9rem' }}>
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
                      <label htmlFor="admin_assign_instructor" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Assign Instructor *</label>
                      <select id="admin_assign_instructor" required value={assignInst} onChange={e => setAssignInst(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.9rem' }}>
                        <option value="" disabled>Choose Instructor...</option>
                        {instructors.map(inst => (
                          <option key={inst._id} value={inst.name}>{inst.name} ({inst.specialty})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>Confirm Assignment</button>
                      <button type="button" onClick={() => setSelectedStudent(null)} className="glass-panel" style={{ flex: 1, padding: '10px', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}


            {/* Edit Student Info Modal */}
            {editingStudent && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3, 14, 15, 0.9)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1.5rem' }}>
                <div style={{ padding: '2rem', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', backgroundColor: '#092528', border: '1px solid rgba(197, 229, 232, 0.3)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ color: 'var(--color-white)', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                        Edit Student Information
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                        ID: {editingStudent.student_code || 'PENDING'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="glass-panel"
                      style={{ padding: '6px 12px', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      X
                    </button>
                  </div>

                  {editStudentError && (
                    <div style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(231, 76, 60, 0.2)', color: '#ff6b6b', border: '1px solid rgba(231, 76, 60, 0.3)', marginBottom: '1rem', fontSize: '0.88rem' }}>
                      {editStudentError}
                    </div>
                  )}
                  {editStudentSuccess && (
                    <div style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.3)', marginBottom: '1rem', fontSize: '0.88rem' }}>
                      {editStudentSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSaveStudentEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label htmlFor="adm_edit_first_name" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>First Name</label>
                        <input
                          id="adm_edit_first_name"
                          type="text"
                          value={editingStudent.first_name}
                          onChange={(e) => setEditingStudent({ ...editingStudent, first_name: e.target.value })}
                          required
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label htmlFor="adm_edit_last_name" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Last Name</label>
                        <input
                          id="adm_edit_last_name"
                          type="text"
                          value={editingStudent.last_name}
                          onChange={(e) => setEditingStudent({ ...editingStudent, last_name: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label htmlFor="adm_edit_email" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Email</label>
                        <input
                          id="adm_edit_email"
                          type="email"
                          value={editingStudent.email}
                          onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                          required
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label htmlFor="adm_edit_phone" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Phone</label>
                        <input
                          id="adm_edit_phone"
                          type="text"
                          value={editingStudent.phone}
                          onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label htmlFor="adm_edit_guardian_name" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Father / Guardian Name</label>
                        <input
                          id="adm_edit_guardian_name"
                          type="text"
                          value={editingStudent.guardian_name}
                          onChange={(e) => setEditingStudent({ ...editingStudent, guardian_name: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label htmlFor="adm_edit_guardian_phone" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Father / Guardian Phone</label>
                        <input
                          id="adm_edit_guardian_phone"
                          type="text"
                          value={editingStudent.guardian_phone}
                          onChange={(e) => setEditingStudent({ ...editingStudent, guardian_phone: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label htmlFor="adm_edit_dob" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Date of Birth</label>
                        <input
                          id="adm_edit_dob"
                          type="date"
                          value={editingStudent.date_of_birth}
                          onChange={(e) => setEditingStudent({ ...editingStudent, date_of_birth: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label htmlFor="adm_edit_country" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Country</label>
                        <input
                          id="adm_edit_country"
                          type="text"
                          value={editingStudent.country}
                          onChange={(e) => setEditingStudent({ ...editingStudent, country: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label htmlFor="adm_edit_city" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>City</label>
                        <input
                          id="adm_edit_city"
                          type="text"
                          value={editingStudent.city}
                          onChange={(e) => setEditingStudent({ ...editingStudent, city: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="adm_edit_address" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Address</label>
                      <input
                        id="adm_edit_address"
                        type="text"
                        value={editingStudent.address}
                        onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label htmlFor="adm_edit_course" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Course</label>
                        <select
                          id="adm_edit_course"
                          value={editingStudent.course}
                          onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })}
                          style={inputStyle}
                        >
                          <option value="Modern Standard Arabic">Modern Standard Arabic</option>
                          <option value="Arabic For Kids">Arabic For Kids</option>
                          <option value="Arabic Training (MENA)">Arabic Training (MENA)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="adm_edit_slot" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Slot</label>
                        <input
                          id="adm_edit_slot"
                          type="text"
                          value={editingStudent.slot}
                          onChange={(e) => setEditingStudent({ ...editingStudent, slot: e.target.value })}
                          placeholder="e.g. Mon-Fri 08:00 PM"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setEditingStudent(null)}
                        className="glass-panel"
                        style={{ padding: '10px 20px', border: '1px solid rgba(255,255,255,0.2)', color: '#ccc', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingStudent}
                        className="btn-primary"
                        style={{ padding: '10px 24px', cursor: isSavingStudent ? 'not-allowed' : 'pointer', opacity: isSavingStudent ? 0.7 : 1 }}
                      >
                        {isSavingStudent ? 'Saving Changes...' : 'Save Student Info'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* View Full Student Profile Modal */}
            {viewingStudent && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3, 14, 15, 0.88)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem' }}>
                <div style={{ padding: '2rem', maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', backgroundColor: '#092528', border: '1px solid rgba(197, 229, 232, 0.25)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ color: 'var(--color-white)', fontSize: '1.35rem', fontWeight: 700 }}>
                        {viewingStudent.first_name} {viewingStudent.last_name || viewingStudent.name || ''}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        Student ID: {viewingStudent.student_code || 'PENDING'} • Status: <span style={{ color: viewingStudent.status === 'Cancelled' ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>{viewingStudent.status || 'Active'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEditStudent(viewingStudent)}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none' }}
                      >
                        Edit Student Info
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewingStudent(null)}
                        className="glass-panel"
                        style={{ padding: '6px 12px', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {viewingStudent.update_requested && (
                    <div style={{ backgroundColor: 'rgba(243, 156, 18, 0.15)', border: '1px solid rgba(243, 156, 18, 0.4)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', color: '#f39c12' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span>Student Requested Profile Update</span>
                        <button
                          onClick={() => handleDismissUpdateRequest(viewingStudent._id || viewingStudent.id)}
                          style={{ padding: '5px 12px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Dismiss Request
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#fef08a' }}>
                        "{viewingStudent.update_request_note || 'Student submitted request to change profile details.'}"
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.88rem', color: '#b0c4c6' }}>
                    {/* Contact & Personal */}
                    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(197, 229, 232, 0.12)' }}>
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
                    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(197, 229, 232, 0.12)' }}>
                      <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.92rem' }}>Father / Guardian Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        <div><strong style={{ color: '#fff' }}>Father / Guardian Name:</strong> {viewingStudent.guardian_name || viewingStudent.father_name || 'Not provided'}</div>
                        <div><strong style={{ color: '#fff' }}>Father / Guardian Phone:</strong> {viewingStudent.guardian_phone || viewingStudent.father_phone || 'Not provided'}</div>
                      </div>
                    </div>

                    {/* Course & Preferences */}
                    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(197, 229, 232, 0.12)' }}>
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
                    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(197, 229, 232, 0.12)' }}>
                      <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.92rem' }}>Current Class Assignment</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        <div><strong style={{ color: '#fff' }}>Assigned Slot:</strong> {viewingStudent.slot || 'Not Assigned'}</div>
                        <div><strong style={{ color: '#fff' }}>Assigned Instructor:</strong> {viewingStudent.instructor || 'Not Assigned'}</div>
                      </div>
                    </div>

                    {/* Graduation Details if Graduated */}
                    {isStudentGraduated(viewingStudent) && (
                      <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
                        <div style={{ color: '#2ecc71', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.92rem' }}>
                          Graduation Details
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                          <div><strong style={{ color: '#fff' }}>Graduation Date:</strong> {viewingStudent.graduated_at ? new Date(viewingStudent.graduated_at).toLocaleDateString('en-GB') : 'N/A'}</div>
                          <div><strong style={{ color: '#fff' }}>Final Grade / Score:</strong> <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{viewingStudent.final_grade || 'Pass'} {viewingStudent.final_score ? `(${viewingStudent.final_score})` : ''}</span></div>
                          <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#fff' }}>Completed Course:</strong> {viewingStudent.graduation_course || viewingStudent.course || 'N/A'}</div>
                          {viewingStudent.graduation_remarks && (
                            <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#fff' }}>Remarks / Honors:</strong> {viewingStudent.graduation_remarks}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dropout Details if Dropped / Cancelled */}
                    {isStudentDropout(viewingStudent) && (
                      <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(231, 76, 60, 0.3)' }}>
                        <div style={{ color: '#e74c3c', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.92rem' }}>
                          Dropout Details
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                          <div><strong style={{ color: '#fff' }}>Dropout Date:</strong> {(viewingStudent.dropped_at || viewingStudent.cancelled_at) ? new Date(viewingStudent.dropped_at || viewingStudent.cancelled_at).toLocaleDateString('en-GB') : 'N/A'}</div>
                          <div><strong style={{ color: '#fff' }}>Reason:</strong> <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{viewingStudent.dropout_reason || 'Administrative Cancellation'}</span></div>
                          {viewingStudent.dropout_remarks && (
                            <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#fff' }}>Remarks / Notes:</strong> {viewingStudent.dropout_remarks}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {viewingStudent.bio && (
                      <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(197, 229, 232, 0.12)' }}>
                        <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.92rem' }}>Academic Bio & Goals</div>
                        <div style={{ color: '#e0e0e0', lineHeight: '1.5' }}>{viewingStudent.bio}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {isStudentActive(viewingStudent) ? (
                      <>
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
                          onClick={() => {
                            const s = viewingStudent;
                            setViewingStudent(null);
                            handleOpenGraduateModal(s);
                          }}
                          className="glass-panel"
                          style={{ padding: '8px 16px', border: '1px solid rgba(46, 204, 113, 0.4)', color: '#2ecc71', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Graduate Student
                        </button>
                        <button
                          onClick={() => {
                            const s = viewingStudent;
                            setViewingStudent(null);
                            handleOpenDropoutModal(s);
                          }}
                          className="glass-panel"
                          style={{ padding: '8px 16px', border: '1px solid rgba(231, 76, 60, 0.4)', color: '#e74c3c', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Mark Dropout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleReactivateStudent(viewingStudent._id || viewingStudent.id, `${viewingStudent.first_name} ${viewingStudent.last_name || viewingStudent.name || ''}`)}
                        className="glass-panel"
                        style={{ padding: '8px 16px', border: '1px solid rgba(46, 204, 113, 0.4)', color: '#2ecc71', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Reactivate Student
                      </button>
                    )}
                    <button
                      onClick={() => setViewingStudent(null)}
                      className="glass-panel"
                      style={{ padding: '8px 16px', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dedicated Graduates View */}
        {activeTab === 'graduates' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.6rem' }}>Graduated Students</h2>
                <p style={{ color: '#aaa', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                  List of all students who successfully completed their courses and graduated.
                </p>
              </div>

              {/* Search & Badge */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search graduates by name, ID, course, grade..."
                    value={graduatesSearch}
                    onChange={e => setGraduatesSearch(e.target.value)}
                    style={{
                      padding: '8px 14px 8px 36px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      minWidth: '280px'
                    }}
                  />
                  <Search size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <div style={{ background: 'rgba(46, 204, 113, 0.15)', border: '1px solid rgba(46, 204, 113, 0.3)', padding: '6px 14px', borderRadius: '8px', color: '#2ecc71', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  Total: {students.filter(isStudentGraduated).length} Graduates
                </div>
              </div>
            </div>

            {/* Graduates Table */}
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Student ID</th>
                    <th style={tableHeaderStyle}>Graduate Name</th>
                    <th style={tableHeaderStyle}>Contact Info</th>
                    <th style={tableHeaderStyle}>Completed Course</th>
                    <th style={tableHeaderStyle}>Graduation Date</th>
                    <th style={tableHeaderStyle}>Grade & Score</th>
                    <th style={tableHeaderStyle}>Remarks</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(isStudentGraduated).filter(std => {
                    if (!graduatesSearch.trim()) return true;
                    const q = graduatesSearch.toLowerCase();
                    const name = `${std.first_name || ''} ${std.last_name || ''} ${std.name || ''}`.toLowerCase();
                    const email = (std.email || '').toLowerCase();
                    const code = (std.student_code || '').toLowerCase();
                    const course = (std.graduation_course || std.course || std.preferred_course || '').toLowerCase();
                    const grade = (std.final_grade || '').toLowerCase();
                    const remarks = (std.graduation_remarks || '').toLowerCase();
                    return name.includes(q) || email.includes(q) || code.includes(q) || course.includes(q) || grade.includes(q) || remarks.includes(q);
                  }).map(std => {
                    const gradDate = std.graduated_at ? new Date(std.graduated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
                    return (
                      <tr key={std._id || std.id}>
                        <td style={tableCellStyle}>
                          <span style={{ fontWeight: '700', color: '#2ecc71', fontSize: '0.85rem' }}>
                            {std.student_code || 'N/A'}
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
                            {std.graduation_course || std.course || std.preferred_course || 'Modern Standard Arabic'}
                          </div>
                          {std.instructor && (
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                              Instructor: {std.instructor}
                            </div>
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#fff' }}>
                            <Award size={14} color="#2ecc71" />
                            {gradDate}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              background: 'rgba(46, 204, 113, 0.2)',
                              color: '#2ecc71',
                              border: '1px solid rgba(46, 204, 113, 0.4)'
                            }}>
                              {std.final_grade || 'Pass'}
                            </span>
                            {std.final_score && (
                              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: '600' }}>
                                ({std.final_score})
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ fontSize: '0.8rem', color: '#b0c4c6', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={std.graduation_remarks || 'None'}>
                            {std.graduation_remarks || 'Completed with distinction'}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setViewingStudent(std)}
                              className="glass-panel"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', border: '1px solid rgba(197, 229, 232, 0.25)', color: 'var(--color-primary)', cursor: 'pointer' }}
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleReactivateStudent(std._id || std.id, `${std.first_name} ${std.last_name || std.name || ''}`)}
                              className="glass-panel"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#3498db', border: '1px solid rgba(52, 152, 219, 0.4)', cursor: 'pointer' }}
                              title="Re-enroll or reactivate this student for further studies"
                            >
                              Re-Enroll
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {students.filter(isStudentGraduated).length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>
                        <div style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>No graduated students recorded yet.</div>
                        <div style={{ fontSize: '0.85rem', color: '#888' }}>
                          When an enrolled student completes their curriculum, click <strong>"Graduate"</strong> in the Students tab.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dedicated Dropouts View */}
        {activeTab === 'dropouts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.6rem' }}>Dropout Students</h2>
                <p style={{ color: '#aaa', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                  List of students who withdrew, cancelled their enrollment, or discontinued classes.
                </p>
              </div>

              {/* Search & Badge */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search dropouts by name, ID, reason, remarks..."
                    value={dropoutsSearch}
                    onChange={e => setDropoutsSearch(e.target.value)}
                    style={{
                      padding: '8px 14px 8px 36px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      minWidth: '280px'
                    }}
                  />
                  <Search size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '6px 14px', borderRadius: '8px', color: '#e74c3c', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  Total: {students.filter(isStudentDropout).length} Dropouts
                </div>
              </div>
            </div>

            {/* Dropouts Table */}
            <div className="table-responsive-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Student ID</th>
                    <th style={tableHeaderStyle}>Student Name</th>
                    <th style={tableHeaderStyle}>Contact Info</th>
                    <th style={tableHeaderStyle}>Last Enrolled Course</th>
                    <th style={tableHeaderStyle}>Dropout Date</th>
                    <th style={tableHeaderStyle}>Reason for Dropping</th>
                    <th style={tableHeaderStyle}>Remarks / Notes</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(isStudentDropout).filter(std => {
                    if (!dropoutsSearch.trim()) return true;
                    const q = dropoutsSearch.toLowerCase();
                    const name = `${std.first_name || ''} ${std.last_name || ''} ${std.name || ''}`.toLowerCase();
                    const email = (std.email || '').toLowerCase();
                    const code = (std.student_code || '').toLowerCase();
                    const course = (std.course || std.preferred_course || '').toLowerCase();
                    const reason = (std.dropout_reason || '').toLowerCase();
                    const remarks = (std.dropout_remarks || '').toLowerCase();
                    return name.includes(q) || email.includes(q) || code.includes(q) || course.includes(q) || reason.includes(q) || remarks.includes(q);
                  }).map(std => {
                    const dropDate = (std.dropped_at || std.cancelled_at) ? new Date(std.dropped_at || std.cancelled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
                    return (
                      <tr key={std._id || std.id} style={{ opacity: 0.85 }}>
                        <td style={tableCellStyle}>
                          <span style={{ fontWeight: '700', color: '#e74c3c', fontSize: '0.85rem' }}>
                            {std.student_code || 'N/A'}
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
                          {std.instructor && (
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                              Last Instructor: {std.instructor}
                            </div>
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ fontSize: '0.85rem', color: '#e0e0e0' }}>
                            {dropDate}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            background: 'rgba(231, 76, 60, 0.2)',
                            color: '#e74c3c',
                            border: '1px solid rgba(231, 76, 60, 0.4)',
                            display: 'inline-block'
                          }}>
                            {std.dropout_reason || 'Administrative Cancellation'}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ fontSize: '0.8rem', color: '#b0c4c6', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={std.dropout_remarks || 'None'}>
                            {std.dropout_remarks || 'No remarks recorded'}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setViewingStudent(std)}
                              className="glass-panel"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', border: '1px solid rgba(197, 229, 232, 0.25)', color: 'var(--color-primary)', cursor: 'pointer' }}
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleReactivateStudent(std._id || std.id, `${std.first_name} ${std.last_name || std.name || ''}`)}
                              className="glass-panel"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.4)', cursor: 'pointer' }}
                              title="Restore student to active status & re-enable login"
                            >
                              Reactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {students.filter(isStudentDropout).length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>
                        <div style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>No dropout students recorded.</div>
                        <div style={{ fontSize: '0.85rem', color: '#888' }}>
                          Students marked as dropped or cancelled will appear here with full reasons and remarks.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                    <label htmlFor="admin_inst_name" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Instructor Name *</label>
                    <input id="admin_inst_name" type="text" placeholder="e.g. Instructor Ahmed" value={newInstName} onChange={e => setNewInstName(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label htmlFor="admin_inst_email" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Instructor Email * (for portal login & credentials)</label>
                    <input id="admin_inst_email" type="email" placeholder="e.g. instructor.ahmed@example.com" value={newInstEmail} onChange={e => setNewInstEmail(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label htmlFor="admin_inst_spec" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Specialty / Role</label>
                    <input id="admin_inst_spec" type="text" placeholder="e.g. Grammar & Morphology" value={newInstSpec} onChange={e => setNewInstSpec(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(0, 168, 150, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0, 168, 150, 0.2)' }}>
                  <strong>Automatic Credentials Dispatch:</strong> Saving this instructor creates a secure portal account and automatically emails their temporary login credentials and password.
                </div>

                <div>
                  <label htmlFor="admin_inst_about" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>About / Description</label>
                  <textarea id="admin_inst_about" placeholder="Experienced Arabic language instructor specializing in grammar and morphology." value={newInstAbout} onChange={e => setNewInstAbout(e.target.value)} rows="3" style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
                </div>

                <div>
                  <label htmlFor="admin_inst_file" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Profile Picture (File Upload)</label>
                  <input id="admin_inst_file" ref={fileInputRef} type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} style={{ color: '#e0e0e0', padding: '8px 0' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {editingInstId ? 'Update Instructor' : 'Add Instructor'}
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
                    <th style={tableHeaderStyle}>Name & Email</th>
                    <th style={tableHeaderStyle}>About / Specialty</th>
                    <th style={tableHeaderStyle}>Active Slots / Students</th>
                    <th style={tableHeaderStyle}>Total Students</th>
                    <th style={{ ...tableHeaderStyle, width: '270px', minWidth: '270px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {instructors.map(inst => (
                    <tr key={inst._id || inst.id}>
                      <td style={tableCellStyle}>
                        <img src={getAvatarUrl(inst.avatar, inst.name)} alt={inst.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', background: 'var(--color-bg-dark)' }} />
                      </td>
                      <td style={tableCellStyle}>
                        <strong>{inst.name}</strong>
                        {inst.email && (
                          <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '2px' }}>{inst.email}</div>
                        )}
                        {inst.username && (
                          <div style={{ color: 'var(--color-primary)', fontSize: '0.78rem', marginTop: '1px' }}>@{inst.username}</div>
                        )}
                      </td>
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
                                • {s.slot ? `${s.slot}: ` : ''}{s.name}{!s.slot ? ' (Unassigned)' : ''}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#666' }}>No active assignments</span>
                          )}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{inst.total_students || 0}</td>
                      <td style={{ ...tableCellStyle, width: '270px', minWidth: '270px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleEditInstructorClick(inst)}
                            className="glass-panel"
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.82rem',
                              color: 'var(--color-primary)',
                              border: '1px solid rgba(197, 229, 232, 0.35)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              background: 'rgba(197, 229, 232, 0.08)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Edit
                          </button>
                          {inst.email && (
                            <button
                              type="button"
                              onClick={() => handleResendInstructorCredentials(inst._id || inst.id, inst.name, inst.email)}
                              disabled={resendingInstId === (inst._id || inst.id)}
                              className="glass-panel"
                              title="Resend login credentials to instructor email"
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.82rem',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                borderRadius: '6px',
                                cursor: resendingInstId === (inst._id || inst.id) ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                background: 'rgba(56, 189, 248, 0.08)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {resendingInstId === (inst._id || inst.id) ? 'Sending...' : 'Resend Credentials'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteInstructor(inst._id || inst.id)}
                            className="glass-panel"
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.82rem',
                              color: '#e74c3c',
                              border: '1px solid rgba(231, 76, 60, 0.4)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              background: 'rgba(231, 76, 60, 0.08)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Delete
                          </button>
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
                    <label htmlFor="admin_mod_name" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Module / Level Name *</label>
                    <input id="admin_mod_name" type="text" placeholder="e.g. A1 or Arabic for Quran" value={modName} onChange={e => setModName(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label htmlFor="admin_mod_order" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Display Order</label>
                    <input id="admin_mod_order" type="number" min="1" placeholder="1" value={modOrder} onChange={e => setModOrder(Number.parseInt(e.target.value, 10) || 1)} style={{ ...inputStyle, width: '100%' }} />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin_mod_desc" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Description / About *</label>
                  <textarea id="admin_mod_desc" placeholder="Beginner Arabic level designed for students starting their learning journey." value={modDesc} onChange={e => setModDesc(e.target.value)} required rows="3" style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
                </div>

                <div>
                  <label htmlFor="admin_mod_file" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Optional Module Image/Icon (File Upload)</label>
                  <input id="admin_mod_file" ref={modFileInputRef} type="file" accept="image/*" onChange={e => setModFile(e.target.files[0])} style={{ color: '#e0e0e0', padding: '8px 0' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     {editingModId ? 'Update Module' : 'Add Module'}
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
                    <label htmlFor="admin_slot_days" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Day(s) *</label>
                    <input id="admin_slot_days" type="text" placeholder="e.g. Monday & Wednesday" value={slotDays} onChange={e => setSlotDays(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label htmlFor="admin_slot_time" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Time *</label>
                    <input id="admin_slot_time" type="text" placeholder="e.g. 6:00 PM" value={slotTime} onChange={e => setSlotTime(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label htmlFor="admin_slot_status" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Status *</label>
                    <select id="admin_slot_status" value={slotStatus} onChange={e => setSlotStatus(e.target.value)} style={{ ...inputStyle, width: '100%', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     {editingSlotId ? 'Update Slot' : 'Add Slot'}
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
                            background: notif.notification_type === 'student_update_request' ? 'rgba(243, 156, 18, 0.25)' : (isUnread ? 'rgba(0, 168, 150, 0.25)' : 'rgba(255,255,255,0.1)'),
                            color: notif.notification_type === 'student_update_request' ? '#f39c12' : (isUnread ? 'var(--color-primary)' : '#aaa')
                          }}>
                            {notif.notification_type === 'student_update_request' ? 'Update Request' : isProfileCompleted ? 'Profile Completed' : (notif.notification_type || 'Alert')}
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
                        {(isProfileCompleted || notif.notification_type === 'student_update_request') && (
                          <button
                            onClick={async () => {
                              setActiveTab('students');
                              if (notif.related_entity_id) {
                                let found = students.find(s => String(s._id || s.id) === String(notif.related_entity_id));
                                if (!found) {
                                  try {
                                    const res = await fetch(`${API_BASE}/students/`, { headers });
                                    const data = await res.json();
                                    if (Array.isArray(data)) {
                                      setStudents(data);
                                      found = data.find(s => String(s._id || s.id) === String(notif.related_entity_id));
                                    }
                                  } catch (e) { console.error(e); }
                                }
                                if (found) setViewingStudent(found);
                              }
                            }}
                            className="glass-panel"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', color: notif.notification_type === 'student_update_request' ? '#f39c12' : 'var(--color-primary)', borderColor: notif.notification_type === 'student_update_request' ? '#f39c12' : 'var(--color-primary)', cursor: 'pointer' }}
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

        {/* Admins Management Tab */}
        {activeTab === 'admins' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.6rem' }}>System Administrators</h2>
                <p style={{ color: 'var(--color-primary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                  Manage authorized administrator accounts, permissions, and security status.
                </p>
              </div>
              {isCurrentSystemAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setAdminFormError('');
                    setAdminFormSuccess('');
                    setShowAddAdminModal(true);
                  }}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <Plus size={16} /> Add Administrator
                </button>
              ) : (
                <div style={{ color: '#8892b0', fontSize: '0.85rem', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                   Administrative management restricted to System Admin
                </div>
              )}
            </div>

            {/* Quick Stats & Search Bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Total Admins:</span>
                  <span style={{ color: 'var(--color-white)', fontWeight: 'bold', fontSize: '1.05rem' }}>{admins.length}</span>
                </div>
                <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Active:</span>
                  <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1.05rem' }}>{admins.filter(a => a.is_active && a.status === 'active').length}</span>
                </div>
                <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Inactive:</span>
                  <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.05rem' }}>{admins.filter(a => !a.is_active || a.status !== 'active').length}</span>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search admins by username, email or name..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                style={{
                  ...inputStyle,
                  width: '320px',
                  padding: '8px 14px',
                  fontSize: '0.88rem',
                  border: '1px solid rgba(197, 229, 232, 0.25)'
                }}
              />
            </div>

            {/* Admins Table */}
            <div className="table-responsive glass-panel" style={{ border: '1px solid rgba(197, 229, 232, 0.15)', borderRadius: '10px' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: 'rgba(0, 168, 150, 0.12)', borderBottom: '1px solid rgba(197, 229, 232, 0.2)' }}>
                    <th style={tableHeaderStyle}>Admin User</th>
                    <th style={tableHeaderStyle}>Email Address</th>
                    <th style={tableHeaderStyle}>Role</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Created</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins
                    .filter(a => {
                      if (!adminSearch.trim()) return true;
                      const q = adminSearch.toLowerCase();
                      return (
                        (a.username && a.username.toLowerCase().includes(q)) ||
                        (a.email && a.email.toLowerCase().includes(q)) ||
                        (a.full_name && a.full_name.toLowerCase().includes(q))
                      );
                    })
                    .map((adm) => {
                      const isActive = adm.is_active && adm.status === 'active';
                      return (
                        <tr key={adm._id || adm.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={tableCellStyle}>
                            <div style={{ fontWeight: '600', color: 'var(--color-white)', fontSize: '0.95rem' }}>
                              {adm.username}
                            </div>
                            {adm.full_name && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                                {adm.full_name}
                              </div>
                            )}
                          </td>
                          <td style={tableCellStyle}>
                            <div style={{ color: '#e0e0e0', fontSize: '0.9rem' }}>{adm.email}</div>
                          </td>
                          <td style={tableCellStyle}>
                            {adm.is_system_admin || adm.username === 'admin' ? (
                              <span style={{
                                padding: '3px 9px',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                background: 'rgba(234, 179, 8, 0.15)',
                                color: '#facc15',
                                border: '1px solid rgba(234, 179, 8, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                System Admin
                              </span>
                            ) : (
                              <span style={{
                                padding: '3px 9px',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                background: 'rgba(0, 168, 150, 0.2)',
                                color: 'var(--color-primary)',
                                border: '1px solid rgba(0, 168, 150, 0.35)'
                              }}>
                                Administrator
                              </span>
                            )}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{
                              padding: '3px 9px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              background: isActive ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                              color: isActive ? '#2ecc71' : '#e74c3c',
                              border: isActive ? '1px solid rgba(46, 204, 113, 0.3)' : '1px solid rgba(231, 76, 60, 0.3)'
                            }}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            <div style={{ color: '#888', fontSize: '0.82rem' }}>
                              {adm.created_at ? new Date(adm.created_at).toLocaleDateString() : 'System Default'}
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {/* Case 1: Logged in as System Admin */}
                              {isCurrentSystemAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPasswordModal(adm)}
                                    className="glass-panel"
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '0.8rem',
                                      cursor: 'pointer',
                                      color: 'var(--color-primary)',
                                      border: '1px solid rgba(197, 229, 232, 0.35)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title={adm.username === authUser?.username ? 'Change your own password' : `Reset password for ${adm.username}`}
                                  >
                                    <Key size={13} /> {adm.username === authUser?.username ? 'Change Password' : 'Reset Password'}
                                  </button>
                                  {!(adm.is_system_admin || adm.username === 'admin') && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleAdminStatus(adm._id || adm.id, adm.username)}
                                        className="glass-panel"
                                        style={{
                                          padding: '5px 10px',
                                          fontSize: '0.8rem',
                                          cursor: 'pointer',
                                          color: isActive ? '#e74c3c' : '#2ecc71',
                                          border: isActive ? '1px solid rgba(231, 76, 60, 0.4)' : '1px solid rgba(46, 204, 113, 0.4)'
                                        }}
                                        title={isActive ? 'Deactivate this admin account' : 'Reactivate this admin account'}
                                      >
                                        {isActive ? 'Deactivate' : 'Activate'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAdmin(adm._id || adm.id, adm.username)}
                                        className="glass-panel"
                                        style={{
                                          padding: '5px 10px',
                                          fontSize: '0.8rem',
                                          cursor: 'pointer',
                                          color: '#ff6b6b',
                                          border: '1px solid rgba(255, 107, 107, 0.4)'
                                        }}
                                        title="Delete admin"
                                      >
                                        <Trash2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}

                              {/* Case 2: Logged in as Generated Admin */}
                              {!isCurrentSystemAdmin && (
                                (adm.username === authUser?.username || (authUser?.id && (authUser.id === adm._id || authUser.id === adm.id))) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPasswordModal(adm)}
                                    className="glass-panel"
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '0.8rem',
                                      cursor: 'pointer',
                                      color: 'var(--color-primary)',
                                      border: '1px solid rgba(197, 229, 232, 0.35)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Change your own password"
                                  >
                                    <Key size={13} /> Change My Password
                                  </button>
                                ) : (
                                  <span style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                    Restricted
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#aaa' }}>
                        No administrators found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={24} style={{ color: 'var(--color-primary)' }} /> Broadcast Announcements &amp; Notifications
              </h2>
              <p style={{ color: '#b0c4c6', fontSize: '0.9rem', marginTop: '4px' }}>
                Dispatch custom alert messages to Students, Instructors, All Platform Users, or Specific Individuals.
              </p>
            </div>

            {bcSuccess && (
              <div style={{ background: 'rgba(46, 204, 113, 0.15)', border: '1px solid rgba(46, 204, 113, 0.4)', color: '#2ecc71', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {bcSuccess}
              </div>
            )}

            {bcError && (
              <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.4)', color: '#e74c3c', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.2rem' }}>
                {bcError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Broadcast Form Panel */}
              <div className="glass-panel" style={{ padding: '1.8rem', borderRadius: '12px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.2rem', fontWeight: 'bold' }}>Compose Broadcast</h3>
                
                <form onSubmit={handleBroadcastSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="admin_bc_target_role" style={{ display: 'block', color: '#b0c4c6', fontSize: '0.85rem', marginBottom: '6px' }}>Target Audience</label>
                    <select
                      id="admin_bc_target_role"
                      value={bcTargetRole}
                      onChange={(e) => setBcTargetRole(e.target.value)}
                      style={{ ...inputStyle, width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                    >
                      <option value="all" style={{ background: '#12252a' }}>All Platform Users (Students + Instructors)</option>
                      <option value="student" style={{ background: '#12252a' }}>All Enrolled Students Only</option>
                      <option value="instructor" style={{ background: '#12252a' }}>All Instructors Only</option>
                      <option value="specific" style={{ background: '#12252a' }}>Specific User (By ID / Name)</option>
                    </select>
                  </div>

                  {bcTargetRole === 'specific' && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label htmlFor="admin_bc_target_user" style={{ display: 'block', color: '#b0c4c6', fontSize: '0.85rem', marginBottom: '6px' }}>Select Specific Recipient</label>
                      <select
                        id="admin_bc_target_user"
                        value={bcTargetUser}
                        onChange={(e) => setBcTargetUser(e.target.value)}
                        style={{ ...inputStyle, width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                      >
                        <option value="" style={{ background: '#12252a' }}>-- Select Recipient --</option>
                        <optgroup label="Students" style={{ background: '#12252a' }}>
                          {students.map(s => (
                            <option key={s._id || s.id} value={s._id || s.id} style={{ background: '#12252a' }}>
                              {s.full_name || s.student_name || s.username} ({s.roll_number || 'Student'})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Instructors" style={{ background: '#12252a' }}>
                          {instructors.map(inst => (
                            <option key={inst._id || inst.id} value={inst._id || inst.id} style={{ background: '#12252a' }}>
                              {inst.full_name || inst.name || inst.username} ({inst.specialization || 'Instructor'})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="admin_bc_title" style={{ display: 'block', color: '#b0c4c6', fontSize: '0.85rem', marginBottom: '6px' }}>Announcement Title</label>
                    <input
                      id="admin_bc_title"
                      type="text"
                      placeholder="e.g. Important Platform Maintenance / Class Reschedule"
                      value={bcTitle}
                      onChange={(e) => setBcTitle(e.target.value)}
                      required
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="admin_bc_message" style={{ display: 'block', color: '#b0c4c6', fontSize: '0.85rem', marginBottom: '6px' }}>Message Content</label>
                    <textarea id="admin_bc_message"
                      rows={4}
                      placeholder="Type your detailed message here..."
                      value={bcMessage}
                      onChange={(e) => setBcMessage(e.target.value)}
                      required
                      style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bcSending}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: bcSending ? 'wait' : 'pointer' }}
                  >
                    <Send size={16} /> {bcSending ? 'Broadcasting...' : 'Send Announcement'}
                  </button>
                </form>
              </div>

              {/* Live Preview Card */}
              <div className="glass-panel" style={{ padding: '1.8rem', borderRadius: '12px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.2rem', fontWeight: 'bold' }}>Recipient Notification Preview</h3>
                <p style={{ color: '#aaa', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  Here is how this announcement will render in recipient notification lists:
                </p>

                <div style={{ background: 'rgba(27, 67, 77, 0.4)', border: '1px solid rgba(0, 168, 150, 0.4)', borderRadius: '10px', padding: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 168, 150, 0.25)', color: 'var(--color-primary)', border: '1px solid rgba(0, 168, 150, 0.4)' }}>
                      ADMIN ANNOUNCEMENT
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>Just now</span>
                  </div>
                  <h4 style={{ color: '#fff', fontSize: '1rem', margin: '6px 0', fontWeight: 'bold' }}>
                    {bcTitle || 'Sample Announcement Title'}
                  </h4>
                  <p style={{ color: '#b0c4c6', fontSize: '0.88rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {bcMessage || 'Sample announcement text will be displayed here for the selected target audience.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Audit Tab */}
        {activeTab === 'chataudit' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--color-white)', margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={24} style={{ color: 'var(--color-primary)' }} /> Student-Instructor Communication Audit
              </h2>
              <p style={{ color: '#b0c4c6', fontSize: '0.9rem', marginTop: '4px' }}>
                Read-only administrative monitoring of all private direct messaging threads across the platform.
              </p>
            </div>

            {/* Security Banner */}
            <div style={{ background: 'rgba(0, 168, 150, 0.12)', border: '1px solid rgba(0, 168, 150, 0.35)', padding: '12px 18px', borderRadius: '8px', marginBottom: '1.5rem', color: '#00a896', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={18} style={{ flexShrink: 0 }} />
              <span>
                <strong> Audit Oversight Active:</strong> Administrators can inspect conversation history between students and their assigned instructors for policy compliance. Sending messages into private user threads is restricted.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.5rem', minHeight: '520px' }}>
              {/* Threads Sidebar */}
              <div className="glass-panel" style={{ padding: '1.2rem', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.05rem', margin: 0, fontWeight: 'bold' }}>Active Threads</h3>
                  <button onClick={() => { void fetchAuditThreads(); }} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>

                {loadingAuditThreads ? (
                  <div style={{ color: '#aaa', padding: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>Loading threads...</div>
                ) : auditThreads.length === 0 ? (
                  <div style={{ color: '#888', padding: '2rem', textAlign: 'center', fontSize: '0.88rem' }}>No student-instructor threads found yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '480px' }} className="no-scrollbar">
                    {auditThreads.map((th) => {
                      const thId = th.thread_id || th._id || th.id;
                      const activeId = auditActiveThread ? (auditActiveThread.thread_id || auditActiveThread._id || auditActiveThread.id) : null;
                      const isSelected = activeId && activeId === thId;
                      return (
                        <button
                          type="button"
                          key={thId}
                          onClick={() => handleSelectAuditThread(th)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px',
                            borderRadius: '8px',
                            background: isSelected ? 'rgba(0, 168, 150, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '1px solid rgba(0, 168, 150, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit',
                            fontSize: 'inherit'
                          }}
                        >
                          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                             {th.student_name || 'Student'} ↔  {th.instructor_name || 'Instructor'}
                          </div>
                          <div style={{ color: '#aaa', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {th.last_message || 'No messages exchanged yet'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Messages Viewer Area */}
              <div className="glass-panel" style={{ padding: '1.2rem', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                {auditActiveThread ? (
                  <>
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 'bold' }}>
                          Chat Audit: {auditActiveThread.student_name} &amp; {auditActiveThread.instructor_name}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#00a896' }}>
                          Thread ID: {auditActiveThread.thread_id || auditActiveThread._id || auditActiveThread.id}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}>
                        Read-Only Audit Mode
                      </span>
                    </div>

                    {/* Message Stream */}
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '360px', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {loadingAuditHistory ? (
                        <div style={{ color: '#aaa', textAlign: 'center', padding: '2rem' }}>Loading message log...</div>
                      ) : auditMessages.length === 0 ? (
                        <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>No messages in this chat thread yet.</div>
                      ) : (
                        auditMessages.map((msg) => {
                          const senderDisplay = msg.sender_name || (msg.sender_role === 'student' ? auditActiveThread.student_name : auditActiveThread.instructor_name);
                          return (
                            <div key={msg._id || msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender_role === 'student' ? 'flex-start' : 'flex-end' }}>
                              <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '3px' }}>
                                <strong style={{ color: msg.sender_role === 'student' ? '#3498db' : '#2ecc71' }}>
                                  {senderDisplay} ({msg.sender_role})
                                </strong> • {new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div style={{
                                maxWidth: '75%',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                background: msg.sender_role === 'student' ? 'rgba(52, 152, 219, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                                border: msg.sender_role === 'student' ? '1px solid rgba(52, 152, 219, 0.3)' : '1px solid rgba(46, 204, 113, 0.3)',
                                color: '#fff',
                                fontSize: '0.88rem',
                                lineHeight: '1.4'
                              }}>
                                {msg.content}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Locked Bottom Message Input Bar */}
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="text"
                        disabled
                        placeholder="Message input disabled for admin monitoring session..."
                        style={{ ...inputStyle, width: '100%', opacity: 0.5, cursor: 'not-allowed' }}
                      />
                      <button disabled className="btn-secondary" style={{ opacity: 0.5, cursor: 'not-allowed', padding: '10px 16px' }}>
                        Locked
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>Select a student-instructor thread from the sidebar to audit conversation history.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

            {/* Change / Reset Admin Password Modal */}
      {changePwdAdmin && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close password modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(3, 15, 16, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setChangePwdAdmin(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setChangePwdAdmin(null); }}
        >
          <div
            role="presentation"
            style={{
              background: '#092528',
              border: '1px solid rgba(197, 229, 232, 0.25)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '2rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--color-white)', marginTop: 0, marginBottom: '0.4rem', fontSize: '1.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={18} color="var(--color-primary)" />
              {isCurrentSystemAdmin && (changePwdAdmin._id !== authUser?.id && changePwdAdmin.username !== authUser?.username)
                ? `Reset Password: ${changePwdAdmin.username}`
                : 'Change My Password'}
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Enter a new secure password (minimum 6 characters).
            </p>

            {resetPwdError && (
              <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.3)', color: '#ff6b6b', padding: '10px 14px', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {resetPwdError}
              </div>
            )}
            {resetPwdSuccess && (
              <div style={{ background: 'rgba(46, 204, 113, 0.15)', border: '1px solid rgba(46, 204, 113, 0.3)', color: '#2ecc71', padding: '10px 14px', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {resetPwdSuccess}
              </div>
            )}

            <form onSubmit={handleResetAdminPassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="admin_reset_new_pwd" style={{ display: 'block', color: 'var(--color-white)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500 }}>
                  New Password *
                </label>
                <input
                  id="admin_reset_new_pwd"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 chars)"
                  value={resetPwdInput}
                  onChange={(e) => setResetPwdInput(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="admin_reset_confirm_pwd" style={{ display: 'block', color: 'var(--color-white)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500 }}>
                  Confirm New Password *
                </label>
                <input
                  id="admin_reset_confirm_pwd"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                  value={resetPwdConfirm}
                  onChange={(e) => setResetPwdConfirm(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setChangePwdAdmin(null)}
                  className="glass-panel"
                  style={{ padding: '8px 18px', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPwdLoading}
                  className="btn-primary"
                  style={{ padding: '8px 20px', cursor: resetPwdLoading ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: resetPwdLoading ? 0.7 : 1 }}
                >
                  {resetPwdLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Admin Modal */}
      {showAddAdminModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(3, 15, 16, 0.88)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#092528',
            border: '1px solid rgba(197, 229, 232, 0.25)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            position: 'relative'
          }}>
            <h3 style={{ color: 'var(--color-white)', marginTop: 0, marginBottom: '0.4rem', fontSize: '1.3rem', fontWeight: 600 }}>
              Add New Administrator
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Create a new administrator with secure Argon2id encrypted credentials.
            </p>

            {adminFormError && (
              <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.3)', color: '#ff6b6b', padding: '10px 14px', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {adminFormError}
              </div>
            )}
            {adminFormSuccess && (
              <div style={{ background: 'rgba(46, 204, 113, 0.15)', border: '1px solid rgba(46, 204, 113, 0.3)', color: '#2ecc71', padding: '10px 14px', borderRadius: '6px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {adminFormSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAdmin}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="admin_new_username" style={{ display: 'block', color: 'var(--color-white)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500 }}>
                  Username *
                </label>
                <input
                  id="admin_new_username"
                  type="text"
                  required
                  placeholder="e.g. jameel_admin"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="admin_new_email" style={{ display: 'block', color: 'var(--color-white)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500 }}>
                  Email Address *
                </label>
                <input
                  id="admin_new_email"
                  type="email"
                  required
                  placeholder="e.g. jameel@alarabia.edu"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="admin_new_fullname" style={{ display: 'block', color: 'var(--color-white)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500 }}>
                  Full Name (Optional)
                </label>
                <input
                  id="admin_new_fullname"
                  type="text"
                  placeholder="e.g. Jameel Ahmad"
                  value={newAdminFullName}
                  onChange={(e) => setNewAdminFullName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label htmlFor="admin_new_password" style={{ display: 'block', color: 'var(--color-white)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500 }}>
                    Password *
                  </label>
                  <input
                    id="admin_new_password"
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="admin_new_confirm_password" style={{ display: 'block', color: 'var(--color-white)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500 }}>
                    Confirm Password *
                  </label>
                  <input
                    id="admin_new_confirm_password"
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={newAdminConfirmPassword}
                    onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="glass-panel"
                  style={{ padding: '8px 18px', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.88rem', cursor: isSubmittingAdmin ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmittingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Graduate Student Modal */}
      {graduatingStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3, 14, 15, 0.88)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 220, padding: '1rem' }}>
          <div style={{ padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', backgroundColor: '#092528', border: '1px solid rgba(46, 204, 113, 0.4)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)' }}>
            <h3 style={{ color: 'var(--color-white)', margin: '0 0 1rem 0', fontSize: '1.3rem' }}>Mark Student as Graduated</h3>

            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Student: <strong style={{ color: '#fff' }}>{graduatingStudent.first_name} {graduatingStudent.last_name || graduatingStudent.name || ''}</strong> ({graduatingStudent.student_code || 'ID Pending'})
            </p>

            <form onSubmit={handleGraduateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="admin_grad_course" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Completed Course Title *
                </label>
                <input
                  id="admin_grad_course"
                  type="text"
                  required
                  value={graduateForm.graduation_course}
                  onChange={e => setGraduateForm({ ...graduateForm, graduation_course: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                  placeholder="e.g. Modern Standard Arabic - Level 1"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="admin_grad_grade" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    Final Grade *
                  </label>
                  <select
                    id="admin_grad_grade"
                    value={graduateForm.final_grade}
                    onChange={e => setGraduateForm({ ...graduateForm, final_grade: e.target.value })}
                    style={{ ...inputStyle, width: '100%', background: '#071d20' }}
                  >
                    <option value="A+">A+ (Outstanding)</option>
                    <option value="A">A (Excellent)</option>
                    <option value="B+">B+ (Very Good)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Satisfactory)</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin_grad_score" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    Final Score / Percentage
                  </label>
                  <input
                    id="admin_grad_score"
                    type="text"
                    value={graduateForm.final_score}
                    onChange={e => setGraduateForm({ ...graduateForm, final_score: e.target.value })}
                    style={{ ...inputStyle, width: '100%' }}
                    placeholder="e.g. 94% or 470/500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin_grad_date" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Graduation Date *
                </label>
                <input
                  id="admin_grad_date"
                  type="date"
                  required
                  value={graduateForm.graduation_date}
                  onChange={e => setGraduateForm({ ...graduateForm, graduation_date: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="admin_grad_remarks" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Graduation Remarks / Honors
                </label>
                <textarea id="admin_grad_remarks"
                  rows={3}
                  value={graduateForm.graduation_remarks}
                  onChange={e => setGraduateForm({ ...graduateForm, graduation_remarks: e.target.value })}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                  placeholder="e.g. Excellent recitation, completed final exam with distinction..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setGraduatingStudent(null)}
                  className="glass-panel"
                  style={{ padding: '8px 16px', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGraduate}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem', cursor: isSubmittingGraduate ? 'not-allowed' : 'pointer', background: '#2ecc71', borderColor: '#2ecc71' }}
                >
                  {isSubmittingGraduate ? 'Processing...' : 'Confirm Graduation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dropout Student Modal */}
      {droppingStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3, 14, 15, 0.88)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 220, padding: '1rem' }}>
          <div style={{ padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', backgroundColor: '#092528', border: '1px solid rgba(231, 76, 60, 0.4)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)' }}>
            <h3 style={{ color: 'var(--color-white)', margin: '0 0 1rem 0', fontSize: '1.3rem' }}>Mark Student as Dropout</h3>

            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Student: <strong style={{ color: '#fff' }}>{droppingStudent.first_name} {droppingStudent.last_name || droppingStudent.name || ''}</strong> ({droppingStudent.student_code || 'ID Pending'})
            </p>

            <form onSubmit={handleDropoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="admin_drop_reason" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Dropout Reason *
                </label>
                <select
                  id="admin_drop_reason"
                  value={dropoutForm.dropout_reason}
                  onChange={e => setDropoutForm({ ...dropoutForm, dropout_reason: e.target.value })}
                  style={{ ...inputStyle, width: '100%', background: '#071d20' }}
                >
                  <option value="Time constraints / Schedule conflict">Time constraints / Schedule conflict</option>
                  <option value="Financial reasons / Fee constraints">Financial reasons / Fee constraints</option>
                  <option value="Personal / Medical / Family commitments">Personal / Medical / Family commitments</option>
                  <option value="Relocated / Moved abroad">Relocated / Moved abroad</option>
                  <option value="Difficulty with curriculum / Course load">Difficulty with curriculum / Course load</option>
                  <option value="Unresponsive / Long-term absent">Unresponsive / Long-term absent</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="admin_drop_date" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Dropout Effective Date *
                </label>
                <input
                  id="admin_drop_date"
                  type="date"
                  required
                  value={dropoutForm.dropped_at}
                  onChange={e => setDropoutForm({ ...dropoutForm, dropped_at: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="admin_drop_remarks" style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Remarks / Notes
                </label>
                <textarea id="admin_drop_remarks"
                  rows={3}
                  value={dropoutForm.dropout_remarks}
                  onChange={e => setDropoutForm({ ...dropoutForm, dropout_remarks: e.target.value })}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                  placeholder="Provide context (e.g. Student requested withdrawal due to university exam clashes)..."
                />
              </div>

              <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.25)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: '#ff9999' }}>
                Note: Marking as Dropout will disable portal login. You can restore access anytime using <strong>Reactivate</strong>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDroppingStudent(null)}
                  className="glass-panel"
                  style={{ padding: '8px 16px', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDropout}
                  className="glass-panel"
                  style={{ padding: '8px 20px', fontSize: '0.85rem', cursor: isSubmittingDropout ? 'not-allowed' : 'pointer', background: '#e74c3c', color: '#fff', border: 'none' }}
                >
                  {isSubmittingDropout ? 'Processing...' : 'Confirm Dropout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
