import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api';
import { BookOpen, Search, ArrowRight, RefreshCw, PlusSquare } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetch = () => {
    setLoading(true); setError('');
    getCourses().then(d=>setCourses(d.courses||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  };
  useEffect(()=>{ fetch(); },[]);

  const filtered = courses.filter(c=>
    (c.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (c.section||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page" style={{maxWidth:860}}>
      <div className="page-header">
        <div>
          <p className="page-label">Google Classroom</p>
          <h1 className="page-title">Courses</h1>
          <p className="page-sub">Select a course to view and grade assignments.</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <Link to="/create" className="btn btn-teal btn-sm"><PlusSquare size={13}/> New Assignment</Link>
          <button className="btn btn-secondary btn-sm" onClick={fetch} disabled={loading}><RefreshCw size={12} className={loading?'spin':''}/> Refresh</button>
        </div>
      </div>

      <div className="search-bar fade-up">
        <Search size={13} style={{color:'var(--text-3)',flexShrink:0}}/>
        <input className="search-inp" placeholder="Search courses…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {error && <div className="error-banner fade-up">{error.includes('401')||error.includes('403')?'Google Classroom access required — re-login with Google OAuth.':error}</div>}

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:64}}/>)}
        </div>
      ) : filtered.length===0 ? (
        <div className="empty-state fade-up"><BookOpen size={34} style={{opacity:0.25}}/><p>{search?`No courses match "${search}"`:error?'':'No active courses found.'}</p></div>
      ) : (
        <div className="course-list fade-up">
          {filtered.map((c,i)=>(
            <Link key={c.id} to={`/courses/${c.id}`} className="card c-row" style={{animationDelay:`${i*0.035}s`}}>
              <div className="cr-l">
                <div className="cr-ic">{(c.name||'C')[0]}</div>
                <div>
                  <div className="cr-name">{c.name}</div>
                  <div className="cr-meta">{[c.section,c.room&&`Room ${c.room}`].filter(Boolean).join(' · ')||<span className="mono" style={{fontSize:10}}>{c.id}</span>}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span className="badge badge-green">Active</span>
                <ArrowRight size={13} style={{color:'var(--accent)'}}/>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .search-bar{display:flex;align-items:center;gap:9px;background:var(--bg-1);border:1px solid var(--border);border-radius:var(--radius-sm);padding:9px 13px;margin-bottom:18px;transition:border-color 0.18s;}
        .search-bar:focus-within{border-color:var(--accent);}
        .search-inp{background:none;border:none;outline:none;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;flex:1;}
        .search-inp::placeholder{color:var(--text-3);}
        .course-list{display:flex;flex-direction:column;gap:8px;}
        .c-row{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;text-decoration:none;color:inherit;cursor:pointer;transition:all 0.18s;}
        .c-row:hover{border-color:var(--accent);transform:translateX(3px);}
        .cr-l{display:flex;align-items:center;gap:12px;}
        .cr-ic{width:38px;height:38px;border-radius:9px;background:var(--accent-glow);border:1px solid rgba(124,106,247,0.2);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:700;color:var(--accent-2);font-size:15px;flex-shrink:0;}
        .cr-name{font-size:14px;font-weight:600;}
        .cr-meta{font-size:11px;color:var(--text-3);margin-top:2px;}
      `}</style>
    </div>
  );
}
