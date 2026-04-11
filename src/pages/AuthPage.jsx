import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, googleAuthUrl } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    if (mode === 'signup' && !fullName) return toast.error('Full name is required');
    setLoading(true);
    try {
      const data = await (mode === 'login' ? login : signup)(email, fullName);
      loginSuccess(data.authToken, data.user);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      nav('/dashboard');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-bg">
        <div className="orb orb-1"/><div className="orb orb-2"/><div className="grid-bg"/>
      </div>
      <div className="auth-left fade-up">
        <div className="brand"><span className="brand-icon">⚡</span><span className="brand-name">AutoGrade<span style={{color:'var(--accent-2)'}}>.</span>ai</span></div>
        <h1 className="auth-h1">AI grading for<br/>Google Classroom</h1>
        <p className="auth-p">Create assignments, grade submissions with Gemini AI, and sync scores back to Classroom — all in one place.</p>
        <div className="features">
          {['Create assignments from our platform','Gemini AI grades all submissions','Background job queue — no waiting','Two-column view: yours vs. imported','One-click sync grades to Classroom'].map(f=>(
            <div key={f} className="feat"><span className="feat-dot">✦</span><span>{f}</span></div>
          ))}
        </div>
      </div>
      <div className="auth-right fade-up" style={{animationDelay:'0.1s'}}>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`atab ${mode==='login'?'active':''}`} onClick={()=>setMode('login')}>Sign in</button>
            <button className={`atab ${mode==='signup'?'active':''}`} onClick={()=>setMode('signup')}>Sign up</button>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            {mode==='signup' && (
              <div className="input-group fade-in">
                <label className="label">Full Name</label>
                <input className="input" placeholder="Your full name" value={fullName} onChange={e=>setFullName(e.target.value)}/>
              </div>
            )}
            <div className="input-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="teacher@school.edu" value={email} onChange={e=>setEmail(e.target.value)}/>
            </div>
            <button className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
              {loading?<span className="spinner"/>:(mode==='login'?'Sign in':'Create account')}
            </button>
          </form>
          <div className="or-div"><span>or</span></div>
          <a href={googleAuthUrl()} className="btn btn-secondary btn-lg" style={{width:'100%',justifyContent:'center'}}>
            <GoogleIcon/> Continue with Google
          </a>
          <p className="auth-note">Google login grants read-only Classroom + Drive access for grading.</p>
        </div>
      </div>
      <style>{`
        .auth-shell{min-height:100vh;display:flex;position:relative;overflow:hidden;}
        .auth-bg{position:fixed;inset:0;pointer-events:none;z-index:0;}
        .orb{position:absolute;border-radius:50%;filter:blur(80px);}
        .orb-1{width:520px;height:520px;background:radial-gradient(circle,rgba(124,106,247,0.15) 0%,transparent 70%);top:-150px;left:-100px;}
        .orb-2{width:380px;height:380px;background:radial-gradient(circle,rgba(45,212,191,0.07) 0%,transparent 70%);bottom:-80px;right:380px;}
        .grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px);background-size:60px 60px;}
        .auth-left{flex:1;display:flex;flex-direction:column;justify-content:center;padding:64px;position:relative;z-index:1;}
        .brand{display:flex;align-items:center;gap:10px;margin-bottom:48px;}
        .brand-icon{font-size:20px;background:var(--accent);width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;}
        .brand-name{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;}
        .auth-h1{font-size:clamp(32px,4vw,50px);font-weight:800;margin-bottom:16px;line-height:1.12;}
        .auth-p{color:var(--text-2);font-size:15px;max-width:380px;line-height:1.7;margin-bottom:44px;}
        .features{display:flex;flex-direction:column;gap:11px;}
        .feat{display:flex;align-items:center;gap:11px;color:var(--text-2);font-size:13px;}
        .feat-dot{color:var(--accent-2);font-size:9px;}
        .auth-right{width:460px;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:40px;position:relative;z-index:1;border-left:1px solid var(--border);background:rgba(10,10,15,0.7);backdrop-filter:blur(24px);}
        .auth-card{width:100%;max-width:360px;}
        .auth-tabs{display:flex;gap:3px;background:var(--bg-2);border-radius:var(--radius-sm);padding:3px;margin-bottom:26px;}
        .atab{flex:1;padding:8px;border:none;border-radius:calc(var(--radius-sm) - 1px);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;background:transparent;color:var(--text-3);transition:all 0.15s;}
        .atab.active{background:var(--bg-3);color:var(--text);}
        .auth-form{display:flex;flex-direction:column;gap:13px;margin-bottom:18px;}
        .or-div{position:relative;text-align:center;margin:18px 0;}
        .or-div::before{content:'';position:absolute;top:50%;left:0;right:0;height:1px;background:var(--border);}
        .or-div span{position:relative;background:var(--bg);padding:0 12px;font-size:12px;color:var(--text-3);}
        .auth-note{font-size:11px;color:var(--text-3);text-align:center;margin-top:16px;line-height:1.6;}
        @media(max-width:768px){.auth-left{display:none;}.auth-right{width:100%;border-left:none;}}
      `}</style>
    </div>
  );
}

function GoogleIcon(){return(<svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>);}
