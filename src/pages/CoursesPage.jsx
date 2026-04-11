import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api';
import { BookOpen, Search, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetch = () => {
    setLoading(true); setError('');
    getCourses()
      .then(d => setCourses(d.courses || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const filtered = courses.filter(c =>
    (c.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (c.section||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-label">Google Classroom</p>
          <h1 className="page-title">Courses</h1>
          <p className="page-sub">Select a course to view assignments and start AI grading.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetch} disabled={loading}>
          <RefreshCw size={13} className={loading?'spin':''}/> Refresh
        </button>
      </div>

      <div className="search-row fade-up">
        <Search size={14} style={{color:'var(--text-3)',flexShrink:0}}/>
        <input className="search-input" placeholder="Search courses…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {error && <div className="error-banner fade-up"><AlertTriangle size={14}/>{error.includes('401')||error.includes('403') ? 'Google Classroom access not available. Re-login with Google OAuth.' : error}</div>}

      {loading ? (
        <div className="course-list">
          {[1,2,3,4].map(i=>(
            <div key={i} className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px'}}>
              <div className="skeleton" style={{height:16,width:'35%'}}/><div className="skeleton" style={{height:13,width:'12%'}}/>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state fade-up">
          <BookOpen size={36} style={{opacity:0.25}}/>
          <p>{search ? `No courses match "${search}"` : 'No active courses found.'}</p>
        </div>
      ) : (
        <div className="course-list fade-up">
          {filtered.map((c,i) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="card course-row" style={{animationDelay:`${i*0.04}s`}}>
              <div className="cr-left">
                <div className="cr-icon">{(c.name||'C')[0]}</div>
                <div>
                  <div className="cr-name">{c.name}</div>
                  <div className="cr-meta">{[c.section, c.room&&`Room ${c.room}`].filter(Boolean).join(' · ')}</div>
                </div>
              </div>
              <div className="cr-right">
                <span className="mono" style={{fontSize:10,color:'var(--text-3)'}}>{c.id}</span>
                <span className="badge badge-green">Active</span>
                <ArrowRight size={14} style={{color:'var(--accent)'}}/>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .search-row { display:flex; align-items:center; gap:10px; background:var(--bg-1); border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px 14px; margin-bottom:20px; transition:border-color 0.18s; }
        .search-row:focus-within { border-color:var(--accent); }
        .search-input { background:none; border:none; outline:none; color:var(--text); font-family:'DM Sans',sans-serif; font-size:14px; flex:1; }
        .search-input::placeholder { color:var(--text-3); }
        .course-list { display:flex; flex-direction:column; gap:8px; }
        .course-row { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; text-decoration:none; color:inherit; cursor:pointer; transition:all 0.18s; }
        .course-row:hover { border-color:var(--accent); transform:translateX(3px); }
        .cr-left { display:flex; align-items:center; gap:13px; }
        .cr-icon { width:40px; height:40px; border-radius:9px; background:var(--accent-glow); border:1px solid rgba(124,106,247,0.2); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-weight:700; color:var(--accent-2); font-size:16px; flex-shrink:0; }
        .cr-name { font-size:14px; font-weight:600; }
        .cr-meta { font-size:11px; color:var(--text-3); margin-top:2px; }
        .cr-right { display:flex; align-items:center; gap:12px; }
      `}</style>
    </div>
  );
}
