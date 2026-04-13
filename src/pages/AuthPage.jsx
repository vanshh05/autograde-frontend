import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="auth-page">
      <div className="auth-bg-base" />
      <div className="auth-blob-1" />

      <div className="auth-inner">
        {/* Header */}
        <header className="auth-header fade-up">
          <div className="auth-logo-icon"><Check size={22} color="#34d399" strokeWidth={3}/></div>
          <span className="auth-logo-text">AutoGrade<span style={{color:'#475569',fontWeight:400}}>.ai</span></span>
        </header>

        {/* Grid */}
        <div className="auth-grid">
          {/* Left */}
          <div className="auth-left fade-up">
            <h1 className="auth-h1">
              <span>AI-powered grading</span>
              <span>for Google Classroom</span>
            </h1>
            <p className="auth-tagline">
              Grade entire coursework submissions in minutes with Gemini AI.
              Smart rubric matching, auto feedback, instant results.
            </p>
            <div className="auth-features">
              {FEATURES.map((f) => (
                <div key={f.label} className="auth-feat">
                  <div className="auth-feat-icon">
                    <f.icon size={16} color={f.color}/>
                  </div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — card */}
          <div className="auth-right fade-up" style={{animationDelay:'0.1s'}}>
            <div className="auth-card">
              {/* Tabs */}
              <div className="auth-tabs">
                {[{id:'signin',label:'Sign in'},{id:'create',label:'Create account'}].map(t => (
                  <button key={t.id} className={`auth-tab ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {tab === 'create' && (
                  <div className="input-group fade-in">
                    <label className="form-label" style={{textTransform:'none',fontSize:13,fontWeight:400,color:'#64748b'}}>Full Name</label>
                    <input className="form-input" style={{height:48}} placeholder="Your full name" value={fullName} onChange={e=>setFullName(e.target.value)}/>
                  </div>
                )}
                <div className="input-group">
                  <label className="form-label" style={{textTransform:'none',fontSize:13,fontWeight:400,color:'#64748b'}}>Email</label>
                  <input className="form-input" style={{height:48}} type="email" placeholder="teacher@school.edu" value={email} onChange={e=>setEmail(e.target.value)}/>
                </div>
                <button className="btn btn-emerald btn-lg" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center',height:48}}>
                  {loading ? <span className="spinner"/> : (tab==='signin' ? 'Sign in' : 'Create account')}
                </button>
              </form>

              <div className="auth-divider"><span>or continue with</span></div>

              <a href={googleAuthUrl()} className="btn btn-outline btn-lg" style={{width:'100%',justifyContent:'center',height:48,marginBottom:16}}>
                <GoogleIcon/> Google Sign in
              </a>

              <p style={{fontSize:11,color:'#334155',textAlign:'center',lineHeight:1.6}}>
                By continuing, you grant read-only access to your Google Classroom courses and Drive files.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page { min-height:100vh; background:#020817; color:#f1f5f9; position:relative; overflow:hidden; }
        .auth-bg-base { position:fixed; inset:0; background:linear-gradient(to bottom,#020817,#0f172a,#020817); pointer-events:none; }
        .auth-blob-1 { position:fixed; top:-50%; left:-50%; width:100%; height:100%; background:radial-gradient(circle,rgba(16,185,129,0.05) 0%,transparent 70%); border-radius:50%; filter:blur(60px); pointer-events:none; animation:float1 25s ease-in-out infinite; }
        .auth-inner { position:relative; z-index:1; }
        .auth-header { display:flex; align-items:center; gap:12px; padding:24px 48px; }
        .auth-logo-icon { width:40px; height:40px; border-radius:12px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); display:flex; align-items:center; justify-content:center; }
        .auth-logo-text { font-size:20px; font-weight:600; letter-spacing:-0.02em; }
        .auth-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; padding:24px 48px 48px; max-width:1280px; margin:0 auto; align-items:center; min-height:calc(100vh - 88px); }
        .auth-left { display:flex; flex-direction:column; gap:32px; }
        .auth-h1 { font-size:clamp(36px,5vw,68px); font-weight:600; letter-spacing:-0.03em; line-height:1.1; display:flex; flex-direction:column; gap:4px; }
        .auth-h1 span { background:linear-gradient(to right,#fff,#fff,#cbd5e1); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .auth-tagline { color:#64748b; font-size:16px; line-height:1.7; max-width:440px; }
        .auth-features { display:flex; flex-direction:column; gap:16px; }
        .auth-feat { display:flex; align-items:center; gap:12px; }
        .auth-feat-icon { width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; justify-content:center; }
        .auth-feat span { color:#94a3b8; font-size:14px; }
        .auth-right { display:flex; justify-content:center; }
        .auth-card { width:100%; max-width:440px; background:rgba(15,23,42,0.5); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:32px; box-shadow:0 25px 50px rgba(0,0,0,0.5); }
        .auth-tabs { display:grid; grid-template-columns:1fr 1fr; gap:4px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:4px; margin-bottom:24px; }
        .auth-tab { padding:8px 12px; border-radius:7px; border:none; cursor:pointer; font-size:14px; font-weight:500; font-family:'Inter',sans-serif; transition:all 0.15s; background:transparent; color:#64748b; }
        .auth-tab.active { background:rgba(255,255,255,0.07); color:#f1f5f9; }
        .auth-form { display:flex; flex-direction:column; gap:16px; margin-bottom:20px; }
        .auth-divider { position:relative; text-align:center; margin:20px 0; }
        .auth-divider::before { content:''; position:absolute; top:50%; left:0; right:0; height:1px; background:rgba(255,255,255,0.07); }
        .auth-divider span { position:relative; background:rgba(15,23,42,0.9); padding:0 12px; font-size:12px; color:#334155; }
        @media(max-width:768px) { .auth-grid { grid-template-columns:1fr; padding:20px; } .auth-left { display:none; } .auth-header { padding:20px; } }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{marginRight:4}}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
