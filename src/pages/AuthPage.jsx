import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, BarChart3, Lock } from 'lucide-react';
import { login, signup, googleAuthUrl } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: Sparkles, label: 'Rubric-aware grading',    color: '#34d399' },
  { icon: Zap,      label: 'Background job queue',    color: '#2dd4bf' },
  { icon: BarChart3,label: 'Live progress dashboard', color: '#34d399' },
  { icon: Lock,     label: 'Google Classroom OAuth',  color: '#2dd4bf' },
];

export default function AuthPage() {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    if (tab === 'create' && !fullName) return toast.error('Full name is required');
    setLoading(true);
    try {
      const data = await (tab === 'signin' ? login : signup)(email, fullName);
      loginSuccess(data.authToken, data.user);
      toast.success(tab === 'signin' ? 'Welcome back!' : 'Account created!');
      nav('/dashboard');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:'#020817',color:'#f1f5f9',overflow:'hidden',position:'relative'}}>
      {/* Background */}
      <div style={{position:'fixed',inset:0,background:'linear-gradient(to bottom, #020817, #0f172a, #020817)',pointerEvents:'none'}}/>
      <motion.div
        style={{position:'fixed',top:'-50%',left:'-50%',width:'100%',height:'100%',background:'radial-gradient(circle,rgba(16,185,129,0.05) 0%,transparent 70%)',borderRadius:'50%',filter:'blur(60px)',pointerEvents:'none'}}
        animate={{x:[0,50,0],y:[0,30,0],scale:[1,1.05,1]}}
        transition={{duration:25,repeat:Infinity,ease:'easeInOut'}}
      />

      <div style={{position:'relative',zIndex:1}}>
        {/* Header */}
        <motion.header
          style={{padding:'24px 48px',display:'flex',alignItems:'center',gap:12}}
          initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.6}}
        >
          <div style={{width:40,height:40,borderRadius:12,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Check size={22} color="#34d399" strokeWidth={3}/>
          </div>
          <span style={{fontSize:20,fontWeight:600,letterSpacing:'-0.02em'}}>
            AutoGrade<span style={{color:'#475569',fontWeight:400}}>.ai</span>
          </span>
        </motion.header>

        {/* Grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,padding:'48px 48px',maxWidth:1280,margin:'0 auto',alignItems:'center',minHeight:'calc(100vh - 88px)'}}>

          {/* Left — Hero */}
          <motion.div
            style={{display:'flex',flexDirection:'column',gap:32}}
            initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{duration:0.8,delay:0.2}}
          >
            <div>
              <motion.h1
                style={{fontSize:'clamp(40px,5vw,72px)',fontWeight:600,letterSpacing:'-0.03em',lineHeight:1.1,marginBottom:20}}
                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.3}}
              >
                <span style={{display:'block',background:'linear-gradient(to right,#fff,#fff,#cbd5e1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                  AI-powered grading
                </span>
                <span style={{display:'block',background:'linear-gradient(to right,#fff,#fff,#cbd5e1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                  for Google Classroom
                </span>
              </motion.h1>
              <motion.p
                style={{color:'#64748b',fontSize:17,lineHeight:1.7,maxWidth:440}}
                initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8,delay:0.5}}
              >
                Grade entire coursework submissions in minutes with Gemini AI.
                Smart rubric matching, auto feedback, instant results.
              </motion.p>
            </div>

            <motion.div
              style={{display:'flex',flexDirection:'column',gap:16}}
              initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8,delay:0.7}}
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  style={{display:'flex',alignItems:'center',gap:12}}
                  initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}}
                  transition={{duration:0.5,delay:0.8 + i*0.1}}
                >
                  <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <f.icon size={16} color={f.color}/>
                  </div>
                  <span style={{color:'#94a3b8',fontSize:14}}>{f.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Auth card */}
          <motion.div
            style={{width:'100%',maxWidth:440,marginLeft:'auto'}}
            initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} transition={{duration:0.8,delay:0.4}}
          >
            <div style={{background:'rgba(15,23,42,0.5)',backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:32,boxShadow:'0 25px 50px rgba(0,0,0,0.5)'}}>

              {/* Tabs */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:4,marginBottom:24}}>
                {[{id:'signin',label:'Sign in'},{id:'create',label:'Create account'}].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{padding:'8px 12px',borderRadius:7,border:'none',cursor:'pointer',fontSize:14,fontWeight:500,fontFamily:'Inter,sans-serif',transition:'all 0.15s',
                      background: tab===t.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                      color: tab===t.id ? '#f1f5f9' : '#64748b'}}
                  >{t.label}</button>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16,marginBottom:20}}>
                {tab === 'create' && (
                  <div className="fade-in">
                    <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:6}}>Full Name</label>
                    <input className="form-input" placeholder="Your full name" value={fullName} onChange={e=>setFullName(e.target.value)}/>
                  </div>
                )}
                <div>
                  <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:6}}>Email</label>
                  <input className="form-input" type="email" placeholder="teacher@school.edu" value={email} onChange={e=>setEmail(e.target.value)} style={{height:48}}/>
                </div>
                <button className="btn btn-emerald btn-lg" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center',height:48}}>
                  {loading ? <span className="spinner"/> : (tab==='signin' ? 'Sign in' : 'Create account')}
                </button>
              </form>

              {/* Divider */}
              <div style={{position:'relative',textAlign:'center',margin:'20px 0'}}>
                <div style={{position:'absolute',top:'50%',left:0,right:0,height:1,background:'rgba(255,255,255,0.07)'}}/>
                <span style={{position:'relative',background:'transparent',padding:'0 12px',fontSize:12,color:'#334155'}}>or continue with</span>
              </div>

              <a
                href={googleAuthUrl()}
                className="btn btn-outline btn-lg"
                style={{width:'100%',justifyContent:'center',height:48,marginBottom:16}}
              >
                <GoogleIcon/> Google Sign in
              </a>

              <p style={{fontSize:11,color:'#334155',textAlign:'center',lineHeight:1.6}}>
                By continuing, you grant read-only access to your Google Classroom courses and Drive files.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; padding: 24px 20px !important; }
          div[style*="marginLeft: auto"] { margin: 0 auto !important; }
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
