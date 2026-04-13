import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Trophy, BarChart3, RefreshCw, Search, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';
import { getDashboard, getCreatedCourseWork, syncMarksToClassroom } from '../api';
import toast from 'react-hot-toast';

const GRADE_C = {
  A: {bg:'rgba(34,197,94,0.15)',  color:'#4ade80', border:'rgba(34,197,94,0.3)'},
  B: {bg:'rgba(6,182,212,0.15)',  color:'#22d3ee', border:'rgba(6,182,212,0.3)'},
  C: {bg:'rgba(234,179,8,0.15)',  color:'#facc15', border:'rgba(234,179,8,0.3)'},
  D: {bg:'rgba(239,68,68,0.15)',  color:'#f87171', border:'rgba(239,68,68,0.3)'},
};
const REMARK_C = {
  Excellent: {bg:'rgba(34,197,94,0.12)',  color:'#4ade80', border:'rgba(34,197,94,0.25)'},
  Good:      {bg:'rgba(6,182,212,0.12)',  color:'#22d3ee', border:'rgba(6,182,212,0.25)'},
  Fair:      {bg:'rgba(234,179,8,0.12)',  color:'#facc15', border:'rgba(234,179,8,0.25)'},
  Poor:      {bg:'rgba(139,92,246,0.12)',color:'#a78bfa', border:'rgba(139,92,246,0.25)'},
  'Very Poor':{bg:'rgba(239,68,68,0.12)',color:'#f87171', border:'rgba(239,68,68,0.25)'},
};

