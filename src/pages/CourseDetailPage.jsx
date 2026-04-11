import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCreatedCourseWork, getNotCreatedCourseWork, startGrading, getJobStatus, syncMarksToClassroom } from '../api';
import {
  ArrowLeft, Zap, Upload, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, BarChart2, Send,
  Loader, PlusSquare, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const POLL_MS = 3000;

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [created, setCreated] = useState([]);       // from our system — sync enabled
  const [imported, setImported] = useState([]);     // from Classroom only — no sync
  const [loadingC, setLoadingC] = useState(true);
  const [loadingI, setLoadingI] = useState(true);
  const [grading, setGrading] = useState({});
  const [syncing, setSyncing] = useState({});
  const [syncResult, setSyncResult] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [forms, setForms] = useState({});
  const polls = useRef({});

  useEffect(() => {
    getCreatedCourseWork(courseId)
      .then(d => setCreated(d.courseWork || []))
      .catch(e => toast.error('Created CW: ' + e.message))
      .finally(() => setLoadingC(false));

    getNotCreatedCourseWork(courseId)
      .then(d => setImported(d.courseWork || []))
      .catch(e => toast.error('Imported CW: ' + e.message))
      .finally(() => setLoadingI(false));

    return () => Object.values(polls.current).forEach(clearInterval);
  }, [courseId]);

  // ── form helpers ──────────────────────────────────────────────────────────
  const extractDriveId = (cw) => {
    for (const m of cw.materials || []) {
      if (m?.driveFile?.driveFile?.id) return m.driveFile.driveFile.id;
      if (m?.driveFile?.id) return m.driveFile.id;
    }
    return '';
  };

  const getForm = (cw) => ({
    rubricContext: '', strictness: 'Medium',
    maxScore: cw.maxPoints ?? 100,
    driveId: extractDriveId(cw),
    file: null,
    ...(forms[cw.id] || {}),
  });

  const updateForm = (cwId, k, v) =>
    setForms(f => ({ ...f, [cwId]: { ...(f[cwId] || {}), [k]: v } }));

  // ── start grading ─────────────────────────────────────────────────────────
  const startJob = async (cw) => {
    const f = getForm(cw);
    if (!f.rubricContext.trim()) return toast.error('Rubric / Instructions are required');
    const fd = new FormData();
    fd.append('rubricContext', f.rubricContext);
    fd.append('strictness', f.strictness);
    fd.append('maxScore', String(f.maxScore));
    if (f.driveId) fd.append('driveId', f.driveId);
    if (f.file)   fd.append('file', f.file);
    try {
      const res = await startGrading(courseId, cw.id, fd);
      toast.success('Grading job queued!');
      setGrading(g => ({ ...g, [cw.id]: { jobId: res.jobId, state: 'queued', progress: { total:0, processed:0, failed:0 } } }));
      pollJob(cw.id, res.jobId);
    } catch (e) { toast.error(e.message); }
  };

  const pollJob = (cwId, jobId) => {
    const iv = setInterval(async () => {
      try {
        const data = await getJobStatus(courseId, cwId, jobId);
        setGrading(g => ({ ...g, [cwId]: { ...g[cwId], ...data } }));
        if (data.state === 'completed' || data.state === 'failed') {
          clearInterval(iv); delete polls.current[cwId];
          if (data.state === 'completed') toast.success('✅ Grading complete!');
          else toast.error('Grading job failed');
        }
      } catch { clearInterval(iv); }
    }, POLL_MS);
    polls.current[cwId] = iv;
  };

  // ── sync marks ────────────────────────────────────────────────────────────
  const syncMarks = async (cwId) => {
    setSyncing(s => ({ ...s, [cwId]: true }));
    try {
      const res = await syncMarksToClassroom(courseId, cwId);
      setSyncResult(r => ({ ...r, [cwId]: res }));
      toast.success(`Synced ${res.patchedCount} grades to Classroom!`);
    } catch (e) { toast.error(e.message); }
    finally { setSyncing(s => ({ ...s, [cwId]: false })); }
  };

  const loading = loadingC && loadingI;

  return (
    <div className="page" style={{maxWidth:1100}}>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:13}}>
          <Link to="/courses" className="btn btn-secondary btn-sm btn-icon"><ArrowLeft size={13}/></Link>
          <div>
            <p className="page-label mono">{courseId}</p>
            <h1 className="page-title">Assignments</h1>
          </div>
        </div>
        <Link to="/create" className="btn btn-teal btn-sm"><PlusSquare size={13}/> New Assignment</Link>
      </div>

      {/* Column legend */}
      <div className="legend fade-up">
        <div className="leg-item">
          <div className="leg-dot" style={{background:'var(--teal)'}}/>
          <div>
            <div className="leg-title">Created by AutoGrade.ai</div>
            <div className="leg-sub">Assignments you published from this platform. Supports AI grading + Sync to Classroom.</div>
          </div>
        </div>
        <div className="leg-div"/>
        <div className="leg-item">
          <div className="leg-dot" style={{background:'var(--accent-2)'}}/>
          <div>
            <div className="leg-title">Imported from Classroom</div>
            <div className="leg-sub">Assignments created directly in Google Classroom. AI grading only — sync not available.</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="two-col">
          <div style={{display:'flex',flexDirection:'column',gap:8}}>{[1,2].map(i=><div key={i} className="skeleton" style={{height:68}}/>)}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:68}}/>)}</div>
        </div>
      ) : (
        <div className="two-col fade-up">
          {/* ── LEFT: Created by us ─────────────────────────────────────────── */}
          <div className="col">
            <div className="col-header teal">
              <div className="col-h-left">
                <div className="col-dot" style={{background:'var(--teal)'}}/>
                <span className="col-title">Created by AutoGrade.ai</span>
                <span className="badge badge-teal">{loadingC?'…':created.length}</span>
              </div>
              <span className="badge badge-teal" style={{fontSize:10}}>Sync enabled</span>
            </div>

            {loadingC ? (
              <div className="skeleton" style={{height:60}}/>
            ) : created.length === 0 ? (
              <div className="col-empty">
                <PlusSquare size={28} style={{opacity:0.2}}/>
                <p>No assignments created from AutoGrade.ai yet.</p>
                <Link to="/create" className="btn btn-teal btn-sm" style={{marginTop:4}}><PlusSquare size={12}/> Create one</Link>
              </div>
            ) : (
              created.map((cw, i) => (
                <CwCard key={cw.id} cw={cw} isCreated={true} courseId={courseId}
                  expanded={expanded===cw.id} onToggle={()=>setExpanded(expanded===cw.id?null:cw.id)}
                  job={grading[cw.id]} form={getForm(cw)} onFormChange={(k,v)=>updateForm(cw.id,k,v)}
                  onStartJob={()=>startJob(cw)} onSync={()=>syncMarks(cw.id)}
                  syncing={syncing[cw.id]} syncResult={syncResult[cw.id]}
                  animDelay={i*0.04}
                />
              ))
            )}
          </div>

          {/* ── RIGHT: Imported from Classroom ─────────────────────────────── */}
          <div className="col">
            <div className="col-header purple">
              <div className="col-h-left">
                <div className="col-dot" style={{background:'var(--accent-2)'}}/>
                <span className="col-title">Imported from Classroom</span>
                <span className="badge badge-purple">{loadingI?'…':imported.length}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'var(--text-3)'}}>
                <Info size={11}/> Grade only
              </div>
            </div>

            {loadingI ? (
              <div className="skeleton" style={{height:60}}/>
            ) : imported.length === 0 ? (
              <div className="col-empty">
                <BarChart2 size={28} style={{opacity:0.2}}/>
                <p>All assignments are registered — or none exist in Classroom yet.</p>
              </div>
            ) : (
              imported.map((cw, i) => (
                <CwCard key={cw.id} cw={cw} isCreated={false} courseId={courseId}
                  expanded={expanded===cw.id} onToggle={()=>setExpanded(expanded===cw.id?null:cw.id)}
                  job={grading[cw.id]} form={getForm(cw)} onFormChange={(k,v)=>updateForm(cw.id,k,v)}
                  onStartJob={()=>startJob(cw)}
                  animDelay={i*0.04}
                />
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .legend{display:flex;align-items:flex-start;gap:0;background:var(--bg-1);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;margin-bottom:20px;}
        .leg-item{display:flex;align-items:flex-start;gap:12px;flex:1;}
        .leg-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px;}
        .leg-title{font-size:13px;font-weight:600;margin-bottom:3px;}
        .leg-sub{font-size:11px;color:var(--text-3);line-height:1.6;}
        .leg-div{width:1px;background:var(--border);margin:0 20px;}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;}
        .col{display:flex;flex-direction:column;gap:8px;}
        .col-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:var(--radius-sm);margin-bottom:4px;}
        .col-header.teal{background:var(--teal-bg);border:1px solid rgba(45,212,191,0.2);}
        .col-header.purple{background:var(--accent-glow);border:1px solid rgba(124,106,247,0.2);}
        .col-h-left{display:flex;align-items:center;gap:8px;}
        .col-dot{width:8px;height:8px;border-radius:50%;}
        .col-title{font-size:13px;font-weight:600;}
        .col-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px 16px;color:var(--text-3);text-align:center;font-size:12px;background:var(--bg-1);border:1px dashed var(--border);border-radius:var(--radius);}
        @media(max-width:820px){.two-col{grid-template-columns:1fr;}}
      `}</style>
    </div>
  );
}

// ── Individual coursework card ──────────────────────────────────────────────
function CwCard({ cw, isCreated, courseId, expanded, onToggle, job, form, onFormChange, onStartJob, onSync, syncing, syncResult, animDelay }) {
  const fileRef = useRef();
  const accentColor = isCreated ? 'var(--teal)' : 'var(--accent-2)';
  const materialCount = (cw.materials||[]).filter(m=>m?.driveFile).length;

  return (
    <div className="card cw-card" style={{animationDelay:`${animDelay}s`}}>
      {/* Header row */}
      <div className="cw-h" onClick={onToggle}>
        <div className="cw-hl">
          <div className="cw-dot" style={{background:accentColor}}/>
          <div>
            <div className="cw-title">{cw.title}</div>
            <div className="cw-meta">
              {cw.maxPoints!=null&&<span>{cw.maxPoints} pts</span>}
              {cw.dueDate&&<span>Due {fmtDate(cw.dueDate)}</span>}
              <span className="mono" style={{fontSize:10,color:'var(--text-3)'}}>{cw.id}</span>
            </div>
          </div>
        </div>
        <div className="cw-hr">
          {job && <JobBadge state={job.state} progress={job.progress}/>}
          <Link to={`/grades/${courseId}/${cw.id}`} className="btn btn-ghost btn-sm" onClick={e=>e.stopPropagation()}>
            <BarChart2 size={12}/> Results
          </Link>
          {expanded ? <ChevronUp size={14} style={{color:'var(--text-3)'}}/> : <ChevronDown size={14} style={{color:'var(--text-3)'}}/>}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="cw-panel fade-in">
          <div className="divider"/>

          {cw.description && <p className="cw-desc">{cw.description}</p>}

          {/* Active job progress */}
          {job && (job.state==='active'||job.state==='queued') && <JobProgress job={job}/>}

          {/* Grading form */}
          {(!job || job.state==='failed') && (
            <div className="gf">
              <div className="gf-title"><Zap size={13}/> Configure AI Grading</div>

              {/* Classroom info chips */}
              <div className="chips">
                <Chip label="Max Score" value={cw.maxPoints!=null?`${cw.maxPoints} pts`:'Not set'} src="Classroom"/>
                <Chip label="Question Paper" value={materialCount>0?`✓ ${materialCount} file${materialCount>1?'s':''} detected`:'No Drive files'} src={materialCount>0?'Classroom':null}/>
              </div>

              <div className="gf-grid">
                <div className="input-group" style={{gridColumn:'1/-1'}}>
                  <label className="label">Rubric / Instructions *</label>
                  <textarea className="input" rows={3} placeholder="Describe grading criteria, what a perfect answer includes, key points to check…" value={form.rubricContext} onChange={e=>onFormChange('rubricContext',e.target.value)}/>
                </div>
                <div className="input-group">
                  <label className="label">Strictness</label>
                  <select className="input" value={form.strictness} onChange={e=>onFormChange('strictness',e.target.value)}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="label">Answer Key <span style={{fontWeight:400,textTransform:'none',color:'var(--text-3)'}}>optional</span></label>
                  <div className="fdrop" onClick={()=>fileRef.current.click()}>
                    <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{display:'none'}} onChange={e=>onFormChange('file',e.target.files[0])}/>
                    <Upload size={13} style={{color:'var(--text-3)',flexShrink:0}}/>
                    <span style={{fontSize:12,color:form.file?'var(--text)':'var(--text-2)'}}>{form.file?form.file.name:'Upload reference file'}</span>
                  </div>
                </div>
              </div>

              <div style={{display:'flex',justifyContent:'flex-end',marginTop:14}}>
                <button className="btn btn-primary btn-sm" onClick={onStartJob}>
                  <Zap size={12}/> Start AI Grading
                </button>
              </div>
            </div>
          )}

          {/* Completed state */}
          {job?.state==='completed' && (
            <div className="done-section">
              <div className="done-summary">
                <CheckCircle size={15} style={{color:'var(--green)',flexShrink:0}}/>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>Grading complete</div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>
                    {job.result?.gradedSubmissions??0} submissions · {job.result?.gradedAttachments??0} graded · {job.result?.failedAttachments??0} failed
                  </div>
                </div>
                <Link to={`/grades/${courseId}/${cw.id}`} className="btn btn-secondary btn-sm" style={{marginLeft:'auto'}}>
                  <BarChart2 size={11}/> Results
                </Link>
              </div>

              {/* Sync block — ONLY for created coursework */}
              {isCreated ? (
                <div className="sync-block">
                  <div className="sync-bl">
                    <Send size={14} style={{color:'var(--teal)',flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:12,fontWeight:600}}>Sync grades to Google Classroom</div>
                      <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>Writes AI scores as assignedGrade on each student submission.</div>
                    </div>
                  </div>
                  <button className="btn btn-teal btn-sm" onClick={onSync} disabled={syncing}>
                    {syncing?<><span className="spinner" style={{width:12,height:12}}/> Syncing…</>:<><Send size={11}/> Sync</>}
                  </button>
                </div>
              ) : (
                <div className="no-sync">
                  <Info size={12} style={{flexShrink:0}}/>
                  <span>Sync to Classroom is only available for assignments created through AutoGrade.ai. <Link to="/create" style={{color:'var(--accent-2)'}}>Create a new assignment →</Link></span>
                </div>
              )}

              {/* Sync result */}
              {syncResult && (
                <div className="sr-box">
                  <div className="sr-row"><span>Synced</span><strong style={{color:'var(--green)'}}>{syncResult.patchedCount}</strong></div>
                  <div className="sr-row"><span>Missing</span><strong style={{color:'var(--yellow)'}}>{syncResult.missingSubmissionCount}</strong></div>
                  <div className="sr-row"><span>Failed</span><strong style={{color:'var(--red)'}}>{syncResult.failedCount}</strong></div>
                  {syncResult.failures?.length>0 && (
                    <details style={{marginTop:6}}>
                      <summary style={{fontSize:11,color:'var(--text-3)',cursor:'pointer'}}>Show failures</summary>
                      <div style={{marginTop:5,display:'flex',flexDirection:'column',gap:3}}>
                        {syncResult.failures.map((f,i)=><div key={i} className="mono" style={{fontSize:10,color:'var(--red)'}}>{f.studentId} — {f.reason}</div>)}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .cw-card{overflow:hidden;}
        .cw-h{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;transition:background 0.14s;}
        .cw-h:hover{background:rgba(255,255,255,0.018);}
        .cw-hl{display:flex;align-items:center;gap:11px;flex:1;min-width:0;}
        .cw-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
        .cw-title{font-size:13px;font-weight:600;margin-bottom:2px;}
        .cw-meta{display:flex;gap:8px;font-size:10px;color:var(--text-3);flex-wrap:wrap;}
        .cw-hr{display:flex;align-items:center;gap:7px;flex-shrink:0;}
        .cw-panel{padding:0 16px 16px;}
        .cw-desc{font-size:12px;color:var(--text-2);line-height:1.65;margin:12px 0;}
        .gf{background:var(--bg-2);border-radius:var(--radius-sm);padding:14px;margin-top:12px;}
        .gf-title{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;margin-bottom:12px;}
        .chips{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;}
        .gf-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .fdrop{display:flex;align-items:center;gap:8px;padding:9px 11px;background:var(--bg);border:1px dashed var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:border-color 0.18s;}
        .fdrop:hover{border-color:var(--accent);}
        .done-section{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
        .done-summary{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--green-bg);border:1px solid rgba(52,211,153,0.2);border-radius:var(--radius-sm);}
        .sync-block{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--teal-bg);border:1px solid rgba(45,212,191,0.2);border-radius:var(--radius-sm);}
        .sync-bl{display:flex;align-items:flex-start;gap:10px;flex:1;}
        .no-sync{display:flex;align-items:flex-start;gap:8px;padding:10px 13px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:11px;color:var(--text-3);line-height:1.6;}
        .sr-box{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;display:flex;flex-direction:column;gap:7px;}
        .sr-row{display:flex;justify-content:space-between;font-size:12px;}
        .sr-row span{color:var(--text-2);}
      `}</style>
    </div>
  );
}

