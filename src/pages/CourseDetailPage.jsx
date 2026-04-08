import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseWork, startGrading, getJobStatus } from '../api';
import { ArrowLeft, Zap, Upload, ChevronDown, ChevronUp, Loader, CheckCircle, XCircle, Clock, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 3000;

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [courseWork, setCourseWork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState({}); // { [cwId]: { jobId, status, progress, result } }
  const [expanded, setExpanded] = useState(null);
  const [forms, setForms] = useState({}); // per-coursework form state
  const pollRefs = useRef({});

  useEffect(() => {
    getCourseWork(courseId)
      .then(d => setCourseWork(d.courseWork || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
    return () => Object.values(pollRefs.current).forEach(clearInterval);
  }, [courseId]);

  const updateForm = (cwId, field, value) => {
    setForms(f => ({ ...f, [cwId]: { ...(f[cwId] || {}), [field]: value } }));
  };

  const getForm = (cwId) => forms[cwId] || { rubricContext: '', strictness: 'Medium', maxScore: 100, driveId: '', file: null };

  const startJob = async (cw) => {
    const f = getForm(cw.id);
    if (!f.rubricContext) return toast.error('Rubric context is required');
    const fd = new FormData();
    fd.append('rubricContext', f.rubricContext);
    fd.append('strictness', f.strictness);
    fd.append('maxScore', String(f.maxScore));
    if (f.driveId) fd.append('driveId', f.driveId);
    if (f.file) fd.append('file', f.file);

    try {
      const res = await startGrading(courseId, cw.id, fd);
      toast.success('Grading job started!');
      setGrading(g => ({ ...g, [cw.id]: { jobId: res.jobId, status: 'queued', progress: { total: 0, processed: 0, failed: 0 } } }));
      pollJob(courseId, cw.id, res.jobId);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const pollJob = (cid, cwId, jobId) => {
    const interval = setInterval(async () => {
      try {
        const data = await getJobStatus(cid, cwId, jobId);
        setGrading(g => ({ ...g, [cwId]: { ...g[cwId], ...data } }));
        if (data.state === 'completed' || data.state === 'failed') {
          clearInterval(interval);
          delete pollRefs.current[cwId];
          if (data.state === 'completed') toast.success('Grading complete!');
          else toast.error('Grading job failed');
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, POLL_INTERVAL);
    pollRefs.current[cwId] = interval;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/courses" className="btn btn-secondary btn-sm btn-icon">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <p className="page-label mono">Course ID: {courseId}</p>
            <h1 className="page-title">Assignments</h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="cw-list">
          {[1,2,3].map(i => (
            <div key={i} className="card cw-skeleton">
              <div className="skeleton" style={{ height: 18, width: '40%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '20%' }} />
            </div>
          ))}
        </div>
      ) : courseWork.length === 0 ? (
        <div className="empty-state">
          <BarChart2 size={40} style={{ opacity: 0.3 }} />
          <p>No coursework found for this course.</p>
        </div>
      ) : (
        <div className="cw-list fade-up">
          {courseWork.map((cw, i) => {
            const job = grading[cw.id];
            const isExpanded = expanded === cw.id;
            const f = getForm(cw.id);

            return (
              <div key={cw.id} className="card cw-item" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="cw-header" onClick={() => setExpanded(isExpanded ? null : cw.id)}>
                  <div className="cw-header-left">
                    <div className="cw-type-dot" />
                    <div>
                      <div className="cw-title">{cw.title}</div>
                      <div className="cw-meta">
                        {cw.dueDate && <span>Due: {formatDate(cw.dueDate)}</span>}
                        {cw.maxPoints != null && <span>Max: {cw.maxPoints} pts</span>}
                        <span className="mono" style={{ color: 'var(--text-3)', fontSize: 11 }}>{cw.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="cw-header-right">
                    {job && <JobBadge state={job.state} progress={job.progress} />}
                    <Link
                      to={`/grades/${courseId}/${cw.id}`}
                      className="btn btn-ghost btn-sm"
                      onClick={e => e.stopPropagation()}
                    >
                      <BarChart2 size={13} /> Results
                    </Link>
                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-3)' }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="cw-form fade-up">
                    <div className="divider" style={{ margin: '0 0 20px 0' }} />
                    {cw.description && (
                      <div className="cw-description">{cw.description}</div>
                    )}

                    {job && (job.state === 'active' || job.state === 'queued') && (
                      <JobProgress job={job} />
                    )}

                    {(!job || job.state === 'failed') && (
                      <div className="grade-form">
                        <h3 className="form-title"><Zap size={15} /> Configure Grading</h3>
                        <div className="form-grid">
                          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="label">Rubric / Instructions *</label>
                            <textarea
                              className="input"
                              rows={3}
                              placeholder="Describe what a perfect answer looks like, key points to check, grading criteria..."
                              value={f.rubricContext}
                              onChange={e => updateForm(cw.id, 'rubricContext', e.target.value)}
                              style={{ resize: 'vertical' }}
                            />
                          </div>
                          <div className="input-group">
                            <label className="label">Strictness</label>
                            <select className="input" value={f.strictness} onChange={e => updateForm(cw.id, 'strictness', e.target.value)}>
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                          <div className="input-group">
                            <label className="label">Max Score</label>
                            <input className="input" type="number" min={1} value={f.maxScore} onChange={e => updateForm(cw.id, 'maxScore', e.target.value)} />
                          </div>
                          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="label">Question Paper Drive ID (optional)</label>
                            <input className="input" placeholder="Google Drive file ID for the question paper" value={f.driveId} onChange={e => updateForm(cw.id, 'driveId', e.target.value)} />
                          </div>
                          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="label">Reference / Answer Key File (optional)</label>
                            <FileDropzone onFile={file => updateForm(cw.id, 'file', file)} currentFile={f.file} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                          <button className="btn btn-primary" onClick={() => startJob(cw)}>
                            <Zap size={14} /> Start AI Grading
                          </button>
                        </div>
                      </div>
                    )}

                    {job?.state === 'completed' && (
                      <div className="job-done">
                        <CheckCircle size={18} style={{ color: 'var(--green)' }} />
                        <span>Grading complete — {job.result?.gradedSubmissions ?? 0} submissions graded</span>
                        <Link to={`/grades/${courseId}/${cw.id}`} className="btn btn-primary btn-sm">View Results</Link>
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
        .page { padding: 40px; max-width: 900px; }
        .page-header { margin-bottom: 32px; }
        .page-label { font-size: 13px; color: var(--text-3); margin-bottom: 4px; }
        .page-title { font-size: 28px; font-weight: 800; }
        .cw-list { display: flex; flex-direction: column; gap: 12px; }
        .cw-skeleton { padding: 20px; }
        .cw-item { overflow: hidden; }
        .cw-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px; cursor: pointer;
          transition: background 0.15s;
        }
        .cw-header:hover { background: rgba(255,255,255,0.02); }
        .cw-header-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
        .cw-type-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
        .cw-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
        .cw-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-3); flex-wrap: wrap; }
        .cw-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .cw-form { padding: 0 20px 20px; }
        .cw-description { font-size: 13px; color: var(--text-2); margin-bottom: 20px; line-height: 1.6; }
        .grade-form { background: var(--bg-2); border-radius: var(--radius-sm); padding: 20px; }
        .form-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-bottom: 16px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .job-done {
          display: flex; align-items: center; gap: 12px;
          padding: 16px; background: var(--green-bg);
          border: 1px solid rgba(52,211,153,0.2); border-radius: var(--radius-sm);
          color: var(--green); font-size: 14px;
        }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 60px; color: var(--text-2); text-align: center; }
      `}</style>
    </div>
  );
}

function JobBadge({ state, progress }) {
  const map = {
    queued: { cls: 'badge-yellow', label: 'Queued', icon: <Clock size={11} /> },
    active: { cls: 'badge-blue', label: `Grading ${progress?.processed || 0}/${progress?.total || '?'}`, icon: <Loader size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> },
    completed: { cls: 'badge-green', label: 'Done', icon: <CheckCircle size={11} /> },
    failed: { cls: 'badge-red', label: 'Failed', icon: <XCircle size={11} /> },
  };
  const b = map[state] || map.queued;
  return <span className={`badge ${b.cls}`}>{b.icon}{b.label}</span>;
}

function JobProgress({ job }) {
  const { progress = {}, state } = job;
  const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
  return (
    <div className="job-progress">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
        <span style={{ color: 'var(--text-2)' }}>
          {state === 'queued' ? 'Job queued, waiting to start...' : `Grading submissions...`}
        </span>
        <span className="mono" style={{ color: 'var(--accent-2)' }}>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {progress.total > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
          <span>{progress.processed} processed</span>
          <span>{progress.failed} failed</span>
          <span>{progress.total} total</span>
        </div>
      )}
      <style>{`.job-progress { background: var(--bg-2); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 16px; }`}</style>
    </div>
  );
}

function FileDropzone({ onFile, currentFile }) {
  const ref = useRef();
  return (
    <div className="dropzone" onClick={() => ref.current.click()}>
      <input ref={ref} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={e => onFile(e.target.files[0])} />
      <Upload size={16} style={{ color: 'var(--text-3)' }} />
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
        {currentFile ? currentFile.name : 'Click to upload PDF, DOC, or TXT'}
      </span>
      <style>{`.dropzone { display: flex; align-items: center; gap: 10px; padding: 14px; background: var(--bg); border: 1px dashed var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: border-color 0.18s; } .dropzone:hover { border-color: var(--accent); }`}</style>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  const { year, month, day } = d;
  if (!year) return '';
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
