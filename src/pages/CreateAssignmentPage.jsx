import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, createCoursework } from '../api';
import { PlusSquare, Upload, CheckCircle, ArrowRight, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateAssignmentPage() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // { courseworkId, driveId, courseId }
  const fileRef = useRef();
  const nav = useNavigate();

  const [form, setForm] = useState({
    courseId: '', title: '', description: '',
    maxPoints: '', dueDate: '', file: null,
  });

  useEffect(() => {
    getCourses()
      .then(d => { setCourses(d.courses||[]); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoadingCourses(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      if (form.dueDate)     fd.append('dueDate', form.dueDate);

      const res = await createCoursework(form.courseId, fd);
      setDone({ ...res, courseId: form.courseId });
      toast.success('Assignment created and published to Classroom!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="page" style={{maxWidth:620}}>
        <div className="success-card card fade-up">
          <div className="success-icon"><CheckCircle size={36} style={{color:'var(--green)'}}/></div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:8}}>Assignment Published!</h2>
          <p style={{color:'var(--text-2)',fontSize:14,marginBottom:24,lineHeight:1.7}}>
            Your assignment has been created in Google Classroom and registered in our system.
            Students can now submit their work, and you can start AI grading once they do.
          </p>
          <div className="success-ids">
            <div className="sid-row"><span className="sid-label">Coursework ID</span><span className="mono sid-val">{done.courseworkId}</span></div>
            <div className="sid-row"><span className="sid-label">Drive File ID</span><span className="mono sid-val">{done.driveId}</span></div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:24,flexWrap:'wrap'}}>
            <button className="btn btn-secondary" onClick={()=>{setDone(null);setForm({courseId:'',title:'',description:'',maxPoints:'',dueDate:'',file:null});}}>
              <PlusSquare size={13}/> Create Another
            </button>
            <button className="btn btn-primary" onClick={()=>nav(`/courses/${done.courseId}`)}>
              Go to Course <ArrowRight size={13}/>
            </button>
          </div>
        </div>
        <style>{`
          .success-card{padding:36px;display:flex;flex-direction:column;align-items:center;text-align:center;}
          .success-icon{width:72px;height:72px;border-radius:18px;background:var(--green-bg);display:flex;align-items:center;justify-content:center;margin-bottom:20px;}
          .success-ids{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;width:100%;display:flex;flex-direction:column;gap:10px;}
          .sid-row{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px;}
          .sid-label{color:var(--text-3);}
          .sid-val{color:var(--accent-2);font-size:11px;word-break:break-all;text-align:right;}
        `}</style>
      </div>
    );
  }

  return (
    <div className="page" style={{maxWidth:680}}>
      <div className="page-header">
        <div>
          <p className="page-label">AutoGrade</p>
          <h1 className="page-title">Create Assignment</h1>
          <p className="page-sub">Upload a question paper — we publish it to Classroom and register it for AI grading.</p>
        </div>
      </div>

      <div className="info-banner fade-up">
        <Info size={14} style={{flexShrink:0,marginTop:1}}/>
        <span>Only assignments created here will have the <strong>Sync to Classroom</strong> option after grading. Imported assignments from Classroom cannot be synced back.</span>
      </div>

      <form onSubmit={handleSubmit} className="create-form fade-up">
        {/* Course select */}
        <div className="input-group">
          <label className="label">Course *</label>
          <select className="input" value={form.courseId} onChange={e=>set('courseId',e.target.value)} disabled={loadingCourses}>
            <option value="">— Select a course —</option>
            {courses.map(c=><option key={c.id} value={c.id}>{c.name}{c.section?` (${c.section})`:''}</option>)}
          </select>
        </div>

        {/* Title */}
        <div className="input-group">
          <label className="label">Assignment Title *</label>
          <input className="input" placeholder="e.g. Chapter 5 Assignment" value={form.title} onChange={e=>set('title',e.target.value)}/>
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="label">Description <span style={{fontWeight:400,textTransform:'none',color:'var(--text-3)'}}>optional</span></label>
          <textarea className="input" rows={3} placeholder="Instructions or notes for students…" value={form.description} onChange={e=>set('description',e.target.value)}/>
        </div>

        {/* Max points + due date */}
        <div className="two-col">
          <div className="input-group">
            <label className="label">Max Points <span style={{fontWeight:400,textTransform:'none',color:'var(--text-3)'}}>optional</span></label>
            <input className="input" type="number" min={1} placeholder="100" value={form.maxPoints} onChange={e=>set('maxPoints',e.target.value)}/>
          </div>
          <div className="input-group">
            <label className="label">Due Date <span style={{fontWeight:400,textTransform:'none',color:'var(--text-3)'}}>optional</span></label>
            <input className="input" type="date" value={form.dueDate} onChange={e=>set('dueDate',e.target.value)}/>
          </div>
        </div>

        {/* File upload */}
        <div className="input-group">
          <label className="label">Question Paper File *</label>
          <div className="file-drop" onClick={()=>fileRef.current.click()}>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg" style={{display:'none'}} onChange={e=>set('file',e.target.files[0])}/>
            <Upload size={20} style={{color:form.file?'var(--accent-2)':'var(--text-3)'}}/>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:form.file?'var(--text)':'var(--text-2)'}}>
                {form.file ? form.file.name : 'Click to upload question paper'}
              </div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:3}}>
                {form.file ? `${(form.file.size/1024).toFixed(1)} KB` : 'PDF, DOC, DOCX, TXT, PNG, JPG'}
              </div>
            </div>
            {form.file && <CheckCircle size={16} style={{color:'var(--green)',marginLeft:'auto'}}/>}
          </div>
          <p className="file-note">The file will be uploaded to Google Drive and attached to the Classroom assignment. Students will see it as a view-only material.</p>
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',paddingTop:8}}>
          <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
            {submitting ? <><span className="spinner"/> Publishing…</> : <><PlusSquare size={14}/> Publish to Classroom</>}
          </button>
        </div>
      </form>

      <style>{`
        .info-banner{display:flex;align-items:flex-start;gap:10px;padding:13px 15px;background:var(--accent-glow);border:1px solid rgba(124,106,247,0.2);border-radius:var(--radius-sm);font-size:13px;color:var(--text-2);line-height:1.6;margin-bottom:24px;}
        .create-form{display:flex;flex-direction:column;gap:18px;}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .file-drop{display:flex;align-items:center;gap:14px;padding:18px;background:var(--bg-2);border:1.5px dashed var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:border-color 0.18s;}
        .file-drop:hover{border-color:var(--accent);}
        .file-note{font-size:11px;color:var(--text-3);line-height:1.6;margin-top:6px;}
      `}</style>
    </div>
  );
}
