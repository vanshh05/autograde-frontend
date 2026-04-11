import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDashboard, getCourseWork, syncMarksToClassroom } from '../api';
import { ArrowLeft, Users, TrendingUp, Award, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const REMARK_COLOR = {
  Excellent: 'badge-green', Good: 'badge-blue', Fair: 'badge-yellow',
  Poor: 'badge-red', 'Very Poor': 'badge-red',
};

export default function GradePage() {
  const { courseId, courseWorkId } = useParams();
  const [results, setResults] = useState([]);
  const [maxPoints, setMaxPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('score_desc');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    if (!courseId || !courseWorkId) return;
    Promise.all([
      getDashboard(courseId, courseWorkId),
      getCourseWork(courseId),
    ])
      .then(([dash, cwData]) => {
        setResults(dash.results || []);
        const cw = (cwData.courseWork || []).find(c => c.id === courseWorkId);
        if (cw?.maxPoints != null) setMaxPoints(cw.maxPoints);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [courseId, courseWorkId]);

  const filtered = results
    .filter(r =>
      (r.studentName||'').toLowerCase().includes(search.toLowerCase()) ||
      (r.studentEmail||'').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a,b) => {
      if (sort==='score_desc') return b.score - a.score;
      if (sort==='score_asc') return a.score - b.score;
      return (a.studentName||'').localeCompare(b.studentName||'');
    });

  const max = maxPoints ?? (results.length ? Math.max(...results.map(r=>r.score)) : 100);
  const avg = results.length ? (results.reduce((s,r)=>s+r.score,0)/results.length).toFixed(1) : 0;
  const top = results.length ? Math.max(...results.map(r=>r.score)) : 0;
  const remarkDist = results.reduce((acc,r)=>{ acc[r.remark]=(acc[r.remark]||0)+1; return acc; },{});

  const syncMarks = async () => {
    setSyncing(true);
    try {
      const res = await syncMarksToClassroom(courseId, courseWorkId);
      setSyncResult(res);
      toast.success(`Synced ${res.patchedCount} grades to Classroom!`);
    } catch(e) { toast.error(e.message); }
    finally { setSyncing(false); }
  };

  return (
    <div className="page" style={{maxWidth:1020}}>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <Link to={`/courses/${courseId||''}`} className="btn btn-secondary btn-sm btn-icon"><ArrowLeft size={14}/></Link>
          <div>
            <p className="page-label mono">{courseWorkId}</p>
            <h1 className="page-title">Grade Results</h1>
          </div>
        </div>
        {results.length > 0 && (
          <button className="btn btn-primary" onClick={syncMarks} disabled={syncing}>
            {syncing ? <><span className="spinner" style={{width:14,height:14}}/> Syncing…</> : <><Send size={13}/> Sync to Classroom</>}
          </button>
        )}
      </div>

      {/* Stats */}
      {results.length > 0 && (
        <div className="grade-stats fade-up">
          <StatPill icon={<Users size={13}/>} label="Students" value={results.length}/>
          <StatPill icon={<TrendingUp size={13}/>} label="Average" value={`${avg} / ${max}`}/>
          <StatPill icon={<Award size={13}/>} label="Top Score" value={`${top} / ${max}`}/>
          {Object.entries(remarkDist).map(([r,n])=><StatPill key={r} label={r} value={n} small/>)}
        </div>
      )}

      {/* Sync result banner */}
      {syncResult && (
        <div className="sync-banner fade-up">
          <Send size={14} style={{color:'var(--accent-2)',flexShrink:0}}/>
          <span>Sync complete — <strong style={{color:'var(--green)'}}>{syncResult.patchedCount} synced</strong>, {syncResult.missingSubmissionCount} missing, {syncResult.failedCount} failed.</span>
          {syncResult.failures?.length > 0 && (
            <details style={{marginLeft:'auto'}}>
              <summary style={{fontSize:12,cursor:'pointer',color:'var(--text-3)'}}>Details</summary>
              <div style={{marginTop:6,display:'flex',flexDirection:'column',gap:3}}>
                {syncResult.failures.map((f,i)=><div key={i} style={{fontSize:11,color:'var(--red)',fontFamily:'DM Mono,monospace'}}>{f.studentId} — {f.reason}</div>)}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="grade-controls fade-up">
        <input className="input" style={{maxWidth:240,fontSize:13,padding:'8px 13px'}} placeholder="Search students…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="input" style={{maxWidth:170,fontSize:13,padding:'8px 13px'}} value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="score_desc">Highest first</option>
          <option value="score_asc">Lowest first</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:56,borderRadius:8}}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state fade-up">
          <AlertCircle size={36} style={{opacity:0.25}}/>
          <p>{results.length===0 ? 'No grading results yet. Start a grading job from the Courses page.' : `No results match "${search}"`}</p>
        </div>
      ) : (
        <div className="results-wrap fade-up">
          <table className="results-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score / {max}</th>
                <th>Grade</th>
                <th>Remark</th>
                <th>Status</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <>
                  <tr key={r._id||r.studentId} className="result-row" onClick={()=>setExpanded(expanded===r.studentId?null:r.studentId)}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div className="stu-avatar">{(r.studentName||'S')[0].toUpperCase()}</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600}}>{r.studentName}</div>
                          <div style={{fontSize:11,color:'var(--text-3)'}}>{r.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:9}}>
                        <ScoreBar score={r.score} maxScore={max}/>
                        <span className="mono" style={{fontSize:13,fontWeight:600}}>{r.score}</span>
                      </div>
                    </td>
                    <td><span className="grade-pill">{r.grade}</span></td>
                    <td><span className={`badge ${REMARK_COLOR[r.remark]||'badge-purple'}`}>{r.remark}</span></td>
                    <td><span className={`badge ${r.status==='completed'?'badge-green':r.status==='failed'?'badge-red':'badge-yellow'}`}>{r.status}</span></td>
                    <td style={{color:'var(--text-3)',fontSize:11,textAlign:'right'}}>{expanded===r.studentId?'▲':'▼'}</td>
                  </tr>
                  {expanded===r.studentId && (
                    <tr className="feedback-row" key={`fb-${r.studentId}`}>
                      <td colSpan={6}>
                        <div className="feedback-box">
                          <strong>AI Feedback</strong>
                          <p>{r.feedback||'No feedback provided.'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .grade-stats { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; }
        .grade-controls { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px; }
        .sync-banner { display:flex; align-items:flex-start; gap:10px; padding:13px 16px; background:var(--accent-glow); border:1px solid rgba(124,106,247,0.2); border-radius:var(--radius-sm); font-size:13px; margin-bottom:16px; flex-wrap:wrap; }
        .results-wrap { background:var(--bg-1); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
        .results-table { width:100%; border-collapse:collapse; }
        .results-table th { text-align:left; padding:11px 16px; font-size:10px; font-weight:700; color:var(--text-3); text-transform:uppercase; letter-spacing:0.07em; border-bottom:1px solid var(--border); background:var(--bg-2); }
        .result-row { cursor:pointer; transition:background 0.14s; }
        .result-row:hover { background:rgba(255,255,255,0.018); }
        .results-table td { padding:13px 16px; border-bottom:1px solid var(--border); vertical-align:middle; }
        .result-row:last-child td { border-bottom:none; }
        .stu-avatar { width:30px; height:30px; border-radius:7px; background:var(--accent-glow); color:var(--accent-2); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:12px; font-weight:700; flex-shrink:0; }
        .grade-pill { font-family:'DM Mono',monospace; font-size:11px; font-weight:700; padding:3px 9px; border-radius:99px; background:var(--bg-3); color:var(--accent-2); }
        .feedback-row td { padding:0; border-bottom:1px solid var(--border); }
        .feedback-box { padding:14px 20px; background:var(--bg-2); font-size:13px; line-height:1.7; color:var(--text-2); border-left:3px solid var(--accent); }
        .feedback-box strong { color:var(--text); display:block; margin-bottom:5px; }
      `}</style>
    </div>
  );
}

function ScoreBar({ score, maxScore }) {
  const pct = maxScore>0 ? Math.min((score/maxScore)*100, 100) : 0;
  const color = pct>=75 ? 'var(--green)' : pct>=50 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{width:56,height:5,background:'var(--bg-3)',borderRadius:99,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:99,transition:'width 0.4s ease'}}/>
    </div>
  );
}

function StatPill({ icon, label, value, small }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:7,padding:small?'5px 11px':'9px 14px',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:99,fontSize:small?11:12}}>
      {icon && <span style={{color:'var(--accent-2)'}}>{icon}</span>}
      <span style={{color:'var(--text-3)'}}>{label}:</span>
      <span style={{fontWeight:600,fontFamily:'DM Mono'}}>{value}</span>
    </div>
  );
}
