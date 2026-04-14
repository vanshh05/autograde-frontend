import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, BookOpen, PlusCircle, BarChart3, LogOut, Menu, X, ChevronRight, Check, CreditCard } from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',         id: 'dashboard' },
  { to: '/courses',   icon: BookOpen,        label: 'Courses',            id: 'courses'   },
  { to: '/create',    icon: PlusCircle,      label: 'Create Assignment',  id: 'create'    },
  { to: '/grades',    icon: BarChart3,       label: 'Results',            id: 'results'   },
  { to: '/credits',   icon: CreditCard,      label: 'Buy Credits',         id: 'credits'   },
];

function SidebarContent({ user, logout, onNavClick, activeId }) {
  const nav = useNavigate();
  const initial = (user?.fullName || user?.email || 'U')[0].toUpperCase();

  return (
    <>
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-icon">
          <Check size={22} color="#34d399" strokeWidth={3}/>
        </div>
        <span className="sb-logo-text">AutoGrade<span>.ai</span></span>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {NAV.map(({ to, icon: Icon, label, id }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
            onClick={onNavClick}
          >
            <Icon size={20}/>
            <span>{label}</span>
            {id === 'courses' || id === 'results' ? <ChevronRight size={14} className="sb-link-arrow"/> : null}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="sb-user">
        <div className="sb-user-avatar">{initial}</div>
        <div style={{flex:1,minWidth:0}}>
          <div className="sb-user-name">{user?.fullName || 'Teacher'}</div>
          <div className="sb-user-email">{user?.email}</div>
        </div>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          style={{padding:6}}
          onClick={() => { logout(); nav('/'); }}
          title="Sign out"
        >
          <LogOut size={15} color="#64748b"/>
        </button>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <div className="bg-base"/>
      <div className="bg-blob-1"/>
      <div className="bg-blob-2"/>

      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn btn btn-outline btn-icon"
        style={{position:'fixed',top:20,left:20,zIndex:60,width:40,height:40,padding:0,alignItems:'center',justifyContent:'center'}}
        onClick={() => setOpen(o => !o)}
      >
        {open ? <X size={18}/> : <Menu size={18}/>}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <SidebarContent user={user} logout={logout} onNavClick={() => setOpen(false)}/>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)}/>}

      {/* Main */}
      <main className="main-content">{children}</main>
    </div>
  );
}
