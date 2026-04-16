import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, PlusCircle, TrendingUp, Clock, Sparkles, BarChart3,
  ChevronDown, ChevronUp, Upload, Info, CheckCircle, XCircle, Send, CreditCard
} from 'lucide-react';
import { getCreatedCourseWork, getNotCreatedCourseWork, startGrading, getJobStatus, syncMarksToClassroom } from '../api';
import toast from 'react-hot-toast';

const POLL_MS = 3000;

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const [created, setCreated]   = useState([]);
  const [imported, setImported] = useState([]);
  const [loadingC, setLoadingC] = useState(true);
  const [loadingI, setLoadingI] = useState(true);
  const [grading, setGrading]   = useState({});
  const [submitting, setSubmitting] = useState({}); // cwId → bool (prevents double clicks)
  const [syncing, setSyncing]   = useState({});
  const [syncResult, setSyncResult] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [forms, setForms]       = useState({});
  const [quotaError, setQuotaError] = useState({}); // cwId → quota error info
  const polls = useRef({});

  useEffect(() => {
    getCreatedCourseWork(courseId).then(d => setCreated(d.courseWork||[])).catch(e => toast.error(e.message)).finally(() => setLoadingC(false));
    getNotCreatedCourseWork(courseId).then(d => setImported(d.courseWork||[])).catch(e => toast.error(e.message)).finally(() => setLoadingI(false));
    return () => Object.values(polls.current).forEach(clearInterval);
  }, [courseId]);

  const extractDriveId = (cw) => {
    for (const m of cw.materials||[]) {
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

  const updateForm = (cwId, k, v) => setForms(f => ({ ...f, [cwId]: { ...(f[cwId]||{}), [k]:v } }));

  const startJob = async (cw) => {
    const f = getForm(cw);

    // Validate ALL fields mandatory
    if (!f.rubricContext.trim()) return toast.error('Rubric / Instructions are required');
    if (!f.file) return toast.error('Answer key / Reference file is required');
    if (!f.strictness) return toast.error('Please select a strictness level');

    // Disable button immediately to prevent double submission
    setSubmitting(s => ({ ...s, [cw.id]: true }));
    setQuotaError(q => ({ ...q, [cw.id]: null }));

    const fd = new FormData();
    fd.append('rubricContext', f.rubricContext);
    fd.append('strictness', f.strictness);
    fd.append('maxScore', String(f.maxScore));
    if (f.driveId) fd.append('driveId', f.driveId);
    fd.append('file', f.file);

    try {
      const res = await startGrading(courseId, cw.id, fd);
      toast.success(`Grading queued! ${res.remainingFreeCopies} free copies remaining.`);
      setGrading(g => ({ ...g, [cw.id]: { jobId:res.jobId, state:'queued', progress:{total:0,processed:0,failed:0} } }));
      pollJob(cw.id, res.jobId);
    } catch (e) {
      if (e.status === 402) {
        // Free quota exhausted — show payment prompt
        setQuotaError(q => ({ ...q, [cw.id]: e.data }));
        toast.error('Free quota exhausted. Purchase credits to continue.');
      } else {
        toast.error(e.message);
      }
      // Re-enable button on error so user can fix and retry
      setSubmitting(s => ({ ...s, [cw.id]: false }));
    }
  };

  const pollJob = (cwId, jobId) => {
    const iv = setInterval(async () => {
      try {
        const data = await getJobStatus(courseId, cwId, jobId);
        setGrading(g => ({ ...g, [cwId]: { ...g[cwId], ...data } }));
        if (data.state==='completed'||data.state==='failed') {
          clearInterval(iv); delete polls.current[cwId];
          data.state==='completed' ? toast.success('✅ Grading complete!') : toast.error('Grading job failed');
        }
      } catch { clearInterval(iv); }
    }, POLL_MS);
    polls.current[cwId] = iv;
  };

  const syncMarks = async (cwId) => {
    setSyncing(s => ({...s,[cwId]:true}));
    try {
      const res = await syncMarksToClassroom(courseId, cwId);
      setSyncResult(r => ({...r,[cwId]:res}));
      toast.success(`Synced ${res.patchedCount} grades to Classroom!`);
    } catch(e) { toast.error(e.message); }
    finally { setSyncing(s => ({...s,[cwId]:false})); }
  };

  return (
    <div className="page-wrap">
      <div className="fade-up" style={{marginBottom:32}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <button onClick={() => nav('/courses')} className="back-btn"><ArrowLeft size={18} color="#94a3b8"/></button>
            <div>
              <p style={{fontSize:12,color:'#475569',marginBottom:2,fontFamily:'monospace'}}>{courseId}</p>
              <h1 className="page-title" style={{marginBottom:0}}>Assignments</h1>
            </div>
          </div>
          <button className="btn btn-cyan btn-sm" onClick={() => nav('/create')}><PlusCircle size={14}/> New Assignment</button>
        </div>
      </div>

      {/* Info banners */}
      <div className="fade-up" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:28,animationDelay:'0.05s'}}>
        <div style={{padding:'16px 20px',borderRadius:14,background:'rgba(6,182,212,0.05)',border:'1px solid rgba(6,182,212,0.2)'}}>
          <div style={{display:'flex',gap:12}}>
            <TrendingUp size={18} color="#22d3ee" style={{flexShrink:0,marginTop:2}}/>
            <div>
              <h3 style={{color:'#22d3ee',fontSize:14,fontWeight:500,marginBottom:6}}>Graded via AutoGrade.ai</h3>
              <p style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>Assignments graded at least once. These support the Sync to Classroom feature.</p>
            </div>
          </div>
        </div>
        <div style={{padding:'16px 20px',borderRadius:14,background:'rgba(139,92,246,0.05)',border:'1px solid rgba(139,92,246,0.2)'}}>
          <div style={{display:'flex',gap:12}}>
            <Clock size={18} color="#a78bfa" style={{flexShrink:0,marginTop:2}}/>
            <div>
              <h3 style={{color:'#a78bfa',fontSize:14,fontWeight:500,marginBottom:6}}>Not Yet Graded</h3>
              <p style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>Assignments from Classroom not yet graded. Grade them first to unlock sync.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:28,animationDelay:'0.1s'}}>
        <CwSection
          title="Graded via AutoGrade.ai" count={loadingC?'…':created.length}
          dotColor="#22d3ee" headerBg="rgba(16,185,129,0.05)" headerBorder="rgba(16,185,129,0.1)"
          titleColor="#34d399" badge="Sync enabled" badgeCls="badge-emerald"
          loading={loadingC} items={created} isCreated={true}
          expanded={expanded} onToggle={id=>setExpanded(expanded===id?null:id)}
          grading={grading} getForm={getForm} updateForm={updateForm}
          onStartJob={startJob} submitting={submitting} quotaError={quotaError}
          onSync={syncMarks} syncing={syncing} syncResult={syncResult}
          courseId={courseId}
        />
        <CwSection
          title="Not Yet Graded" count={loadingI?'…':imported.length}
          dotColor="#94a3b8" headerBg="rgba(255,255,255,0.02)" headerBorder="rgba(255,255,255,0.06)"
          titleColor="#94a3b8" infoLabel="Grade only"
          loading={loadingI} items={imported} isCreated={false}
          expanded={expanded} onToggle={id=>setExpanded(expanded===id?null:id)}
          grading={grading} getForm={getForm} updateForm={updateForm}
          onStartJob={startJob} submitting={submitting} quotaError={quotaError}
          courseId={courseId}
        />
      </div>

      <style>{`
        .back-btn { width:40px; height:40px; border-radius:10px; background:rgba(15,23,42,0.5); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.2s; }
        .back-btn:hover { background:rgba(255,255,255,0.05); }
        @media(max-width:640px) { div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns:1fr !important; } }
      `}</style>
    </div>
  );
}

