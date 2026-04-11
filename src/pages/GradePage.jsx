import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDashboard, getCreatedCourseWork, syncMarksToClassroom } from '../api';
import { ArrowLeft, Users, TrendingUp, Award, AlertCircle, Send, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const REMARK_COLOR = { Excellent:'badge-green', Good:'badge-blue', Fair:'badge-yellow', Poor:'badge-red', 'Very Poor':'badge-red' };

export default function GradePage() {
  const { courseId, courseWorkId } = useParams();
  const [results, setResults] = useState([]);
  const [maxPoints, setMaxPoints] = useState(null);
  const [isCreated, setIsCreated] = useState(false);
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
      getCreatedCourseWork(courseId),
    ])
      .then(([dash, cwData]) => {
        setResults(dash.results || []);
        const cw = (cwData.courseWork || []).find(c => c.id === courseWorkId);
        if (cw) { setIsCreated(true); if (cw.maxPoints!=null) setMaxPoints(cw.maxPoints); }
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [courseId, courseWorkId]);

  const filtered = results
    .filter(r => (r.studentName||'').toLowerCase().includes(search.toLowerCase()) || (r.studentEmail||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sort==='score_desc'?b.score-a.score:sort==='score_asc'?a.score-b.score:(a.studentName||'').localeCompare(b.studentName||''));

  const max = maxPoints ?? (results.length ? Math.max(...results.map(r=>r.score)) : 100);
  const avg = results.length ? (results.reduce((s,r)=>s+r.score,0)/results.length).toFixed(1) : 0;
  const top = results.length ? Math.max(...results.map(r=>r.score)) : 0;
  const remarkDist = results.reduce((acc,r)=>{ acc[r.remark]=(acc[r.remark]||0)+1; return acc; },{});

  const syncMarks = async () => {
    setSyncing(true);
    try { const res = await syncMarksToClassroom(courseId, courseWorkId); setSyncResult(res); toast.success(`Synced ${res.patchedCount} grades!`); }
    catch(e) { toast.error(e.message); }
    finally { setSyncing(false); }
  };

  return (
    <div className="page" style={{maxWidth:1020}}>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:13}}>
          <Link to={`/courses/${courseId||''}`} className="btn btn-secondary btn-sm btn-icon"><ArrowLeft size={13}/></Link>
          <div>
            <p className="page-label mono">{courseWorkId}</p>
            <h1 className="page-title">Grade Results</h1>
          </div>
        </div>
        {isCreated && results.length>0 && (
          <button className="btn btn-teal" onClick={syncMarks} disabled={syncing}>
            {syncing?<><span className="spinner" style={{width:14,height:14}}/> Syncing…</>:<><Send size={13}/> Sync to Classroom</>}
          </button>
        )}
      </div>

      {/* Sync availability notice */}
      {!loading && !isCreated && results.length>0 && (
        <div className="no-sync-banner fade-up">
          <Info size={13} style={{flexShrink:0}}/>
          <span>Sync to Classroom is only available for assignments created through AutoGrade.ai. This assignment was imported from Classroom directly.</span>
        </div>
      )}

      {/* Sync result */}
      {syncResult && (
        <div className="sync-banner fade-up">
          <Send size={13} style={{color:'var(--teal)',flexShrink:0}}/>
          <span>Sync complete — <strong style={{color:'var(--green)'}}>{syncResult.patchedCount} synced</strong>, {syncResult.missingSubmissionCount} missing, {syncResult.failedCount} failed.</span>
          {syncResult.failures?.length>0&&(
            <details style={{marginLeft:'auto'}}>
              <summary style={{fontSize:11,cursor:'pointer',color:'var(--text-3)'}}>Details</summary>
              <div style={{marginTop:5,display:'flex',flexDirection:'column',gap:3}}>
                {syncResult.failures.map((f,i)=><div key={i} className="mono" style={{fontSize:10,color:'var(--red)'}}>{f.studentId} — {f.reason}</div>)}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Stats */}
      {results.length>0 && (
        <div className="g-stats fade-up">
          <Pill icon={<Users size={12}/>} label="Students" value={results.length}/>
          <Pill icon={<TrendingUp size={12}/>} label="Average" value={`${avg} / ${max}`}/>
          <Pill icon={<Award size={12}/>} label="Top Score" value={`${top} / ${max}`}/>
          {Object.entries(remarkDist).map(([r,n])=><Pill key={r} label={r} value={n} small/>)}
          {isCreated && <Pill label="Sync" value="Available" color="teal" small/>}
        </div>
      )}

      {/* Controls */}
      <div className="g-controls fade-up">
        <input className="input" style={{maxWidth:230,fontSize:13,padding:'8px 12px'}} placeholder="Search students…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="input" style={{maxWidth:160,fontSize:13,padding:'8px 12px'}} value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="score_desc">Highest first</option>
          <option value="score_asc">Lowest first</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:54}}/>)}</div>
      ) : filtered.length===0 ? (
        <div className="empty-state fade-up"><AlertCircle size={34} style={{opacity:0.25}}/><p>{results.length===0?'No grading results yet. Start a grading job from the Courses page.':`No results match "${search}"`}</p></div>
      ) : (
        <div className="rt-wrap fade-up">
          <table className="rt">
            <thead>
              <tr>
                <th>Student</th><th>Score / {max}</th><th>Grade</th><th>Remark</th><th>Status</th><th/>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=>(
                <>
                  <tr key={r._id||r.studentId} className="r-row" onClick={()=>setExpanded(expanded===r.studentId?null:r.studentId)}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:9}}>
                        <div className="s-av">{(r.studentName||'S')[0].toUpperCase()}</div>
                        <div><div style={{fontSize:13,fontWeight:600}}>{r.studentName}</div><div style={{fontSize:10,color:'var(--text-3)'}}>{r.studentEmail}</div></div>
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <ScoreBar score={r.score} maxScore={max}/>
                        <span className="mono" style={{fontSize:13,fontWeight:600}}>{r.score}</span>
                      </div>
                    </td>
                    <td><span className="grade-pill">{r.grade}</span></td>
                    <td><span className={`badge ${REMARK_COLOR[r.remark]||'badge-purple'}`}>{r.remark}</span></td>
                    <td><span className={`badge ${r.status==='completed'?'badge-green':r.status==='failed'?'badge-red':'badge-yellow'}`}>{r.status}</span></td>
                    <td style={{color:'var(--text-3)',fontSize:11,textAlign:'right'}}>{expanded===r.studentId?'▲':'▼'}</td>
                  </tr>
                  {expanded===r.studentId&&(
                    <tr key={`fb-${r.studentId}`} className="fb-row">
                      <td colSpan={6}>
                        <div className="fb-box"><strong>AI Feedback</strong><p>{r.feedback||'No feedback provided.'}</p></div>
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
        .no-sync-banner{display:flex;align-items:flex-start;gap:9px;padding:11px 14px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:12px;color:var(--text-3);line-height:1.6;margin-bottom:16px;}
        .sync-banner{display:flex;align-items:flex-start;gap:9px;padding:11px 14px;background:var(--teal-bg);border:1px solid rgba(45,212,191,0.2);border-radius:var(--radius-sm);font-size:13px;margin-bottom:16px;flex-wrap:wrap;}
        .g-stats{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;}
        .g-controls{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:14px;}
        .rt-wrap{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
        .rt{width:100%;border-collapse:collapse;}
        .rt th{text-align:left;padding:10px 15px;font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid var(--border);background:var(--bg-2);}
        .r-row{cursor:pointer;transition:background 0.14s;}
        .r-row:hover{background:rgba(255,255,255,0.018);}
        .rt td{padding:12px 15px;border-bottom:1px solid var(--border);vertical-align:middle;}
        .r-row:last-child td{border-bottom:none;}
        .s-av{width:28px;height:28px;border-radius:6px;background:var(--accent-glow);color:var(--accent-2);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;flex-shrink:0;}
        .grade-pill{font-family:'DM Mono',monospace;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--bg-3);color:var(--accent-2);}
        .fb-row td{padding:0;border-bottom:1px solid var(--border);}
        .fb-box{padding:13px 18px;background:var(--bg-2);font-size:13px;line-height:1.7;color:var(--text-2);border-left:3px solid var(--accent);}
        .fb-box strong{color:var(--text);display:block;margin-bottom:4px;}
      `}</style>
    </div>
  );
}

function ScoreBar({ score, maxScore }) {
  const pct = maxScore>0 ? Math.min((score/maxScore)*100,100) : 0;
  const color = pct>=75?'var(--green)':pct>=50?'var(--yellow)':'var(--red)';
  return (
    <div style={{width:52,height:5,background:'var(--bg-3)',borderRadius:99,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:99,transition:'width 0.4s ease'}}/>
    </div>
  );
}

function Pill({ icon, label, value, small, color }) {
  const c = color==='teal'?{c:'var(--teal)',bg:'var(--teal-bg)'}:{c:'var(--accent-2)',bg:'var(--accent-glow)'};
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:small?'4px 10px':'8px 13px',background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:99,fontSize:small?10:11}}>
      {icon&&<span style={{color:'var(--accent-2)'}}>{icon}</span>}
      <span style={{color:'var(--text-3)'}}>{label}:</span>
      <span style={{fontWeight:600,fontFamily:'DM Mono',color:color?c.c:undefined}}>{value}</span>
    </div>
  );
}
