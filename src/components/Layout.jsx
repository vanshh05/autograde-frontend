import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard, BookOpen, GraduationCap,
  LogOut, ChevronRight, Zap
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/grades', icon: GraduationCap, label: 'Grade Results' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="sidebar-logo">⚡</span>
            <span className="sidebar-brand-text">AutoGrade<span style={{ color: 'var(--accent-2)' }}>.ai</span></span>
          </div>

          <nav className="sidebar-nav">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={16} />
                <span>{label}</span>
                <ChevronRight size={14} className="sidebar-chevron" />
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">{(user.fullName || user.email || 'U')[0].toUpperCase()}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.fullName || 'Teacher'}</div>
                <div className="sidebar-user-email">{user.email}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 240px;
          flex-shrink: 0;
          background: var(--bg-1);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 12px;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px;
          margin-bottom: 32px;
        }
        .sidebar-logo {
          font-size: 20px;
          background: var(--accent);
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .sidebar-brand-text {
          font-family: 'Syne', sans-serif;
          font-size: 17px;
          font-weight: 700;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          color: var(--text-2);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s;
          position: relative;
        }
        .sidebar-link:hover {
          background: var(--bg-2);
          color: var(--text);
        }
        .sidebar-link.active {
          background: var(--accent-glow);
          color: var(--accent-2);
        }
        .sidebar-chevron {
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .sidebar-link:hover .sidebar-chevron,
        .sidebar-link.active .sidebar-chevron {
          opacity: 1;
        }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: var(--bg-2);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        .sidebar-avatar {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .sidebar-user-info {
          flex: 1;
          min-width: 0;
        }
        .sidebar-user-name {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-user-email {
          font-size: 11px;
          color: var(--text-3);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .main-content {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}