function CwSection({ title, count, dotColor, headerBg, headerBorder, titleColor, badge, badgeCls, infoLabel, loading, items, isCreated, expanded, onToggle, grading, getForm, updateForm, onStartJob, submitting, quotaError, onSync, syncing, syncResult, courseId }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderRadius:12,background:headerBg,border:`1px solid ${headerBorder}`}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:dotColor,flexShrink:0}}/>
        <h2 style={{fontSize:16,fontWeight:500,color:titleColor,flex:1}}>{title}</h2>
        <span className="badge badge-slate" style={{fontSize:11}}>{count}</span>
        {badge && <span className={`badge ${badgeCls}`} style={{fontSize:10}}>{badge}</span>}
        {infoLabel && <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#475569'}}><Info size={11}/>{infoLabel}</div>}
      </div>
      {loading ? [1,2].map(i=><div key={i} className="skeleton" style={{height:64}}/>)
        : items.length===0 ? <div className="glass-card" style={{padding:24,textAlign:'center',fontSize:13,color:'#475569',borderStyle:'dashed'}}>{isCreated?'No graded assignments yet.':'No ungraded assignments found.'}</div>
        : items.map((cw) => (
          <AssignmentCard key={cw.id} cw={cw} isCreated={isCreated}
            expanded={expanded===cw.id} onToggle={()=>onToggle(cw.id)}
            job={grading[cw.id]} form={getForm(cw)}
            onFormChange={(k,v)=>updateForm(cw.id,k,v)}
            onStartJob={()=>onStartJob(cw)}
            isSubmitting={submitting[cw.id]}
            quotaError={quotaError?.[cw.id]}
            onSync={onSync}
            syncing={syncing?.[cw.id]} syncResult={syncResult?.[cw.id]}
            courseId={courseId}
          />
        ))
      }
    </div>
  );
}

