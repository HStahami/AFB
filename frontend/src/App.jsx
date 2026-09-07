import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';
import { Admission } from './pages/public/Admission';
import { AdminLogin } from './pages/admin/AdminLogin';

// Lazy-loaded Admin Dashboard
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Lazy-loaded Instructor Portal Pages
const InstructorLayout = lazy(() => import('./components/instructor/InstructorLayout').then(m => ({ default: m.InstructorLayout })));
const InstructorLogin = lazy(() => import('./pages/instructor/InstructorLogin').then(m => ({ default: m.InstructorLogin })));
const InstructorDashboard = lazy(() => import('./pages/instructor/InstructorDashboard').then(m => ({ default: m.InstructorDashboard })));
const InstructorStudents = lazy(() => import('./pages/instructor/InstructorStudents').then(m => ({ default: m.InstructorStudents })));
const InstructorStudentDetail = lazy(() => import('./pages/instructor/InstructorStudentDetail').then(m => ({ default: m.InstructorStudentDetail })));
const InstructorClasses = lazy(() => import('./pages/instructor/InstructorClasses').then(m => ({ default: m.InstructorClasses })));
const InstructorTasks = lazy(() => import('./pages/instructor/InstructorTasks').then(m => ({ default: m.InstructorTasks })));
const InstructorSubmissions = lazy(() => import('./pages/instructor/InstructorSubmissions').then(m => ({ default: m.InstructorSubmissions })));
const InstructorAttendance = lazy(() => import('./pages/instructor/InstructorAttendance').then(m => ({ default: m.InstructorAttendance })));
const InstructorResources = lazy(() => import('./pages/instructor/InstructorResources').then(m => ({ default: m.InstructorResources })));
const InstructorReports = lazy(() => import('./pages/instructor/InstructorReports').then(m => ({ default: m.InstructorReports })));
const InstructorNotifications = lazy(() => import('./pages/instructor/InstructorNotifications').then(m => ({ default: m.InstructorNotifications })));
const InstructorProfile = lazy(() => import('./pages/instructor/InstructorProfile').then(m => ({ default: m.InstructorProfile })));

// Lazy-loaded Student Portal Pages
const StudentLayout = lazy(() => import('./components/student/StudentLayout').then(m => ({ default: m.StudentLayout })));
const StudentLogin = lazy(() => import('./pages/student/StudentLogin').then(m => ({ default: m.StudentLogin })));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const StudentCourses = lazy(() => import('./pages/student/StudentCourses').then(m => ({ default: m.StudentCourses })));
const StudentCourseDetail = lazy(() => import('./pages/student/StudentCourseDetail').then(m => ({ default: m.StudentCourseDetail })));
const StudentTasks = lazy(() => import('./pages/student/StudentTasks').then(m => ({ default: m.StudentTasks })));
const StudentSubmissions = lazy(() => import('./pages/student/StudentSubmissions').then(m => ({ default: m.StudentSubmissions })));
const StudentAttendance = lazy(() => import('./pages/student/StudentAttendance').then(m => ({ default: m.StudentAttendance })));
const StudentResources = lazy(() => import('./pages/student/StudentResources').then(m => ({ default: m.StudentResources })));
const StudentReports = lazy(() => import('./pages/student/StudentReports').then(m => ({ default: m.StudentReports })));
const StudentNotifications = lazy(() => import('./pages/student/StudentNotifications').then(m => ({ default: m.StudentNotifications })));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile').then(m => ({ default: m.StudentProfile })));
const StudentSettings = lazy(() => import('./pages/student/StudentSettings').then(m => ({ default: m.StudentSettings })));

import './index.css';

function PortalFallback() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ padding: '2rem 3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-primary, #1B434D)', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    </div>
  );
}


function AdminRoute() {
  const { isAuthenticated, isAdmin, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '2rem 3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isAdmin) {
      return <AdminDashboard onLogout={logout} />;
    }
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '450px', textAlign: 'center' }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ color: '#b0c4c6', marginBottom: '1.5rem' }}>
            Your account does not have administrator privileges.
          </p>
          <button onClick={logout} className="btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return <AdminLogin />;
}

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isInstructorRoute = location.pathname.startsWith('/instructor');
  const isStudentRoute = location.pathname.startsWith('/student');
  const isPortalRoute = isAdminRoute || isInstructorRoute || isStudentRoute;

  return (
    <div className="app-container">
      {!isPortalRoute && (
        <div style={{ position: 'fixed', top: '1rem', left: '0', right: '0', zIndex: 100, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: '1200px' }}>
            <Navbar />
          </div>
        </div>
      )}

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: isInstructorRoute || isStudentRoute ? '0' : isAdminRoute ? '2rem' : '8rem',
          paddingLeft: isInstructorRoute || isStudentRoute ? '0' : isAdminRoute ? '2rem' : '0',
          paddingRight: isInstructorRoute || isStudentRoute ? '0' : isAdminRoute ? '2rem' : '0',
        }}
      >
        <ErrorBoundary>
          <Suspense fallback={<PortalFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admission" element={<Admission />} />
              <Route path="/admin" element={<AdminRoute />} />

              {/* Instructor Portal Routes */}
              <Route path="/instructor/login" element={<InstructorLogin />} />
              <Route
                path="/instructor"
                element={
                  <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                    <InstructorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<InstructorDashboard />} />
                <Route path="students" element={<InstructorStudents />} />
                <Route path="students/:id" element={<InstructorStudentDetail />} />
                <Route path="classes" element={<InstructorClasses />} />
                <Route path="tasks" element={<InstructorTasks />} />
                <Route path="submissions" element={<InstructorSubmissions />} />
                <Route path="attendance" element={<InstructorAttendance />} />
                <Route path="resources" element={<InstructorResources />} />
                <Route path="reports" element={<InstructorReports />} />
                <Route path="notifications" element={<InstructorNotifications />} />
                <Route path="profile" element={<InstructorProfile />} />
              </Route>

              {/* Student Portal Routes */}
              <Route path="/student/login" element={<StudentLogin />} />
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="courses" element={<StudentCourses />} />
                <Route path="courses/:id" element={<StudentCourseDetail />} />
                <Route path="tasks" element={<StudentTasks />} />
                <Route path="submissions" element={<StudentSubmissions />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="resources" element={<StudentResources />} />
                <Route path="reports" element={<StudentReports />} />
                <Route path="notifications" element={<StudentNotifications />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="settings" element={<StudentSettings />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {!isPortalRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