export default function GradePage() {
  const { courseId, courseWorkId } = useParams();
  const nav = useNavigate();
  const [results, setResults]     = useState([]);
  const [maxPoints, setMaxPoints] = useState(null);
  const [isCreated, setIsCreated] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [sort, setSort]           = useState('score_desc');
  const [expanded, setExpanded]   = useState(null);
  const [syncing, setSyncing]     = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    if (!courseId||!courseWorkId) return;
    Promise.all([getDashboard(courseId, courseWorkId), getCreatedCourseWork(courseId)])
      .then(([dash, cwData]) => {
        setResults(dash.results||[]);
        const cw = (cwData.courseWork||[]).find(c=>c.id===courseWorkId);
        if (cw) { setIsCreated(true); if (cw.maxPoints!=null) setMaxPoints(cw.maxPoints); }
      })
      .catch(e=>toast.error(e.message))
      .finally(()=>setLoading(false));
  }, [courseId, courseWorkId]);

  const max = maxPoints ?? (results.length ? Math.max(...results.map(r=>r.score)) : 100);
  const avg = results.length ? (results.reduce((s,r)=>s+r.score,0)/results.length).toFixed(1) : 0;
  const top = results.length ? Math.max(...results.map(r=>r.score)) : 0;

  const filtered = results
    .filter(r=>(r.studentName||'').toLowerCase().includes(search.toLowerCase())||(r.studentEmail||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sort==='score_desc'?b.score-a.score:sort==='score_asc'?a.score-b.score:(a.studentName||'').localeCompare(b.studentName||''));

  const scoreColor = (score) => {
    const p = max>0?(score/max)*100:0;
    if (p>=80) return '#22c55e';
    if (p>=60) return '#22d3ee';
    if (p>=40) return '#eab308';
    return '#ef4444';
  };

  const syncMarks = async () => {
    setSyncing(true);
    try { const res = await syncMarksToClassroom(courseId,courseWorkId); setSyncResult(res); toast.success(`Synced ${res.patchedCount} grades!`); }
    catch(e) { toast.error(e.message); }
    finally { setSyncing(false); }
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="fade-up" style={{marginBottom:32}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <button onClick={()=>nav('/grades')} className="back-btn-g"><ArrowLeft size={18} color="#94a3b8"/></button>
            <div>
              <p style={{fontSize:12,color:'#475569',marginBottom:2,fontFamily:'monospace'}}>{courseWorkId}</p>
              <h1 className="page-title" style={{marginBottom:0}}>Grade Results</h1>
            </div>
          </div>
          {isCreated && results.length>0 && (
            <button className="btn btn-sync" onClick={syncMarks} disabled={syncing}>
              {syncing?<><span className="spinner" style={{width:14,height:14}}/> Syncing…</>:<><RefreshCw size={14}/> Sync to Classroom</>}
            </button>
          )}
        </div>
      </div>

      {/* Sync result */}
      {syncResult && (
        <div className="fade-up" style={{marginBottom:20,padding:'12px 16px',borderRadius:12,background:'rgba(6,182,212,0.06)',border:'1px solid rgba(6,182,212,0.2)',display:'flex',alignItems:'center',gap:10,fontSize:13,flexWrap:'wrap'}}>
          <Send size={13} color="#22d3ee" style={{flexShrink:0}}/>
          <span>Sync complete — <strong style={{color:'#34d399'}}>{syncResult.patchedCount} synced</strong>, {syncResult.missingSubmissionCount} missing, {syncResult.failedCount} failed.</span>
        </div>
      )}

      {/* Stats */}
      {results.length>0 && (
        <div className="fade-up" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24,animationDelay:'0.05s'}}>
          {[
            {icon:Users,     color:'#a78bfa', label:'Students', val:results.length},
            {icon:TrendingUp,color:'#22d3ee', label:'Average',  val:`${avg} / ${max}`},
            {icon:Trophy,    color:'#facc15', label:'Top Score',val:`${top} / ${max}`},
            {icon:BarChart3, color:'#60a5fa', label:'Graded',   val:results.filter(r=>r.status==='completed').length},
            {icon:RefreshCw, color:'#34d399', label:'Sync',     val:isCreated?'Available':'N/A', badge:isCreated},
          ].map((s,i)=>(
            <div key={s.label} className="glass-card" style={{padding:16}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <s.icon size={14} color={s.color}/><span style={{fontSize:11,color:'#475569'}}>{s.label}</span>
              </div>
              {s.badge ? <span className="badge badge-emerald" style={{fontSize:10}}>{s.val}</span> : <div style={{fontSize:20,fontWeight:500}}>{s.val}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="fade-up" style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',animationDelay:'0.1s'}}>
        <div style={{position:'relative',flex:1,minWidth:200}}>
          <Search size={14} color="#475569" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
          <input className="form-input" style={{paddingLeft:36,height:44}} placeholder="Search students..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-input" style={{width:160,height:44}} value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="score_desc">Highest first</option>
          <option value="score_asc">Lowest first</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:60}}/>)}</div>
      ) : filtered.length===0 ? (
        <div className="glass-card" style={{padding:48,textAlign:'center',color:'#475569'}}>
          <p>{results.length===0?'No grading results yet. Start a grading job from the Courses page.':`No results match "${search}"`}</p>
        </div>
      ) : (
        <div className="glass-card fade-up" style={{overflow:'hidden',animationDelay:'0.15s'}}>
          <div style={{display:'grid',gridTemplateColumns:'4fr 2fr 2fr 2fr 1fr 1fr',gap:16,padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',fontSize:11,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em'}}>
            <div>Student</div><div style={{textAlign:'center'}}>Score / {max}</div><div style={{textAlign:'center'}}>Grade</div><div style={{textAlign:'center'}}>Remark</div><div style={{textAlign:'center'}}>Status</div><div/>
          </div>
          {filtered.map((r, i) => {
            const isOpen = expanded===r.studentId;
            const gc = GRADE_C[r.grade]||GRADE_C['D'];
            const rc = REMARK_C[r.remark]||REMARK_C['Fair'];
            const pct = max>0?Math.min((r.score/max)*100,100):0;
            return (
              <div key={r._id||r.studentId} style={{borderTop:i>0?'1px solid rgba(255,255,255,0.04)':'none'}}>
                <div
                  style={{display:'grid',gridTemplateColumns:'4fr 2fr 2fr 2fr 1fr 1fr',gap:16,padding:'16px 20px',cursor:'pointer',alignItems:'center',transition:'background 0.15s'}}
                  onClick={()=>setExpanded(isOpen?null:r.studentId)}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#2563eb)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:600,flexShrink:0}}>
                      {(r.studentName||'S')[0].toUpperCase()}
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.studentName}</div>
                      <div style={{fontSize:11,color:'#475569',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.studentEmail}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    <div style={{width:64,height:8,background:'#1e293b',borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:scoreColor(r.score),borderRadius:99}}/>
                    </div>
                    <span style={{fontSize:15,fontWeight:500,whiteSpace:'nowrap'}}>{r.score}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'center'}}>
                    <span style={{padding:'3px 12px',borderRadius:99,background:gc.bg,color:gc.color,border:`1px solid ${gc.border}`,fontSize:13,fontWeight:600}}>{r.grade}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'center'}}>
                    <span style={{padding:'3px 10px',borderRadius:99,background:rc.bg,color:rc.color,border:`1px solid ${rc.border}`,fontSize:11,fontWeight:500}}>{r.remark}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'center'}}>
                    <span className={`badge ${r.status==='completed'?'badge-green':r.status==='failed'?'badge-red':'badge-yellow'}`} style={{fontSize:10}}>{r.status}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'center'}}>
                    {isOpen?<ChevronUp size={16} color="#475569"/>:<ChevronDown size={16} color="#475569"/>}
                  </div>
                </div>
                {isOpen && (
                  <div style={{padding:'0 20px 20px',background:'rgba(15,23,42,0.3)'}}>
                    <div style={{padding:'20px 24px',borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                        <MessageSquare size={16} color="#34d399"/>
                        <span style={{fontSize:15,fontWeight:500,color:'#34d399'}}>AI Feedback</span>
                      </div>
                      <p style={{fontSize:13,color:'#94a3b8',lineHeight:1.75}}>{r.feedback||'No feedback provided.'}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .back-btn-g { width:40px; height:40px; border-radius:10px; background:rgba(15,23,42,0.5); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.2s; }
        .back-btn-g:hover { background:rgba(255,255,255,0.05); }
        @media(max-width:900px) { div[style*="gridTemplateColumns: repeat(5,1fr)"] { grid-template-columns:repeat(3,1fr) !important; } }
      `}</style>
    </div>
  );
}
