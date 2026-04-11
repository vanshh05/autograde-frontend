import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getCourseWork } from '../api';
import { BarChart2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GradesIndexPage() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState('');
  const [courseWork, setCourseWork] = useState([]);
  const [loadingC, setLoadingC] = useState(true);
  const [loadingCW, setLoadingCW] = useState(false);

  useEffect(() => {
    getCourses()
      .then(d => setCourses(d.courses || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoadingC(false));
  }, []);

  const handleSelect = async (id) => {
    setSelected(id); setCourseWork([]);
    if (!id) return;
    setLoadingCW(true);
    try { const d = await getCourseWork(id); setCourseWork(d.courseWork||[]); }
    catch(e) { toast.error(e.message); }
    finally { setLoadingCW(false); }
  };

  return (
    <div className="page" style={{maxWidth:700}}>
      <div style={{marginBottom:32}}>
        <p className="page-label">Results</p>
        <h1 className="page-title">Grade Results</h1>
        <p className="page-sub">Select a course and assignment to view AI grading results.</p>
      </div>

      <div className="input-group fade-up" style={{marginBottom:24}}>
        <label className="label">Course</label>
        <select className="input" value={selected} onChange={e=>handleSelect(e.target.value)} disabled={loadingC}>
          <option value="">— Select a course —</option>
          {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loadingCW && <div style={{display:'flex',alignItems:'center',gap:10,color:'var(--text-3)',fontSize:13}}><span className="spinner"/>Loading assignments…</div>}

      {!loadingCW && courseWork.length>0 && (
        <div className="fade-up">
          <p style={{fontSize:13,fontWeight:600,color:'var(--text-2)',marginBottom:12}}>Select an assignment</p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {courseWork.map(cw=>(
              <Link key={cw.id} to={`/grades/${selected}/${cw.id}`} className="card cw-link">
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>{cw.title}</div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                    {cw.maxPoints!=null&&<span>{cw.maxPoints} pts · </span>}
                    <span className="mono">{cw.id}</span>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <BarChart2 size={14} style={{color:'var(--accent)'}}/>
                  <ArrowRight size={14} style={{color:'var(--text-3)'}}/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loadingCW && selected && courseWork.length===0 && (
        <div className="empty-state"><BarChart2 size={36} style={{opacity:0.25}}/><p>No assignments found.</p></div>
      )}

      <style>{`
        .cw-link { display:flex; align-items:center; justify-content:space-between; padding:15px 18px; text-decoration:none; color:inherit; cursor:pointer; transition:all 0.18s; }
        .cw-link:hover { border-color:var(--accent); transform:translateX(3px); }
      `}</style>
    </div>
  );
}
