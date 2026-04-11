import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api';
import { useAuth } from '../AuthContext';
import { BookOpen, Zap, ArrowRight, AlertTriangle, GraduationCap, Upload } from 'lucide-react';

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
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="page-label">{greeting} 👋</p>
          <h1 className="page-title">{user?.fullName || 'Teacher'}</h1>
          <p className="page-sub">Manage your courses and AI grading jobs.</p>
        </div>
        <Link to="/courses" className="btn btn-primary">
          <Zap size={14}/> Start Grading
        </Link>
      </div>

      {/* Stat cards */}
      <div className="dash-stats fade-up">
        <StatCard icon={<BookOpen size={16}/>} label="Active Courses" value={loading ? '—' : courses.length} color="purple"/>
        <StatCard icon={<GraduationCap size={16}/>} label="Ready to Grade" value={loading ? '—' : courses.length} color="green"/>
        <StatCard icon={<Upload size={16}/>} label="Sync to Classroom" value="PATCH" color="blue"/>
        <StatCard icon={<Zap size={16}/>} label="AI Model" value="Gemini" color="yellow"/>
      </div>

      {/* How it works */}
      <div className="how-section fade-up" style={{animationDelay:'0.05s'}}>
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          {[
            { n:'1', title:'Select a course', desc:'Pick an active Google Classroom course from your list.' },
            { n:'2', title:'Configure grading', desc:'Set your rubric, strictness level. Max score & Drive files are auto-detected.' },
            { n:'3', title:'Start AI grading', desc:'Gemini grades all student submissions in the background via a job queue.' },
            { n:'4', title:'Sync to Classroom', desc:'One click pushes all AI scores back to Google Classroom as assigned grades.' },
          ].map(s => (
            <div key={s.n} className="step-card card">
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent courses */}
      <div className="fade-up" style={{animationDelay:'0.1s'}}>
        <div className="section-header">
          <h2 className="section-title">Your Courses</h2>
          <Link to="/courses" className="btn btn-ghost btn-sm">View all <ArrowRight size={12}/></Link>
        </div>

        {error && (
          <div className="error-banner"><AlertTriangle size={15}/>{error.includes('401')||error.includes('403') ? 'Google Classroom not connected — please re-login with Google OAuth.' : error}</div>
        )}

        {loading ? (
          <div className="course-grid">
            {[1,2,3].map(i=><div key={i} className="card" style={{padding:20}}><div className="skeleton" style={{height:18,width:'55%',marginBottom:8}}/><div className="skeleton" style={{height:13,width:'30%'}}/></div>)}
          </div>
        ) : courses.length === 0 && !error ? (
          <div className="empty-state"><BookOpen size={36} style={{opacity:0.25}}/><p>No active courses found.</p><p className="hint">Make sure you're signed in with a teacher Google account.</p></div>
        ) : (
          <div className="course-grid">
            {courses.slice(0,6).map(c => (
              <Link key={c.id} to={`/courses/${c.id}`} className="card course-card">
                <div className="cc-top">
                  <div className="cc-icon">{(c.name||'C')[0]}</div>
                  <span className="badge badge-green">Active</span>
                </div>
                <div className="cc-name">{c.name}</div>
                {c.section && <div className="cc-meta">{c.section}</div>}
                <div className="cc-footer">
                  <span className="mono" style={{fontSize:10,color:'var(--text-3)'}}>{c.id}</span>
                  <ArrowRight size={13} style={{color:'var(--accent)'}}/>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dash-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:36px; }
        .how-section { margin-bottom:36px; }
        .steps { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:16px; }
        .step-card { padding:18px; display:flex; flex-direction:column; gap:8px; }
        .step-num { width:26px; height:26px; border-radius:6px; background:var(--accent-glow); color:var(--accent-2); display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:12px; font-weight:700; }
        .step-title { font-size:13px; font-weight:600; }
        .step-desc { font-size:12px; color:var(--text-3); line-height:1.6; }
        .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .section-title { font-size:16px; font-weight:700; }
        .course-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; }
        .course-card { padding:18px; text-decoration:none; color:inherit; display:flex; flex-direction:column; gap:7px; cursor:pointer; }
        .course-card:hover { border-color:var(--accent); box-shadow:0 4px 20px var(--accent-glow); transform:translateY(-2px); }
        .cc-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
        .cc-icon { width:34px; height:34px; border-radius:8px; background:var(--accent-glow); border:1px solid rgba(124,106,247,0.25); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-weight:700; color:var(--accent-2); font-size:15px; }
        .cc-name { font-size:14px; font-weight:600; line-height:1.3; }
        .cc-meta { font-size:11px; color:var(--text-3); }
        .cc-footer { display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-top:10px; border-top:1px solid var(--border); }
        @media(max-width:900px){ .dash-stats{grid-template-columns:repeat(2,1fr);} .steps{grid-template-columns:repeat(2,1fr);} }
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const c = { purple:{bg:'var(--accent-glow)',text:'var(--accent-2)'}, green:{bg:'var(--green-bg)',text:'var(--green)'}, blue:{bg:'var(--blue-bg)',text:'var(--blue)'}, yellow:{bg:'var(--yellow-bg)',text:'var(--yellow)'} }[color];
  return (
    <div className="card" style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:8}}>
      <div style={{width:32,height:32,borderRadius:7,background:c.bg,color:c.text,display:'flex',alignItems:'center',justifyContent:'center'}}>{icon}</div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800}}>{value}</div>
      <div style={{fontSize:11,color:'var(--text-3)'}}>{label}</div>
    </div>
  );
}
