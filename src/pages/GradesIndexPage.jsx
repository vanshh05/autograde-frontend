import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getCourseWork } from '../api';
import { BarChart2, ArrowRight, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GradesIndexPage() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState('');
  const [courseWork, setCourseWork] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingCW, setLoadingCW] = useState(false);

  useEffect(() => {
    getCourses()
      .then(d => setCourses(d.courses || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoadingCourses(false));
  }, []);

  const handleSelect = async (courseId) => {
    setSelected(courseId);
    setCourseWork([]);
    if (!courseId) return;
    setLoadingCW(true);
    try {
      const d = await getCourseWork(courseId);
      setCourseWork(d.courseWork || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingCW(false);
    }
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <p className="page-label">Results</p>
        <h1 className="page-title">Grade Results</h1>
        <p className="page-sub">Select a course and assignment to view grading results.</p>
      </div>

      <div className="grade-picker fade-up">
        <div className="input-group" style={{ flex: 1 }}>
          <label className="label">Select Course</label>
          <div style={{ position: 'relative' }}>
            <select className="input" value={selected} onChange={e => handleSelect(e.target.value)} disabled={loadingCourses}>
              <option value="">— Select a course —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loadingCW && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', padding: '20px 0', fontSize: 14 }}>
          <span className="spinner" /> Loading assignments...
        </div>
      )}

      {!loadingCW && courseWork.length > 0 && (
        <div className="cw-cards fade-up">
          <p className="section-title" style={{ marginBottom: 16 }}>Pick an Assignment</p>
          {courseWork.map(cw => (
            <Link
              key={cw.id}
              to={`/grades/${selected}/${cw.id}`}
              className="card cw-card"
            >
              <div>
                <div className="cw-card-title">{cw.title}</div>
                {cw.dueDate && <div className="cw-card-meta">Due: {formatDate(cw.dueDate)}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChart2 size={15} style={{ color: 'var(--accent)' }} />
                <ArrowRight size={15} style={{ color: 'var(--text-3)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loadingCW && selected && courseWork.length === 0 && (
        <div className="empty-state">
          <BarChart2 size={40} style={{ opacity: 0.3 }} />
          <p>No assignments found for this course.</p>
        </div>
      )}

      <style>{`
        .page { padding: 40px; max-width: 700px; }
        .page-label { font-size: 13px; color: var(--text-3); margin-bottom: 6px; font-family: 'DM Mono', monospace; }
        .page-title { font-size: 32px; font-weight: 800; margin-bottom: 6px; }
        .page-sub { color: var(--text-2); font-size: 14px; }
        .grade-picker { display: flex; gap: 14px; margin-bottom: 28px; }
        .section-title { font-size: 16px; font-weight: 600; }
        .cw-cards { display: flex; flex-direction: column; gap: 10px; }
        .cw-card {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; text-decoration: none; color: inherit; cursor: pointer;
          transition: all 0.18s;
        }
        .cw-card:hover { border-color: var(--accent); transform: translateX(4px); }
        .cw-card-title { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
        .cw-card-meta { font-size: 12px; color: var(--text-3); }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 60px; color: var(--text-2); text-align: center; }
      `}</style>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  const { year, month, day } = d;
  if (!year) return '';
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