function AssignmentCard({ cw, isCreated, expanded, onToggle, job, form, onFormChange, onStartJob, isSubmitting, quotaError, onSync, syncing, syncResult, courseId }) {
  const fileRef = useRef();
  const accentColor = isCreated ? '#22d3ee' : '#a78bfa';
  const borderColor = expanded ? (isCreated?'rgba(6,182,212,0.25)':'rgba(139,92,246,0.15)') : 'rgba(255,255,255,0.06)';

  // Form is valid when all required fields filled
  const formValid = form.rubricContext?.trim() && form.file && form.strictness;

  return (
    <div className="glass-card" style={{overflow:'hidden',borderColor,transition:'border-color 0.2s'}}>
      <div style={{display:'flex',alignItems:'center',gap:14,padding:'18px 20px',cursor:'pointer'}} onClick={onToggle}>
        <div style={{width:8,height:8,borderRadius:'50%',background:accentColor,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:500,marginBottom:3}}>{cw.title}</div>
          <div style={{fontSize:11,color:'#475569',display:'flex',gap:8,flexWrap:'wrap'}}>
            {cw.maxPoints!=null&&<span>{cw.maxPoints} pts</span>}
            {cw.dueDate&&<span>· Due {fmtDate(cw.dueDate)}</span>}
            <span style={{fontFamily:'monospace'}}>· {cw.id}</span>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          {job && <JobBadge state={job.state} progress={job.progress}/>}
          <Link to={`/grades/${courseId}/${cw.id}`} onClick={e=>e.stopPropagation()} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#94a3b8',fontSize:12,textDecoration:'none'}}>
            <BarChart3 size={13}/> Results
          </Link>
          {expanded ? <ChevronUp size={15} color="#475569"/> : <ChevronDown size={15} color="#475569"/>}
        </div>
      </div>

      {expanded && (
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'20px 20px 24px'}}>
          {cw.description && <p style={{fontSize:13,color:'#64748b',lineHeight:1.65,marginBottom:20}}>{cw.description}</p>}

          {/* Quota exhausted error */}
          {quotaError && (
            <div style={{marginBottom:16,padding:'16px 18px',borderRadius:12,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',display:'flex',alignItems:'flex-start',gap:12}}>
              <XCircle size={18} color="#f87171" style={{flexShrink:0,marginTop:2}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:'#f87171',marginBottom:8}}>{quotaError.message}</div>
                <div style={{display:'flex',flexDirection:'column',gap:4,fontSize:11,color:'#64748b',marginBottom:14}}>
                  {quotaError.freeCopiesLimit !== undefined && (
                    <span>Free copies: {quotaError.usedFreeCopies} used / {quotaError.freeCopiesLimit} limit</span>
                  )}
                  {quotaError.walletBalanceInr !== undefined && (
                    <span>Wallet balance: ₹{Number(quotaError.walletBalanceInr).toFixed(2)}</span>
                  )}
                  {quotaError.requiredWalletInr !== undefined && (
                    <span>Required: ₹{Number(quotaError.requiredWalletInr).toFixed(2)} — please recharge your wallet</span>
                  )}
                  {quotaError.paidCopiesToConsume !== undefined && (
                    <span>{quotaError.paidCopiesToConsume} extra copies will be billed from wallet</span>
                  )}
                </div>
                <Link to="/credits" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',color:'#34d399',fontSize:12,fontWeight:500,textDecoration:'none'}}>
                  <CreditCard size={12}/> Recharge Wallet
                </Link>
              </div>
            </div>
          )}

          {job && (job.state==='active'||job.state==='queued') && <JobProgress job={job}/>}

          {(!job || job.state==='failed') && !quotaError && (
            <div style={{background:'rgba(255,255,255,0.02)',borderRadius:12,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,color:isCreated?'#22d3ee':'#a78bfa',fontSize:15,fontWeight:500}}>
                <Sparkles size={16}/> Configure AI Grading
              </div>
              <p style={{fontSize:11,color:'#475569',marginBottom:16}}>All fields are required to start grading.</p>

              {/* Classroom info chips */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                <InfoChip label="Max Score" value={cw.maxPoints!=null?`${cw.maxPoints} pts`:'Not set'} src="Classroom"/>
                <InfoChip label="Question Paper" value={(()=>{const n=(cw.materials||[]).filter(m=>m?.driveFile).length;return n>0?`✓ ${n} file${n>1?'s':''}`:'No Drive files';})()} src={(cw.materials||[]).filter(m=>m?.driveFile).length>0?'Classroom':null}/>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {/* Rubric — required */}
                <div>
                  <label className="form-label">RUBRIC / INSTRUCTIONS <span style={{color:'#ef4444'}}>*</span></label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Describe grading criteria, what a perfect answer looks like, key points to check..."
                    value={form.rubricContext}
                    onChange={e=>onFormChange('rubricContext',e.target.value)}
                    style={{borderColor: form.rubricContext?.trim() ? 'rgba(16,185,129,0.3)' : undefined}}
                  />
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {/* Strictness — required */}
                  <div>
                    <label className="form-label">STRICTNESS <span style={{color:'#ef4444'}}>*</span></label>
                    <select
                      className="form-input"
                      style={{height:44,borderColor: form.strictness ? 'rgba(16,185,129,0.3)' : undefined}}
                      value={form.strictness}
                      onChange={e=>onFormChange('strictness',e.target.value)}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  {/* Answer key — required */}
                  <div>
                    <label className="form-label">ANSWER KEY / REFERENCE <span style={{color:'#ef4444'}}>*</span></label>
                    <div
                      style={{display:'flex',alignItems:'center',gap:10,height:44,padding:'0 14px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${form.file?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'}`,cursor:'pointer',transition:'border-color 0.2s'}}
                      onClick={()=>fileRef.current.click()}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(16,185,129,0.4)'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=form.file?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'}
                    >
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{display:'none'}} onChange={e=>onFormChange('file',e.target.files[0])}/>
                      <Upload size={14} color={form.file?'#34d399':'#475569'}/>
                      <span style={{fontSize:12,color:form.file?'#f1f5f9':'#334155',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {form.file ? form.file.name : 'Upload required'}
                      </span>
                      {form.file && <CheckCircle size={12} color="#34d399" style={{marginLeft:'auto',flexShrink:0}}/>}
                    </div>
                    <p style={{fontSize:10,color:'#334155',marginTop:4}}>PDF, DOC, DOCX, or TXT</p>
                  </div>
                </div>

                {/* Grade button — disabled after click, re-enabled on error */}
                <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:12,paddingTop:4}}>
                  {!formValid && (
                    <span style={{fontSize:11,color:'#475569'}}>Fill all required fields to enable</span>
                  )}
                  <button
                    className="btn btn-emerald"
                    onClick={onStartJob}
                    disabled={isSubmitting || !formValid}
                    style={{
                      minWidth:160, justifyContent:'center',
                      opacity: (isSubmitting || !formValid) ? 0.5 : 1,
                      cursor: (isSubmitting || !formValid) ? 'not-allowed' : 'pointer',
                      transition:'all 0.2s',
                    }}
                  >
                    {isSubmitting
                      ? <><span className="spinner" style={{width:14,height:14}}/> Submitting…</>
                      : <><Sparkles size={14}/> Grade it Now</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {job?.state==='completed' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:12,background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.15)'}}>
                <CheckCircle size={16} color="#34d399" style={{flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>Grading complete</div>
                  <div style={{fontSize:11,color:'#475569',marginTop:2}}>{job.result?.gradedSubmissions??0} submissions · {job.result?.gradedAttachments??0} graded · {job.result?.failedAttachments??0} failed</div>
                </div>
                <Link to={`/grades/${courseId}/${cw.id}`} className="btn btn-outline btn-sm"><BarChart3 size={12}/> Results</Link>
              </div>

              {isCreated ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,padding:'14px 16px',borderRadius:12,background:'rgba(6,182,212,0.05)',border:'1px solid rgba(6,182,212,0.2)'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:10,flex:1}}>
                    <Send size={15} color="#22d3ee" style={{flexShrink:0,marginTop:2}}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>Sync grades to Google Classroom</div>
                      <div style={{fontSize:11,color:'#64748b'}}>Writes AI scores as assignedGrade on each student submission.</div>
                    </div>
                  </div>
                  <button className="btn btn-sync btn-sm" onClick={()=>onSync(cw.id)} disabled={syncing}>
                    {syncing?<><span className="spinner" style={{width:12,height:12}}/> Syncing…</>:<><Send size={12}/> Sync</>}
                  </button>
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'flex-start',gap:8,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',fontSize:12,color:'#475569'}}>
                  <Info size={12} style={{flexShrink:0,marginTop:2}}/> Sync is available for assignments graded via AutoGrade.ai.
                </div>
              )}

              {syncResult && (
                <div style={{background:'rgba(255,255,255,0.02)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)',padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
                  {[{l:'Synced',v:syncResult.patchedCount,c:'#34d399'},{l:'Missing',v:syncResult.missingSubmissionCount,c:'#facc15'},{l:'Failed',v:syncResult.failedCount,c:'#f87171'}].map(r=>(
                    <div key={r.l} style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                      <span style={{color:'#64748b'}}>{r.l}</span><strong style={{color:r.c}}>{r.v}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoChip({ label, value, src }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,fontSize:11}}>
      <span style={{color:'#475569'}}>{label}:</span>
      <span style={{fontWeight:500}}>{value}</span>
      {src && <span style={{fontSize:9,color:'#22d3ee',background:'rgba(6,182,212,0.1)',padding:'1px 5px',borderRadius:99}}>{src}</span>}
    </div>
  );
}

function JobBadge({ state, progress }) {
  const M = {
    queued:    {bg:'rgba(234,179,8,0.1)',  color:'#facc15', label:'Queued'},
    active:    {bg:'rgba(96,165,250,0.1)', color:'#60a5fa', label:`${progress?.processed||0}/${progress?.total||'?'}`},
    completed: {bg:'rgba(34,197,94,0.1)',  color:'#4ade80', label:'Done'},
    failed:    {bg:'rgba(239,68,68,0.1)',  color:'#f87171', label:'Failed'},
  };
  const b = M[state]||M.queued;
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:99,background:b.bg,color:b.color,fontSize:11,fontWeight:500}}>{b.label}</span>;
}

function JobProgress({ job }) {
  const { progress={}, state } = job;
  const pct = progress.total>0 ? Math.round((progress.processed/progress.total)*100) : 0;
  return (
    <div style={{background:'rgba(255,255,255,0.02)',borderRadius:12,padding:16,marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13}}>
        <span style={{color:'#64748b'}}>{state==='queued'?'Queued — waiting to start…':'Grading submissions…'}</span>
        <span style={{color:'#34d399',fontFamily:'monospace'}}>{pct}%</span>
      </div>
      <div className="score-bar"><div className="score-fill" style={{width:`${pct}%`,background:'linear-gradient(90deg,#059669,#34d399)'}}/></div>
      {progress.total>0&&<div style={{display:'flex',gap:14,marginTop:6,fontSize:11,color:'#475569'}}><span>{progress.processed} processed</span><span>{progress.failed} failed</span><span>{progress.total} total</span></div>}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  const { year, month, day } = d;
  if (!year) return '';
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
