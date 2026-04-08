import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api';
import { useAuth } from '../AuthContext';
import { BookOpen, GraduationCap, Zap, ArrowRight, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCourses()
      .then(d => setCourses(d.courses || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-label">{greeting} 👋</p>
          <h1 className="page-title">{user?.fullName || 'Teacher'}</h1>
          <p className="page-sub">Here's an overview of your Google Classroom courses.</p>
        </div>
        <Link to="/courses" className="btn btn-primary">
          <Zap size={15} />
          Start Grading
        </Link>
      </div>

      {/* Stats row */}
      <div className="stats-row fade-up">
        <StatCard label="Active Courses" value={loading ? '—' : courses.length} icon={<BookOpen size={18} />} color="purple" />
        <StatCard label="Ready to Grade" value={loading ? '—' : courses.length} icon={<GraduationCap size={18} />} color="green" />
        <StatCard label="AI Model" value="Gemini" icon={<Zap size={18} />} color="yellow" />
      </div>

      {/* Courses preview */}
      <div className="section fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="section-header">
          <h2 className="section-title">Your Courses</h2>
          <Link to="/courses" className="btn btn-ghost btn-sm">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={16} />
            {error.includes('401') || error.includes('403')
              ? 'Google Classroom access not connected. Please re-login with Google OAuth.'
              : error}
          </div>
        )}

        {loading ? (
          <div className="course-grid">
            {[1,2,3].map(i => (
              <div key={i} className="card course-card-skeleton">
                <div className="skeleton" style={{ height: 22, width: '60%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 14, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={40} style={{ opacity: 0.3 }} />
            <p>No active courses found in Google Classroom.</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Make sure you're logged in with a teacher Google account.</p>
          </div>
        ) : (
          <div className="course-grid">
            {courses.slice(0, 6).map(course => (
              <Link key={course.id} to={`/courses/${course.id}`} className="card course-card">
                <div className="course-card-header">
                  <div className="course-card-icon">{(course.name || 'C')[0]}</div>
                  <span className="badge badge-green">Active</span>
                </div>
                <h3 className="course-card-name">{course.name}</h3>
                {course.section && <p className="course-card-meta">{course.section}</p>}
                {course.room && <p className="course-card-meta">Room {course.room}</p>}
                <div className="course-card-footer">
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{course.id}</span>
                  <ArrowRight size={13} style={{ color: 'var(--accent)' }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .page {
          padding: 40px;
          max-width: 1100px;
        }
        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .page-label {
          font-size: 13px;
          color: var(--text-3);
          margin-bottom: 6px;
          font-family: 'DM Mono', monospace;
        }
        .page-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .page-sub {
          color: var(--text-2);
          font-size: 14px;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        .section { margin-bottom: 40px; }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
        }
        .course-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .course-card {
          padding: 20px;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s;
        }
        .course-card:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 24px var(--accent-glow);
          transform: translateY(-2px);
        }
        .course-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .course-card-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          background: var(--accent-glow);
          border: 1px solid rgba(124,106,247,0.3);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: var(--accent-2);
          font-size: 16px;
        }
        .course-card-name {
          font-size: 15px;
          font-weight: 600;
          line-height: 1.3;
        }
        .course-card-meta {
          font-size: 12px;
          color: var(--text-3);
        }
        .course-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .course-card-skeleton { padding: 20px; }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 60px;
          color: var(--text-2);
          text-align: center;
        }
        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--red-bg);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: var(--radius-sm);
          color: var(--red);
          font-size: 13px;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    purple: { bg: 'var(--accent-glow)', text: 'var(--accent-2)', border: 'rgba(124,106,247,0.2)' },
    green: { bg: 'var(--green-bg)', text: 'var(--green)', border: 'rgba(52,211,153,0.2)' },
    yellow: { bg: 'var(--yellow-bg)', text: 'var(--yellow)', border: 'rgba(251,191,36,0.2)' },
  };
  const c = colors[color] || colors.purple;
  return (
    <div className="card stat-card" style={{ padding: '20px 24px' }}>
      <div className="stat-icon" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <style>{`
        .stat-card { display: flex; flex-direction: column; gap: 8px; }
        .stat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; }
        .stat-label { font-size: 12px; color: var(--text-3); }
      `}</style>
    </div>
  );
}
