import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDashboard, getCourseWork } from '../api';
import { ArrowLeft, Users, TrendingUp, Award, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const REMARK_COLORS = {
  Excellent: 'badge-green',
  Good: 'badge-blue',
  Fair: 'badge-yellow',
  Poor: 'badge-red',
  'Very Poor': 'badge-red',
};

export default function GradePage() {
  const { courseId, courseWorkId } = useParams();
  const [results, setResults] = useState([]);
  const [maxPoints, setMaxPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('score_desc');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!courseId || !courseWorkId) return;
    Promise.all([
      getDashboard(courseId, courseWorkId),
      getCourseWork(courseId),
    ])
      .then(([dashboard, cwData]) => {
        setResults(dashboard.results || []);
        const cw = (cwData.courseWork || []).find(c => c.id === courseWorkId);
        if (cw?.maxPoints != null) setMaxPoints(cw.maxPoints);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [courseId, courseWorkId]);

  const filtered = results
    .filter(r =>
      (r.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.studentEmail || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'score_desc') return b.score - a.score;
      if (sort === 'score_asc') return a.score - b.score;
      if (sort === 'name') return (a.studentName || '').localeCompare(b.studentName || '');
      return 0;
    });

  // Use fetched maxPoints, fallback to highest score in results, fallback to 100
  const resolvedMax = maxPoints ?? (results.length ? Math.max(...results.map(r => r.score)) : 100);
  const avg = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const top = results.length ? Math.max(...results.map(r => r.score)) : 0;
  const remarkDist = results.reduce((acc, r) => { acc[r.remark] = (acc[r.remark] || 0) + 1; return acc; }, {});

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to={courseId ? `/courses/${courseId}` : '/courses'} className="btn btn-secondary btn-sm btn-icon">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <p className="page-label mono">{courseWorkId ? `CW: ${courseWorkId}` : 'All Results'}</p>
            <h1 className="page-title">Grade Results</h1>
          </div>
        </div>
      </div>

      {/* Stats */}
      {results.length > 0 && (
        <div className="grade-stats fade-up">
          <StatPill icon={<Users size={14} />} label="Students" value={results.length} />
          <StatPill icon={<TrendingUp size={14} />} label="Average" value={`${avg} / ${resolvedMax}`} />
          <StatPill icon={<Award size={14} />} label="Top Score" value={`${top} / ${resolvedMax}`} />
          {Object.entries(remarkDist).map(([remark, count]) => (
            <StatPill key={remark} label={remark} value={count} small />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="grade-controls fade-up">
        <input
          className="input"
          style={{ maxWidth: 260, padding: '9px 14px', fontSize: 13 }}
          placeholder="Search students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input" style={{ maxWidth: 180, padding: '9px 14px', fontSize: 13 }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="score_desc">Highest first</option>
          <option value="score_asc">Lowest first</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="results-table-wrap fade-up">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 58, borderRadius: 8, marginBottom: 8 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state fade-up">
          <AlertCircle size={40} style={{ opacity: 0.3 }} />
          <p>{results.length === 0 ? 'No grading results yet. Start a grading job from the Courses page.' : `No results match "${search}"`}</p>
        </div>
      ) : (
        <div className="results-table-wrap fade-up">
          <table className="results-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score / {resolvedMax}</th>
                <th>Grade</th>
                <th>Remark</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <>
                  <tr key={r.id || r.studentId} className="result-row" onClick={() => setExpanded(expanded === r.studentId ? null : r.studentId)}>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar">{(r.studentName || 'S')[0].toUpperCase()}</div>
                        <div>
                          <div className="student-name">{r.studentName}</div>
                          <div className="student-email">{r.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="score-cell">
                        <ScoreBar score={r.score} maxScore={resolvedMax} />
                        <span className="score-num mono">{r.score}</span>
                      </div>
                    </td>
                    <td><span className="grade-pill">{r.grade}</span></td>
                    <td><span className={`badge ${REMARK_COLORS[r.remark] || 'badge-purple'}`}>{r.remark}</span></td>
                    <td><span className={`badge ${r.status === 'completed' ? 'badge-green' : r.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>{r.status}</span></td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{expanded === r.studentId ? '▲' : '▼'}</td>
                  </tr>
                  {expanded === r.studentId && (
                    <tr className="feedback-row">
                      <td colSpan={6}>
                        <div className="feedback-box">
                          <strong>AI Feedback</strong>
                          <p>{r.feedback || 'No feedback provided.'}</p>
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
        .page { padding: 40px; max-width: 1000px; }
        .page-header { margin-bottom: 28px; }
        .page-label { font-size: 12px; color: var(--text-3); margin-bottom: 4px; }
        .page-title { font-size: 28px; font-weight: 800; }
        .grade-stats {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-bottom: 24px;
        }
        .grade-controls {
          display: flex; gap: 10px; flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .results-table-wrap {
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .results-table {
          width: 100%;
          border-collapse: collapse;
        }
        .results-table th {
          text-align: left;
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom: 1px solid var(--border);
          background: var(--bg-2);
        }
        .result-row {
          cursor: pointer;
          transition: background 0.15s;
        }
        .result-row:hover { background: rgba(255,255,255,0.02); }
        .results-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
          vertical-align: middle;
        }
        .result-row:last-child td { border-bottom: none; }
        .student-cell { display: flex; align-items: center; gap: 10px; }
        .student-avatar {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--accent-glow); color: var(--accent-2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          flex-shrink: 0;
        }
        .student-name { font-weight: 500; }
        .student-email { font-size: 11px; color: var(--text-3); }
        .score-cell { display: flex; align-items: center; gap: 8px; }
        .score-num { font-size: 14px; font-weight: 600; color: var(--text); }
        .grade-pill {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
          background: var(--bg-3);
          color: var(--accent-2);
        }
        .feedback-row td { padding: 0; border-bottom: 1px solid var(--border); }
        .feedback-box {
          padding: 16px 20px;
          background: var(--bg-2);
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-2);
          border-left: 3px solid var(--accent);
        }
        .feedback-box strong { color: var(--text); display: block; margin-bottom: 6px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 60px; color: var(--text-2); text-align: center; }
      `}</style>
    </div>
  );
}

function ScoreBar({ score, maxScore }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{ width: 60, height: 5, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function StatPill({ icon, label, value, small }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: small ? '6px 12px' : '10px 16px',
      background: 'var(--bg-1)', border: '1px solid var(--border)',
      borderRadius: 99, fontSize: small ? 12 : 13,
    }}>
      {icon && <span style={{ color: 'var(--accent-2)' }}>{icon}</span>}
      <span style={{ color: 'var(--text-3)' }}>{label}:</span>
      <span style={{ fontWeight: 600, fontFamily: 'DM Mono' }}>{value}</span>
    </div>
  );
}