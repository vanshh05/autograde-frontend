import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Sparkles, Clock, Upload, FileText, RefreshCw, ArrowRight } from 'lucide-react';
import { getCourses } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

const COURSE_GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#2563eb)',
  'linear-gradient(135deg,#0891b2,#0d9488)',
  'linear-gradient(135deg,#db2777,#7c3aed)',
  'linear-gradient(135deg,#059669,#0891b2)',
  'linear-gradient(135deg,#d97706,#dc2626)',
];

const STATUS_CARDS = [
  { icon: Clock,    title: 'Grading',       subtitle: 'Active Jobs',       iconColor: '#34d399' },
  { icon: Upload,   title: 'Upload File',   subtitle: 'Publish',           iconColor: '#2dd4bf' },
  { icon: FileText, title: 'Assignments',   subtitle: 'Total',             iconColor: '#34d399' },
  { icon: RefreshCw,title: 'After grading', subtitle: 'Sync to Classroom', iconColor: '#2dd4bf' },
];

const WORKFLOW = [
  { n:1, title:'Create Assignment', desc:"Upload a question paper file, link published to Google Classroom and register it for AI grading." },
  { n:2, title:'Students Submit',   desc:"Students submit their answers to the assignment in Google Classroom as usual." },
  { n:3, title:'AI Grades',         desc:"Set rubric and strictness. Gemini AI grades all submissions in a background queue." },
  { n:4, title:'Sync to Classroom', desc:"One click pushes assigned grades back to Google Classroom for all students." },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then(d => setCourses(d.courses || []))
      .catch(e => { if (!e.message.includes('401')) toast.error(e.message); })
      .finally(() => setLoading(false));
  }, []);

  const name = user?.fullName || user?.email?.split('@')[0] || 'Teacher';

  return (
    <div className="page-wrap">
      {/* Header */}
      <motion.div style={{marginBottom:32}} initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
          <div>
            <h1 className="page-title">{name}</h1>
            <p className="page-sub">Manage assignments, grade with AI, and sync grades to Classroom.</p>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="btn btn-outline" onClick={() => nav('/create')}>
              <PlusCircle size={16}/> Create Assignment
            </button>
            <button className="btn btn-emerald" onClick={() => nav('/courses')}>
              <Sparkles size={16}/> Grade Now
            </button>
          </div>
        </div>
      </motion.div>

      {/* Status Cards */}
      <motion.div
        style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:32}}
        initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.2}}
      >
        {STATUS_CARDS.map((card, i) => (
          <motion.div
            key={i}
            className="glass-card"
            style={{padding:'20px 24px'}}
            initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.5,delay:0.3+i*0.1}}
            whileHover={{scale:1.02}}
          >
            <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
              <card.icon size={22} color={card.iconColor}/>
            </div>
            <div style={{fontSize:18,fontWeight:500,marginBottom:4}}>{card.title}</div>
            <div style={{fontSize:12,color:'#64748b'}}>{card.subtitle}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Workflow */}
      <motion.div
        style={{marginBottom:32}}
        initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.4}}
      >
        <h2 style={{fontSize:22,fontWeight:500,marginBottom:20}}>Workflow</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
          {WORKFLOW.map((step, i) => (
            <motion.div
              key={step.n}
              className="glass-card"
              style={{padding:24}}
              initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.5+i*0.1}}
              whileHover={{scale:1.02}}
            >
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{width:32,height:32,borderRadius:8,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#34d399',fontWeight:600,flexShrink:0}}>
                  {step.n}
                </div>
                <span style={{fontSize:15,fontWeight:500}}>{step.title}</span>
              </div>
              <p style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Courses */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.6}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 style={{fontSize:22,fontWeight:500}}>Your Courses</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/courses')} style={{display:'flex',alignItems:'center',gap:6}}>
            View all <ArrowRight size={14}/>
          </button>
        </div>

        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{height:140}}/>)}
          </div>
        ) : courses.length === 0 ? (
          <div className="glass-card" style={{padding:48,textAlign:'center',color:'#475569'}}>
            <p style={{marginBottom:4}}>No active courses found.</p>
            <p style={{fontSize:12,color:'#334155'}}>Sign in with a Google teacher account to see your courses.</p>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
            {courses.slice(0,6).map((course, i) => (
              <motion.div
                key={course.id}
                className="glass-card emerald"
                style={{padding:24,cursor:'pointer'}}
                onClick={() => nav(`/courses/${course.id}`)}
                initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.5,delay:0.7+i*0.1}}
                whileHover={{scale:1.02}}
              >
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <div style={{width:44,height:44,borderRadius:12,background:COURSE_GRADIENTS[i%COURSE_GRADIENTS.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:600}}>
                    {(course.name||'C')[0].toUpperCase()}
                  </div>
                  <span className="badge badge-emerald">Active</span>
                </div>
                <div style={{fontSize:16,fontWeight:500,marginBottom:6,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{course.name}</div>
                <div style={{fontSize:12,color:'#475569',fontFamily:'monospace',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{course.id}</div>
                <button style={{marginTop:16,fontSize:13,color:'#34d399',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:0}}>
                  View details <ArrowRight size={13}/>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <style>{`@media(max-width:900px){
        div[style*="gridTemplateColumns: repeat(4,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
      }`}</style>
    </div>
  );
}
