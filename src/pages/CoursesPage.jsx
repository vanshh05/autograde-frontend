import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api';
import { BookOpen, Search, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCourses = () => {
    setLoading(true);
    setError('');
    getCourses()
      .then(d => setCourses(d.courses || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const filtered = courses.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.section || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-label">Google Classroom</p>
          <h1 className="page-title">Your Courses</h1>
          <p className="page-sub">Select a course to view assignments and start grading.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchCourses} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
          Refresh
        </button>
      </div>

      <div className="search-bar fade-up">
        <Search size={15} style={{ color: 'var(--text-3)' }} />
        <input
          className="search-input"
          placeholder="Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-banner fade-up">
          <AlertTriangle size={16} />
          {error.includes('401') || error.includes('403')
            ? 'Google Classroom access not available. Please re-login with Google OAuth to grant classroom permissions.'
            : error}
        </div>
      )}

      {loading ? (
        <div className="course-list fade-up">
          {[1,2,3,4].map(i => (
            <div key={i} className="card course-row-skeleton">
              <div className="skeleton" style={{ height: 18, width: '30%' }} />
              <div className="skeleton" style={{ height: 14, width: '15%' }} />
              <div className="skeleton" style={{ height: 30, width: 80 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state fade-up">
          <BookOpen size={40} style={{ opacity: 0.3 }} />
          <p>{search ? `No courses match "${search}"` : 'No active courses found.'}</p>
        </div>
      ) : (
        <div className="course-list fade-up">
          {filtered.map((course, i) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="card course-row"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="course-row-left">
                <div className="course-row-icon">{(course.name || 'C')[0]}</div>
                <div>
                  <div className="course-row-name">{course.name}</div>
                  <div className="course-row-meta">
                    {[course.section, course.room && `Room ${course.room}`].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
              <div className="course-row-right">
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{course.id}</span>
                <span className="badge badge-green">Active</span>
                <ArrowRight size={15} style={{ color: 'var(--accent)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .page { padding: 40px; max-width: 900px; }
        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .page-label { font-size: 13px; color: var(--text-3); margin-bottom: 6px; font-family: 'DM Mono', monospace; }
        .page-title { font-size: 32px; font-weight: 800; margin-bottom: 6px; }
        .page-sub { color: var(--text-2); font-size: 14px; }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 16px;
          margin-bottom: 24px;
          transition: border-color 0.18s;
        }
        .search-bar:focus-within { border-color: var(--accent); }
        .search-input {
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          flex: 1;
        }
        .search-input::placeholder { color: var(--text-3); }
        .course-list { display: flex; flex-direction: column; gap: 10px; }
        .course-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        .course-row:hover {
          border-color: var(--accent);
          transform: translateX(4px);
        }
        .course-row-left { display: flex; align-items: center; gap: 14px; }
        .course-row-icon {
          width: 42px; height: 42px;
          border-radius: 10px;
          background: var(--accent-glow);
          border: 1px solid rgba(124,106,247,0.3);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: var(--accent-2);
          font-size: 18px;
          flex-shrink: 0;
        }
        .course-row-name { font-size: 15px; font-weight: 600; }
        .course-row-meta { font-size: 12px; color: var(--text-3); margin-top: 3px; }
        .course-row-right { display: flex; align-items: center; gap: 14px; }
        .course-row-skeleton { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; }
        .error-banner {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 14px 16px;
          background: var(--red-bg); border: 1px solid rgba(248,113,113,0.2);
          border-radius: var(--radius-sm); color: var(--red);
          font-size: 13px; margin-bottom: 20px; line-height: 1.6;
        }
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 10px;
          padding: 60px; color: var(--text-2); text-align: center;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
