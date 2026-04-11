import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseWork, startGrading, getJobStatus, syncMarksToClassroom } from '../api';
import { ArrowLeft, Zap, Upload, ChevronDown, ChevronUp, Loader, CheckCircle, XCircle, Clock, BarChart2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const POLL_MS = 3000;

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [courseWork, setCourseWork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState({});   // cwId → { jobId, state, progress, result }
  const [syncing, setSyncing] = useState({});    // cwId → bool
  const [syncResult, setSyncResult] = useState({}); // cwId → response
  const [expanded, setExpanded] = useState(null);
  const [forms, setForms] = useState({});
  const polls = useRef({});

  useEffect(() => {
    getCourseWork(courseId)
      .then(d => setCourseWork(d.courseWork || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
    return () => Object.values(polls.current).forEach(clearInterval);
  }, [courseId]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const extractDriveId = (cw) => {
    for (const m of cw.materials || []) {
      if (m?.driveFile?.driveFile?.id) return m.driveFile.driveFile.id;
      if (m?.driveFile?.id) return m.driveFile.id;
    }
    return '';
  };

  const getForm = (cw) => {
    const defaults = {
      rubricContext: '',
      strictness: 'Medium',
      maxScore: cw.maxPoints ?? 100,
      driveId: extractDriveId(cw),
      file: null,
    };
    return { ...defaults, ...(forms[cw.id] || {}) };
  };

  const updateForm = (cwId, field, val) =>
    setForms(f => ({ ...f, [cwId]: { ...(f[cwId]||{}), [field]: val } }));

  // ── start grading job ─────────────────────────────────────────────────────
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

  // ── poll job status ────────────────────────────────────────────────────────
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

  // ── sync marks to Classroom ───────────────────────────────────────────────
  const syncMarks = async (cwId) => {
    setSyncing(s => ({ ...s, [cwId]: true }));
    try {
      const res = await syncMarksToClassroom(courseId, cwId);
      setSyncResult(r => ({ ...r, [cwId]: res }));
      toast.success(`Synced ${res.patchedCount} grades to Classroom!`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncing(s => ({ ...s, [cwId]: false }));
    }
  };

  return (
    <div className="page" style={{maxWidth:920}}>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <Link to="/courses" className="btn btn-secondary btn-sm btn-icon"><ArrowLeft size={14}/></Link>
          <div>
            <p className="page-label mono">Course · {courseId}</p>
            <h1 className="page-title">Assignments</h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[1,2,3].map(i=><div key={i} className="card skeleton" style={{height:68}}/>)}
        </div>
      ) : courseWork.length === 0 ? (
        <div className="empty-state"><BarChart2 size={36} style={{opacity:0.25}}/><p>No assignments found for this course.</p></div>
      ) : (
        <div className="cw-list fade-up">
          {courseWork.map((cw, i) => {
            const job = grading[cw.id];
            const isOpen = expanded === cw.id;
            const f = getForm(cw);
            const detectedDriveId = extractDriveId(cw);
            const materialCount = (cw.materials||[]).filter(m=>m?.driveFile).length;
            const isSyncing = syncing[cw.id];
            const sr = syncResult[cw.id];

            return (
              <div key={cw.id} className="card cw-card" style={{animationDelay:`${i*0.04}s`}}>
                {/* Row header */}
                <div className="cw-header" onClick={()=>setExpanded(isOpen ? null : cw.id)}>
                  <div className="cw-left">
                    <div className="cw-dot"/>
                    <div>
                      <div className="cw-title">{cw.title}</div>
                      <div className="cw-meta">
                        {cw.maxPoints!=null && <span>{cw.maxPoints} pts</span>}
                        {cw.dueDate && <span>Due {fmtDate(cw.dueDate)}</span>}
                        <span className="mono" style={{fontSize:10,color:'var(--text-3)'}}>{cw.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="cw-right">
                    {job && <JobBadge state={job.state} progress={job.progress}/>}
                    <Link to={`/grades/${courseId}/${cw.id}`} className="btn btn-ghost btn-sm" onClick={e=>e.stopPropagation()}>
                      <BarChart2 size={13}/> Results
                    </Link>
                    {isOpen ? <ChevronUp size={15} style={{color:'var(--text-3)'}}/> : <ChevronDown size={15} style={{color:'var(--text-3)'}}/>}
                  </div>
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="cw-panel fade-up">
                    <div className="divider"/>

                    {cw.description && <p className="cw-desc">{cw.description}</p>}

                    {/* Active/queued job progress */}
                    {job && (job.state==='active'||job.state==='queued') && (
                      <JobProgress job={job}/>
                    )}

                    {/* Grading form — shown when no job or job failed */}
                    {(!job || job.state==='failed') && (
                      <div className="grade-form">
                        <div className="grade-form-title"><Zap size={14}/> Configure Grading</div>

                        {/* Auto-detected Classroom info */}
                        <div className="classroom-chips">
                          <div className="chip">
                            <span className="chip-label">Max Score</span>
                            <span className="chip-value">{cw.maxPoints!=null ? `${cw.maxPoints} pts` : 'Not set'}</span>
                            <span className="chip-src">Classroom</span>
                          </div>
                          <div className="chip">
                            <span className="chip-label">Question Paper</span>
                            <span className="chip-value">
                              {detectedDriveId
                                ? <><span style={{color:'var(--green)'}}>✓</span> {materialCount} file{materialCount!==1?'s':''} detected</>
                                : <span style={{color:'var(--text-3)'}}>No Drive files</span>
                              }
                            </span>
                            {detectedDriveId && <span className="chip-src">Classroom</span>}
                          </div>
                        </div>

                        <div className="form-grid">
                          <div className="input-group" style={{gridColumn:'1/-1'}}>
                            <label className="label">Rubric / Grading Instructions *</label>
                            <textarea className="input" rows={3} placeholder="Describe what a perfect answer looks like, key points, grading criteria…" value={f.rubricContext} onChange={e=>updateForm(cw.id,'rubricContext',e.target.value)}/>
                          </div>
                          <div className="input-group">
                            <label className="label">Strictness</label>
                            <select className="input" value={f.strictness} onChange={e=>updateForm(cw.id,'strictness',e.target.value)}>
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                          <div className="input-group">
                            <label className="label">Answer Key / Reference File <span style={{fontWeight:400,textTransform:'none',color:'var(--text-3)'}}>optional</span></label>
                            <FileDropzone onFile={file=>updateForm(cw.id,'file',file)} currentFile={f.file}/>
                          </div>
                        </div>

                        <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
                          <button className="btn btn-primary" onClick={()=>startJob(cw)}>
                            <Zap size={13}/> Start AI Grading
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Completed job — show summary + sync button */}
                    {job?.state==='completed' && (
                      <div className="completed-section">
                        <div className="completed-summary">
                          <CheckCircle size={16} style={{color:'var(--green)',flexShrink:0}}/>
                          <div>
                            <div style={{fontWeight:600,fontSize:14}}>Grading complete</div>
                            <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>
                              {job.result?.gradedSubmissions??0} submissions · {job.result?.gradedAttachments??0} graded · {job.result?.failedAttachments??0} failed
                              {job.result?.vectorWarning && <span style={{color:'var(--yellow)',marginLeft:8}}>⚠ {job.result.vectorWarning}</span>}
                            </div>
                          </div>
                          <Link to={`/grades/${courseId}/${cw.id}`} className="btn btn-secondary btn-sm" style={{marginLeft:'auto'}}>
                            <BarChart2 size={12}/> View Results
                          </Link>
                        </div>

                        {/* Sync to Classroom */}
                        <div className="sync-box">
                          <div className="sync-box-left">
                            <Send size={15} style={{color:'var(--accent-2)'}}/>
                            <div>
                              <div style={{fontSize:13,fontWeight:600}}>Push grades to Google Classroom</div>
                              <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                                Writes AI-assigned scores as <code>draftGrade</code> + <code>assignedGrade</code> on every student submission.
                              </div>
                            </div>
                          </div>
                          <button className="btn btn-primary btn-sm" onClick={()=>syncMarks(cw.id)} disabled={isSyncing}>
                            {isSyncing ? <><span className="spinner" style={{width:13,height:13}}/> Syncing…</> : <><Send size={12}/> Sync to Classroom</>}
                          </button>
                        </div>

                        {/* Sync result */}
                        {sr && (
                          <div className="sync-result">
                            <div className="sr-row"><span>Total results</span><strong>{sr.totalResults}</strong></div>
                            <div className="sr-row"><span>Successfully synced</span><strong style={{color:'var(--green)'}}>{sr.patchedCount}</strong></div>
                            <div className="sr-row"><span>Missing submission</span><strong style={{color:'var(--yellow)'}}>{sr.missingSubmissionCount}</strong></div>
                            <div className="sr-row"><span>Failed</span><strong style={{color:'var(--red)'}}>{sr.failedCount}</strong></div>
                            {sr.failures?.length > 0 && (
                              <details style={{marginTop:10}}>
                                <summary style={{fontSize:12,color:'var(--text-3)',cursor:'pointer'}}>Show failures ({sr.failures.length})</summary>
                                <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:4}}>
                                  {sr.failures.map((f,i)=>(
                                    <div key={i} style={{fontSize:11,color:'var(--red)',fontFamily:'DM Mono,monospace'}}>
                                      {f.studentId||'?'} — {f.reason}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .cw-list { display:flex; flex-direction:column; gap:10px; }
        .cw-card { overflow:hidden; }
        .cw-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; cursor:pointer; transition:background 0.14s; }
        .cw-header:hover { background:rgba(255,255,255,0.018); }
        .cw-left { display:flex; align-items:center; gap:13px; flex:1; min-width:0; }
        .cw-dot { width:7px; height:7px; border-radius:50%; background:var(--accent); flex-shrink:0; }
        .cw-title { font-size:14px; font-weight:600; margin-bottom:3px; }
        .cw-meta { display:flex; gap:10px; font-size:11px; color:var(--text-3); flex-wrap:wrap; }
        .cw-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .cw-panel { padding:0 20px 20px; }
        .cw-desc { font-size:13px; color:var(--text-2); line-height:1.65; margin:16px 0; }
        .grade-form { background:var(--bg-2); border-radius:var(--radius-sm); padding:18px; margin-top:16px; }
        .grade-form-title { display:flex; align-items:center; gap:7px; font-size:14px; font-weight:600; margin-bottom:14px; }
        .classroom-chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
        .chip { display:flex; align-items:center; gap:7px; padding:7px 12px; background:var(--bg-3); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:12px; }
        .chip-label { color:var(--text-3); }
        .chip-value { font-weight:500; }
        .chip-src { font-size:10px; font-family:'DM Mono',monospace; color:var(--accent-2); background:var(--accent-glow); padding:1px 6px; border-radius:99px; }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .completed-section { margin-top:16px; display:flex; flex-direction:column; gap:12px; }
        .completed-summary { display:flex; align-items:center; gap:12px; padding:14px 16px; background:var(--green-bg); border:1px solid rgba(52,211,153,0.2); border-radius:var(--radius-sm); }
        .sync-box { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:14px 16px; background:var(--bg-2); border:1px solid var(--border); border-radius:var(--radius-sm); }
        .sync-box-left { display:flex; align-items:flex-start; gap:12px; flex:1; }
        .sync-result { background:var(--bg-2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px 16px; display:flex; flex-direction:column; gap:8px; }
        .sr-row { display:flex; justify-content:space-between; align-items:center; font-size:13px; }
        .sr-row span { color:var(--text-2); }
      `}</style>
    </div>
  );
}

function JobBadge({ state, progress }) {
  const MAP = {
    queued:    { cls:'badge-yellow', icon:<Clock size={10}/>,  label:'Queued' },
    active:    { cls:'badge-blue',   icon:<Loader size={10} className="spin"/>, label:`${progress?.processed||0}/${progress?.total||'?'}` },
    completed: { cls:'badge-green',  icon:<CheckCircle size={10}/>, label:'Done' },
    failed:    { cls:'badge-red',    icon:<XCircle size={10}/>,    label:'Failed' },
  };
  const b = MAP[state] || MAP.queued;
  return <span className={`badge ${b.cls}`}>{b.icon}{b.label}</span>;
}

function JobProgress({ job }) {
  const { progress={}, state } = job;
  const pct = progress.total>0 ? Math.round((progress.processed/progress.total)*100) : 0;
  return (
    <div style={{background:'var(--bg-2)',borderRadius:'var(--radius-sm)',padding:16,marginTop:16}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13}}>
        <span style={{color:'var(--text-2)'}}>{state==='queued' ? 'Queued — waiting to start…' : 'Grading submissions…'}</span>
        <span className="mono" style={{color:'var(--accent-2)'}}>{pct}%</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
      {progress.total>0 && (
        <div style={{display:'flex',gap:16,marginTop:7,fontSize:11,color:'var(--text-3)'}}>
          <span>{progress.processed} processed</span>
          <span>{progress.failed} failed</span>
          <span>{progress.total} total</span>
        </div>
      )}
    </div>
  );
}

function FileDropzone({ onFile, currentFile }) {
  const ref = useRef();
  return (
    <div className="dropzone" onClick={()=>ref.current.click()}>
      <input ref={ref} type="file" accept=".pdf,.doc,.docx,.txt" style={{display:'none'}} onChange={e=>onFile(e.target.files[0])}/>
      <Upload size={14} style={{color:'var(--text-3)',flexShrink:0}}/>
      <span style={{fontSize:13,color:currentFile?'var(--text)':'var(--text-2)'}}>
        {currentFile ? currentFile.name : 'Click to upload PDF, DOC, or TXT'}
      </span>
      <style>{`.dropzone{display:flex;align-items:center;gap:9px;padding:12px 13px;background:var(--bg);border:1px dashed var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:border-color 0.18s;}.dropzone:hover{border-color:var(--accent);}`}</style>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  const { year, month, day } = d;
  if (!year) return '';
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
