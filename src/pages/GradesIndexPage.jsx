import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getCreatedCourseWork, getNotCreatedCourseWork } from '../api';
import { BarChart2, ArrowRight, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GradesIndexPage() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState('');
  const [created, setCreated] = useState([]);
  const [notCreated, setNotCreated] = useState([]);
  const [loadingC, setLoadingC] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    getCourses().then(d=>setCourses(d.courses||[])).catch(e=>toast.error(e.message)).finally(()=>setLoadingCourses(false));
  }, []);

  const handleSelect = async (id) => {
    setSelected(id); setCreated([]); setNotCreated([]);
    if (!id) return;
    setLoadingC(true);
    try {
      const [c, n] = await Promise.all([getCreatedCourseWork(id), getNotCreatedCourseWork(id)]);
      setCreated(c.courseWork||[]); setNotCreated(n.courseWork||[]);
    } catch(e) { toast.error(e.message); }
    finally { setLoadingC(false); }
  };

  return (
    <div className="page" style={{maxWidth:800}}>
      <div style={{marginBottom:28}}>
        <p className="page-label">Results</p>
        <h1 className="page-title">Grade Results</h1>
        <p className="page-sub">Select a course and assignment to view AI grading results.</p>
      </div>

      <div className="input-group fade-up" style={{marginBottom:24}}>
        <label className="label">Course</label>
        <select className="input" value={selected} onChange={e=>handleSelect(e.target.value)} disabled={loadingCourses}>
          <option value="">— Select a course —</option>
          {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loadingC && <div style={{display:'flex',alignItems:'center',gap:9,color:'var(--text-3)',fontSize:13}}><span className="spinner"/>Loading assignments…</div>}

      {!loadingC && selected && (created.length>0||notCreated.length>0) && (
        <div className="gi-cols fade-up">
          {/* Created */}
          <div className="gi-col">
            <div className="gi-ch teal">
              <Send size={12}/> AutoGrade.ai Assignments
              <span className="badge badge-teal" style={{marginLeft:'auto'}}>{created.length}</span>
            </div>
            {created.length===0 ? (
              <div className="gi-empty">No assignments created from AutoGrade.ai.</div>
            ) : created.map(cw=>(
              <Link key={cw.id} to={`/grades/${selected}/${cw.id}`} className="card gi-row">
                <div>
                  <div className="gi-title">{cw.title}</div>
                  <div className="gi-meta">{cw.maxPoints!=null&&`${cw.maxPoints} pts · `}<span className="mono">{cw.id}</span></div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span className="badge badge-teal" style={{fontSize:9}}>Sync</span>
                  <ArrowRight size={13} style={{color:'var(--teal)'}}/>
                </div>
              </Link>
            ))}
          </div>

          {/* Not created */}
          <div className="gi-col">
            <div className="gi-ch purple">
              <BarChart2 size={12}/> Imported from Classroom
              <span className="badge badge-purple" style={{marginLeft:'auto'}}>{notCreated.length}</span>
            </div>
            {notCreated.length===0 ? (
              <div className="gi-empty">No imported assignments.</div>
            ) : notCreated.map(cw=>(
              <Link key={cw.id} to={`/grades/${selected}/${cw.id}`} className="card gi-row">
                <div>
                  <div className="gi-title">{cw.title}</div>
                  <div className="gi-meta">{cw.maxPoints!=null&&`${cw.maxPoints} pts · `}<span className="mono">{cw.id}</span></div>
                </div>
                <ArrowRight size={13} style={{color:'var(--accent)'}}/>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loadingC && selected && created.length===0 && notCreated.length===0 && (
        <div className="empty-state fade-up"><BarChart2 size={34} style={{opacity:0.25}}/><p>No assignments found for this course.</p></div>
      )}

      <style>{`
        .gi-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .gi-col{display:flex;flex-direction:column;gap:7px;}
        .gi-ch{display:flex;align-items:center;gap:7px;padding:9px 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;}
        .gi-ch.teal{background:var(--teal-bg);color:var(--teal);border:1px solid rgba(45,212,191,0.2);}
        .gi-ch.purple{background:var(--accent-glow);color:var(--accent-2);border:1px solid rgba(124,106,247,0.2);}
        .gi-row{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;text-decoration:none;color:inherit;cursor:pointer;transition:all 0.17s;}
        .gi-row:hover{border-color:var(--accent);transform:translateX(2px);}
        .gi-title{font-size:13px;font-weight:600;margin-bottom:2px;}
        .gi-meta{font-size:10px;color:var(--text-3);}
        .gi-empty{font-size:12px;color:var(--text-3);padding:16px;text-align:center;background:var(--bg-1);border:1px dashed var(--border);border-radius:var(--radius-sm);}
        @media(max-width:640px){.gi-cols{grid-template-columns:1fr;}}
      `}</style>
    </div>
  );
}
