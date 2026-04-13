import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Info, Clock, CheckCircle, ArrowRight, PlusCircle } from 'lucide-react';
import { getCourses, createCoursework } from '../api';
import toast from 'react-hot-toast';

export default function CreateAssignmentPage() {
  const nav = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const fileRef = useRef();

  const [form, setForm] = useState({ courseId:'', title:'', description:'', maxPoints:'', dueDate:'', dueTime:'23:59', file:null });

  useEffect(() => {
    getCourses().then(d=>setCourses(d.courses||[])).catch(e=>toast.error(e.message)).finally(()=>setLoadingCourses(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courseId) return toast.error('Select a course');
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.file) return toast.error('Question paper file is required');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', form.file);
      fd.append('title', form.title);
      if (form.description) fd.append('description', form.description);
      if (form.maxPoints)   fd.append('maxPoints', String(form.maxPoints));
      if (form.dueDate) { fd.append('dueDate', form.dueDate); fd.append('dueTime', form.dueTime||'23:59'); }
      const res = await createCoursework(form.courseId, fd);
      setDone({ ...res, courseId:form.courseId, dueDate:form.dueDate, dueTime:form.dueTime });
      toast.success('Assignment published to Classroom!');
    } catch(e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const reset = () => { setDone(null); setForm({ courseId:'', title:'', description:'', maxPoints:'', dueDate:'', dueTime:'23:59', file:null }); };

  if (done) {
    return (
      <div className="page-wrap" style={{maxWidth:600}}>
        <div className="glass-card fade-up" style={{padding:40,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
          <div style={{width:72,height:72,borderRadius:18,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
            <CheckCircle size={36} color="#34d399"/>
          </div>
          <h2 style={{fontSize:22,fontWeight:600,marginBottom:10}}>Assignment Published!</h2>
          <p style={{color:'#64748b',fontSize:14,marginBottom:28,lineHeight:1.7}}>Your assignment has been created in Google Classroom. Students can now submit their work.</p>
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:16,width:'100%',display:'flex',flexDirection:'column',gap:10,marginBottom:28}}>
            {[{l:'Coursework ID',v:done.courseworkId},{l:'Drive File ID',v:done.driveId},...(done.dueDate?[{l:'Deadline',v:`${done.dueDate} at ${done.dueTime}`}]:[])].map(r=>(
              <div key={r.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,fontSize:12}}>
                <span style={{color:'#475569'}}>{r.l}</span>
                <span style={{color:'#22d3ee',fontFamily:'monospace',fontSize:11,wordBreak:'break-all',textAlign:'right'}}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
            <button className="btn btn-outline" onClick={reset}><PlusCircle size={13}/> Create Another</button>
            <button className="btn btn-emerald" onClick={() => nav(`/courses/${done.courseId}`)}>Go to Course <ArrowRight size={13}/></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{maxWidth:760}}>
      <div className="fade-up" style={{marginBottom:28}}>
        <p className="page-eyebrow">AutoGrade</p>
        <h1 className="page-title">Create Assignment</h1>
        <p className="page-sub">Upload a question paper — we publish it to Classroom and register it for AI grading.</p>
      </div>

      <div className="fade-up" style={{marginBottom:28,padding:'16px 20px',borderRadius:14,background:'rgba(139,92,246,0.07)',border:'1px solid rgba(139,92,246,0.2)',display:'flex',gap:12,animationDelay:'0.05s'}}>
        <Info size={18} color="#34d399" style={{flexShrink:0,marginTop:2}}/>
        <p style={{fontSize:13,color:'#94a3b8',lineHeight:1.6}}>
          Assignments created here will appear under <span style={{color:'#34d399',fontWeight:500}}>Graded via AutoGrade.ai</span> on the course page, and support the <span style={{color:'#34d399',fontWeight:500}}>Sync to Classroom</span> feature after grading.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="fade-up" style={{display:'flex',flexDirection:'column',gap:22,animationDelay:'0.1s'}}>
        <div>
          <label className="form-label">COURSE <span style={{color:'#ef4444'}}>*</span></label>
          <select className="form-input" style={{height:48}} value={form.courseId} onChange={e=>set('courseId',e.target.value)} disabled={loadingCourses}>
            <option value="">— Select a course —</option>
            {courses.map(c=><option key={c.id} value={c.id}>{c.name}{c.section?` (${c.section})`:''}</option>)}
          </select>
        </div>

        <div>
          <label className="form-label">ASSIGNMENT TITLE <span style={{color:'#ef4444'}}>*</span></label>
          <input className="form-input" style={{height:48}} placeholder="e.g. Chapter 5 Assignment" value={form.title} onChange={e=>set('title',e.target.value)}/>
        </div>

        <div>
          <label className="form-label">DESCRIPTION <Opt/></label>
          <textarea className="form-input" rows={4} placeholder="Instructions or notes for students..." value={form.description} onChange={e=>set('description',e.target.value)}/>
        </div>

        <div>
          <label className="form-label">MAX POINTS <Opt/></label>
          <input className="form-input" style={{height:48}} type="number" min={1} placeholder="100" value={form.maxPoints} onChange={e=>set('maxPoints',e.target.value)}/>
        </div>

        <div>
          <label className="form-label" style={{display:'flex',alignItems:'center',gap:6}}><Clock size={13}/> DEADLINE <Opt/></label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <label style={{fontSize:11,color:'#475569',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Date</label>
              <input className="form-input" type="date" style={{height:48}} value={form.dueDate} onChange={e=>set('dueDate',e.target.value)} min={new Date().toISOString().split('T')[0]}/>
            </div>
            <div>
              <label style={{fontSize:11,color:'#475569',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Time <span style={{fontWeight:400,textTransform:'none',fontSize:10}}>(defaults to 23:59)</span></label>
              <input className="form-input" type="time" style={{height:48,opacity:form.dueDate?1:0.4,cursor:form.dueDate?'auto':'not-allowed'}} value={form.dueTime} onChange={e=>set('dueTime',e.target.value)} disabled={!form.dueDate}/>
            </div>
          </div>
          {form.dueDate && (
            <div style={{marginTop:10,display:'flex',alignItems:'center',gap:7,padding:'8px 12px',background:'rgba(6,182,212,0.06)',border:'1px solid rgba(6,182,212,0.2)',borderRadius:8,fontSize:12,color:'#22d3ee'}}>
              <CheckCircle size={12}/> Deadline: <strong>{form.dueDate}</strong> at <strong>{form.dueTime||'23:59'}</strong>
            </div>
          )}
        </div>

        <div>
          <label className="form-label">QUESTION PAPER FILE <span style={{color:'#ef4444'}}>*</span></label>
          <div
            style={{display:'flex',alignItems:'center',gap:16,padding:24,borderRadius:14,background:'rgba(15,23,42,0.5)',border:`2px dashed ${form.file?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.08)'}`,cursor:'pointer',transition:'border-color 0.2s'}}
            onClick={() => fileRef.current.click()}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(139,92,246,0.4)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor=form.file?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.08)'}
          >
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style={{display:'none'}} onChange={e=>set('file',e.target.files[0])}/>
            <div style={{width:48,height:48,borderRadius:12,background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Upload size={22} color={form.file?'#34d399':'#475569'}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:500,color:form.file?'#f1f5f9':'#94a3b8',marginBottom:2}}>{form.file?form.file.name:'Click to upload question paper'}</p>
              <p style={{fontSize:11,color:'#334155'}}>{form.file?`${(form.file.size/1024).toFixed(1)} KB`:'PDF, DOC, DOCX, TXT, PNG, JPG'}</p>
            </div>
            {form.file && <CheckCircle size={18} color="#34d399"/>}
          </div>
          <p style={{fontSize:11,color:'#334155',marginTop:8,lineHeight:1.6}}>The file is uploaded to Google Drive and attached to the assignment as view-only material for students.</p>
        </div>

        <div style={{paddingTop:8}}>
          <button className="btn btn-emerald btn-lg" type="submit" disabled={submitting}>
            {submitting?<><span className="spinner"/> Publishing…</>:<><Upload size={16}/> Publish to Classroom</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Opt() {
  return <span style={{fontWeight:400,textTransform:'none',color:'#334155',fontSize:10,marginLeft:4}}>optional</span>;
}