function Chip({ label, value, src }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',fontSize:11}}>
      <span style={{color:'var(--text-3)'}}>{label}:</span>
      <span style={{fontWeight:500}}>{value}</span>
      {src && <span style={{fontSize:9,fontFamily:'DM Mono,monospace',color:'var(--accent-2)',background:'var(--accent-glow)',padding:'1px 5px',borderRadius:99}}>{src}</span>}
    </div>
  );
}

function JobBadge({ state, progress }) {
  const M = {
    queued:    { cls:'badge-yellow', icon:<Clock size={10}/>,  label:'Queued' },
    active:    { cls:'badge-blue',   icon:<Loader size={10} className="spin"/>, label:`${progress?.processed||0}/${progress?.total||'?'}` },
    completed: { cls:'badge-green',  icon:<CheckCircle size={10}/>, label:'Done' },
    failed:    { cls:'badge-red',    icon:<XCircle size={10}/>, label:'Failed' },
  };
  const b = M[state]||M.queued;
  return <span className={`badge ${b.cls}`}>{b.icon}{b.label}</span>;
}

function JobProgress({ job }) {
  const { progress={}, state } = job;
  const pct = progress.total>0 ? Math.round((progress.processed/progress.total)*100) : 0;
  return (
    <div style={{background:'var(--bg-2)',borderRadius:'var(--radius-sm)',padding:14,marginTop:12}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:7,fontSize:12}}>
        <span style={{color:'var(--text-2)'}}>{state==='queued'?'Queued — waiting to start…':'Grading submissions…'}</span>
        <span className="mono" style={{color:'var(--accent-2)'}}>{pct}%</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
      {progress.total>0&&<div style={{display:'flex',gap:14,marginTop:6,fontSize:10,color:'var(--text-3)'}}><span>{progress.processed} processed</span><span>{progress.failed} failed</span><span>{progress.total} total</span></div>}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  const { year, month, day } = d;
  if (!year) return '';
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
