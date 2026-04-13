import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { getCourses, getCreatedCourseWork, getNotCreatedCourseWork } from '../api';
import toast from 'react-hot-toast';

export default function GradesIndexPage() {
  const nav = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState('');
  const [created, setCreated] = useState([]);
  const [notCreated, setNotCreated] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingCW, setLoadingCW] = useState(false);

  useEffect(() => {
    getCourses().then(d=>setCourses(d.courses||[])).catch(e=>toast.error(e.message)).finally(()=>setLoadingCourses(false));
  }, []);

  const handleSelect = async (id) => {
    setSelected(id); setCreated([]); setNotCreated([]);
    if (!id) return;
    setLoadingCW(true);
    try {
      const [c, n] = await Promise.all([getCreatedCourseWork(id), getNotCreatedCourseWork(id)]);
      setCreated(c.courseWork||[]); setNotCreated(n.courseWork||[]);
    } catch(e) { toast.error(e.message); }
    finally { setLoadingCW(false); }
  };

  return (
    <div className="page-wrap">
      <div className="fade-up" style={{marginBottom:32}}>
        <p className="page-eyebrow">Results</p>
        <h1 className="page-title">Grade Results</h1>
        <p className="page-sub" style={{marginBottom:24}}>Select a course and assignment to view AI grading results.</p>
        <div style={{maxWidth:440}}>
          <label className="form-label">COURSE</label>
          <select className="form-input" style={{height:48}} value={selected} onChange={e=>handleSelect(e.target.value)} disabled={loadingCourses}>
            <option value="">— Select a course —</option>
            {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loadingCW && <div style={{display:'flex',alignItems:'center',gap:10,color:'#475569',fontSize:13}}><span className="spinner"/> Loading assignments…</div>}

      {!loadingCW && selected && (created.length>0||notCreated.length>0) && (
        <div className="fade-up" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,animationDelay:'0.05s'}}>
          {/* Graded */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <TrendingUp size={18} color="#22d3ee"/>
              <h2 style={{fontSize:18,fontWeight:500,color:'#34d399'}}>Graded via AutoGrade.ai</h2>
              <span className="badge badge-emerald" style={{marginLeft:'auto'}}>{created.length}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {created.length===0 ? (
                <div className="glass-card" style={{padding:20,textAlign:'center',fontSize:12,color:'#475569'}}>No graded assignments found.</div>
              ) : created.map(cw=>(
                <div key={cw.id} className="glass-card result-row emerald-row" onClick={()=>nav(`/grades/${selected}/${cw.id}`)}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:500,marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{cw.title}</div>
                    <div style={{fontSize:11,color:'#475569'}}>{cw.maxPoints!=null?`${cw.maxPoints} pts · `:''}<span style={{fontFamily:'monospace'}}>{cw.id}</span></div>
                  </div>
                  <span className="badge badge-cyan" style={{fontSize:9,flexShrink:0}}>Sync</span>
                  <ArrowRight size={16} color="#334155" style={{flexShrink:0}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Not graded */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <Clock size={18} color="#a78bfa"/>
              <h2 style={{fontSize:18,fontWeight:500,color:'#94a3b8'}}>Not Yet Graded</h2>
              <span className="badge badge-slate" style={{marginLeft:'auto'}}>{notCreated.length}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {notCreated.length===0 ? (
                <div className="glass-card" style={{padding:20,textAlign:'center',fontSize:12,color:'#475569'}}>No ungraded assignments found.</div>
              ) : notCreated.map(cw=>(
                <div key={cw.id} className="glass-card result-row" onClick={()=>nav(`/grades/${selected}/${cw.id}`)}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:500,marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{cw.title}</div>
                    <div style={{fontSize:11,color:'#475569'}}>{cw.maxPoints!=null?`${cw.maxPoints} pts · `:''}<span style={{fontFamily:'monospace'}}>{cw.id}</span></div>
                  </div>
                  <ArrowRight size={16} color="#334155" style={{flexShrink:0}}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loadingCW && selected && created.length===0 && notCreated.length===0 && (
        <div className="glass-card" style={{padding:40,textAlign:'center',color:'#475569',fontSize:13}}>No assignments found for this course.</div>
      )}

      <style>{`
        .result-row { display:flex; align-items:center; gap:12px; padding:16px 20px; cursor:pointer; transition:border-color 0.18s, transform 0.18s; }
        .result-row:hover { transform:translateX(2px); }
        .emerald-row:hover { border-color:rgba(16,185,129,0.3); }
        @media(max-width:640px) { div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns:1fr !important; } }
      `}</style>
    </div>
  );
}
