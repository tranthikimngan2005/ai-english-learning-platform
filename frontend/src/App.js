import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Layout       from './components/Layout';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Dashboard    from './pages/Dashboard';
import Skills       from './pages/Skills';
import Practice     from './pages/Practice';
import Review       from './pages/Review';
import Progress     from './pages/Progress';
import Chat         from './pages/Chat';
import Profile      from './pages/Profile';
import CreatorQuestions from './pages/CreatorQuestions';
import CreatorLessons   from './pages/CreatorLessons';
import AdminDashboard   from './pages/AdminDashboard';
import AdminUsers       from './pages/AdminUsers';
import AdminContent     from './pages/AdminContent';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"/></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"/></div>;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Student (all logged-in users) */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/skills"    element={<ProtectedRoute><Skills /></ProtectedRoute>} />
      <Route path="/practice"  element={<ProtectedRoute><Practice /></ProtectedRoute>} />
      <Route path="/review"    element={<ProtectedRoute><Review /></ProtectedRoute>} />
      <Route path="/progress"  element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="/chat"      element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Creator + Admin */}
      <Route path="/creator/questions" element={
        <ProtectedRoute roles={['creator','admin']}><CreatorQuestions /></ProtectedRoute>
      }/>
      <Route path="/creator/lessons" element={
        <ProtectedRoute roles={['creator','admin']}><CreatorLessons /></ProtectedRoute>
      }/>

      {/* Admin only */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
      }/>
      <Route path="/admin/users" element={
        <ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>
      }/>
      <Route path="/admin/content" element={
        <ProtectedRoute roles={['admin']}><AdminContent /></ProtectedRoute>
      }/>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
