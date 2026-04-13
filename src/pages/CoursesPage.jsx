import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, RefreshCw, PlusCircle, BookOpen, ArrowRight } from 'lucide-react';
import { getCourses } from '../api';
import toast from 'react-hot-toast';

const COURSE_GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#2563eb)',
  'linear-gradient(135deg,#0891b2,#2563eb)',
  'linear-gradient(135deg,#7c3aed,#db2777)',
  'linear-gradient(135deg,#059669,#0891b2)',
  'linear-gradient(135deg,#d97706,#dc2626)',
];

export default function CoursesPage() {
  const nav = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCourses = () => {
    setLoading(true);
    getCourses()
      .then(d => setCourses(d.courses || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchCourses(); }, []);

  const filtered = courses.filter(c =>
    (c.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (c.id||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrap">
      {/* Header */}
      <motion.div style={{marginBottom:32}} initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
        <p className="page-eyebrow">Google Classroom</p>
        <h1 className="page-title">Courses</h1>
        <p className="page-sub" style={{marginBottom:24}}>Select a course to view and grade assignments.</p>

        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
          {/* Search */}
          <div style={{position:'relative',flex:1,maxWidth:400}}>
            <Search size={15} color="#475569" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
            <input
              className="form-input"
              style={{paddingLeft:38,height:44}}
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={() => nav('/create')}>
            <PlusCircle size={15}/> New Assignment
          </button>
          <button className="btn btn-outline btn-icon" onClick={fetchCourses} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin-anim' : ''}/>
          </button>
        </div>
      </motion.div>

      {/* List */}
      <motion.div
        style={{display:'flex',flexDirection:'column',gap:12,maxWidth:860}}
        initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.2}}
      >
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="skeleton" style={{height:80}}/>)
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{padding:48,textAlign:'center'}}>
            <BookOpen size={44} color="#334155" style={{margin:'0 auto 16px'}}/>
            <p style={{color:'#64748b'}}>{search ? `No courses match "${search}"` : 'No active courses found.'}</p>
          </div>
        ) : (
          filtered.map((course, i) => (
            <motion.div
              key={course.id}
              className="glass-card emerald"
              style={{padding:'20px 24px',cursor:'pointer'}}
              onClick={() => nav(`/courses/${course.id}`)}
              initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{duration:0.5,delay:0.3+i*0.08}}
              whileHover={{scale:1.01}}
            >
              <div style={{display:'flex',alignItems:'center',gap:16}}>
                <div style={{width:52,height:52,borderRadius:14,background:COURSE_GRADIENTS[i%COURSE_GRADIENTS.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:600,flexShrink:0}}>
                  {(course.name||'C')[0].toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:500,marginBottom:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{course.name}</div>
                  <div style={{fontSize:12,color:'#475569',fontFamily:'monospace'}}>{course.id}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
                  <span className="badge badge-emerald">Active</span>
                  <ArrowRight size={18} color="#334155" style={{transition:'all 0.2s'}}/>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
