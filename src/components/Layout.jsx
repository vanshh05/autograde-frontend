import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, BookOpen, GraduationCap, LogOut, ChevronRight, Zap } from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses',   icon: BookOpen,        label: 'Courses'   },
  { to: '/grades',    icon: GraduationCap,   label: 'Results'   },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initial = (user?.fullName || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sb-brand">
            <span className="sb-logo">⚡</span>
            <span className="sb-name">AutoGrade<span style={{color:'var(--accent-2)'}}>.</span>ai</span>
          </div>
          <nav className="sb-nav">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}>
                <Icon size={15} />
                <span>{label}</span>
                <ChevronRight size={13} className="sb-arrow" />
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sb-user">
          <div className="sb-avatar">{initial}</div>
          <div className="sb-user-info">
            <div className="sb-user-name">{user?.fullName || 'Teacher'}</div>
            <div className="sb-user-email">{user?.email}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { logout(); nav('/'); }} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>

      <style>{`
        .layout { display:flex; min-height:100vh; }
        .sidebar { width:232px; flex-shrink:0; background:var(--bg-1); border-right:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between; padding:20px 10px; position:sticky; top:0; height:100vh; overflow:hidden; }
        .sidebar-top { display:flex; flex-direction:column; gap:0; }
        .sb-brand { display:flex; align-items:center; gap:9px; padding:4px 10px; margin-bottom:28px; }
        .sb-logo { font-size:18px; background:var(--accent); width:32px; height:32px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .sb-name { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; }
        .sb-nav { display:flex; flex-direction:column; gap:2px; }
        .sb-link { display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:var(--radius-sm); color:var(--text-2); text-decoration:none; font-size:13px; font-weight:500; transition:all 0.14s; }
        .sb-link:hover { background:var(--bg-2); color:var(--text); }
        .sb-link.active { background:var(--accent-glow); color:var(--accent-2); }
        .sb-arrow { margin-left:auto; opacity:0; transition:opacity 0.14s; }
        .sb-link:hover .sb-arrow, .sb-link.active .sb-arrow { opacity:1; }
        .sb-user { display:flex; align-items:center; gap:9px; padding:10px 10px; background:var(--bg-2); border-radius:var(--radius-sm); border:1px solid var(--border); }
        .sb-avatar { width:30px; height:30px; border-radius:7px; background:var(--accent); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:13px; font-weight:700; flex-shrink:0; }
        .sb-user-info { flex:1; min-width:0; }
        .sb-user-name { font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-user-email { font-size:10px; color:var(--text-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .main-content { flex:1; min-width:0; overflow-y:auto; }
        @media(max-width:768px){ .sidebar{display:none;} }
      `}</style>
    </div>
  );
}
