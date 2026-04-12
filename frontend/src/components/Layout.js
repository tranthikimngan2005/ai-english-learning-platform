import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const SKILL_ICONS = { reading: '📖', listening: '🎧', writing: '✍️', speaking: '🗣️' };

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">Pen<span>win</span></span>
        </div>

        <div className="sidebar-user">
          <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.username}</div>
            <div className={`badge badge-${user?.role === 'admin' ? 'yellow' : user?.role === 'creator' ? 'blue' : 'green'}`} style={{ fontSize: 11 }}>
              {user?.role}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Learner</div>
          <NavItem to="/dashboard" end icon="◈" label="Dashboard" />
          <NavItem to="/skills"    icon="◎" label="Skills" />
          <NavItem to="/practice"  icon="▶" label="Practice" />
          <NavItem to="/review"    icon="↻" label="Review" />
          <NavItem to="/progress"  icon="▲" label="Progress" />
          <NavItem to="/chat"      icon="✦" label="AI Chat" />
          <NavItem to="/profile"   icon="◉" label="Profile" />

          {(user?.role === 'creator' || user?.role === 'admin') && (
            <>
              <div className="nav-section">Creator</div>
              <NavItem to="/creator/questions" icon="✚" label="Questions" />
              <NavItem to="/creator/lessons"   icon="✐" label="Lessons" />
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="nav-section">Admin</div>
              <NavItem to="/admin" icon="⬡" label="Dashboard" />
              <NavItem to="/admin/users"   icon="⬡" label="Users" />
              <NavItem to="/admin/content" icon="⬡" label="Moderation" />
            </>
          )}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>⎋</span> Logout
        </button>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
