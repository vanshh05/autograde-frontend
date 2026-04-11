import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api';
import { useAuth } from '../AuthContext';
import { BookOpen, Zap, ArrowRight, PlusSquare, GraduationCap, Send } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCourses()
      .then(d=>setCourses(d.courses||[]))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';

  return (
    <div className="page" style={{maxWidth:1000}}>
      <div className="page-header">
        <div>
          <p className="page-label">{greeting} 👋</p>
          <h1 className="page-title">{user?.fullName||'Teacher'}</h1>
          <p className="page-sub">Manage assignments, grade with AI, and sync scores to Classroom.</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <Link to="/create" className="btn btn-teal"><PlusSquare size={14}/> Create Assignment</Link>
          <Link to="/courses" className="btn btn-primary"><Zap size={14}/> Grade Now</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats fade-up">
        {[
          { icon:<BookOpen size={15}/>, label:'Active Courses', value:loading?'—':courses.length, color:'purple' },
          { icon:<PlusSquare size={15}/>, label:'Create Assignment', value:'Upload file → Publish', color:'teal', link:'/create' },
          { icon:<GraduationCap size={15}/>, label:'AI Grading', value:'Gemini 2.0', color:'green' },
          { icon:<Send size={15}/>, label:'Sync to Classroom', value:'After grading', color:'blue' },
        ].map(s=><StatCard key={s.label} {...s}/>)}
      </div>

      {/* Workflow steps */}
      <div className="fade-up" style={{marginBottom:32,animationDelay:'0.05s'}}>
        <h2 className="section-title" style={{marginBottom:14}}>Workflow</h2>
        <div className="steps">
          {[
            { n:'1', title:'Create Assignment', desc:'Upload a question paper file. We publish it to Google Classroom and register it in our system.', color:'var(--teal)', link:'/create' },
            { n:'2', title:'Students Submit', desc:'Students submit their answers in Google Classroom as usual.', color:'var(--blue)' },
            { n:'3', title:'AI Grades', desc:'Set your rubric and strictness. Gemini AI grades all submissions in a background queue.', color:'var(--accent-2)' },
            { n:'4', title:'Sync to Classroom', desc:'One click pushes assigned grades back to Google Classroom for all students.', color:'var(--green)' },
          ].map(s=>(
            <div key={s.n} className="step card" onClick={s.link?()=>window.location.href=s.link:undefined} style={{cursor:s.link?'pointer':'default'}}>
              <div className="step-n" style={{background:`${s.color}22`,color:s.color}}>{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Courses grid */}
      <div className="fade-up" style={{animationDelay:'0.1s'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <h2 className="section-title">Your Courses</h2>
          <Link to="/courses" className="btn btn-ghost btn-sm">View all <ArrowRight size={12}/></Link>
        </div>
        {error && <div className="error-banner">{error.includes('401')||error.includes('403')?'Google Classroom not connected — re-login with Google OAuth.':error}</div>}
        {loading ? (
          <div className="cg"><div className="skeleton" style={{height:96}}/><div className="skeleton" style={{height:96}}/><div className="skeleton" style={{height:96}}/></div>
        ) : courses.length===0 ? (
          <div className="empty-state"><BookOpen size={34} style={{opacity:0.25}}/><p>No active courses found.</p><p className="hint">Sign in with a teacher Google account to see courses.</p></div>
        ) : (
          <div className="cg">
            {courses.slice(0,6).map(c=>(
              <Link key={c.id} to={`/courses/${c.id}`} className="card cc">
                <div className="cc-top"><div className="cc-icon">{(c.name||'C')[0]}</div><span className="badge badge-green">Active</span></div>
                <div className="cc-name">{c.name}</div>
                {c.section&&<div className="cc-meta">{c.section}</div>}
                <div className="cc-foot"><span className="mono" style={{fontSize:10,color:'var(--text-3)'}}>{c.id}</span><ArrowRight size={12} style={{color:'var(--accent)'}}/></div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dash-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
        .section-title{font-size:15px;font-weight:700;}
        .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        .step{padding:18px;display:flex;flex-direction:column;gap:8px;}
        .step-n{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;}
        .step-title{font-size:13px;font-weight:600;}
        .step-desc{font-size:11px;color:var(--text-3);line-height:1.6;}
        .cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
        .cc{padding:16px;text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:6px;cursor:pointer;}
        .cc:hover{border-color:var(--accent);box-shadow:0 4px 18px var(--accent-glow);transform:translateY(-2px);}
        .cc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;}
        .cc-icon{width:32px;height:32px;border-radius:7px;background:var(--accent-glow);border:1px solid rgba(124,106,247,0.22);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:700;color:var(--accent-2);font-size:14px;}
        .cc-name{font-size:13px;font-weight:600;line-height:1.3;}
        .cc-meta{font-size:11px;color:var(--text-3);}
        .cc-foot{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:9px;border-top:1px solid var(--border);}
        @media(max-width:900px){.dash-stats{grid-template-columns:repeat(2,1fr);}.steps{grid-template-columns:repeat(2,1fr);}}
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, color, link }) {
  const C = { purple:{bg:'var(--accent-glow)',c:'var(--accent-2)'}, green:{bg:'var(--green-bg)',c:'var(--green)'}, blue:{bg:'var(--blue-bg)',c:'var(--blue)'}, yellow:{bg:'var(--yellow-bg)',c:'var(--yellow)'}, teal:{bg:'var(--teal-bg)',c:'var(--teal)'} }[color];
  const El = link ? Link : 'div';
  return (
    <El to={link} className="card" style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:8,textDecoration:'none',cursor:link?'pointer':'default',transition:'all 0.18s'}}
      onMouseEnter={link?e=>e.currentTarget.style.borderColor='var(--accent)':undefined}
      onMouseLeave={link?e=>e.currentTarget.style.borderColor='':undefined}>
      <div style={{width:30,height:30,borderRadius:7,background:C.bg,color:C.c,display:'flex',alignItems:'center',justifyContent:'center'}}>{icon}</div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:link?13:22,fontWeight:800,color:link?C.c:undefined,lineHeight:1.3}}>{value}</div>
      <div style={{fontSize:11,color:'var(--text-3)'}}>{label}</div>
    </El>
  );
}
