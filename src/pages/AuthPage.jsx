import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, googleAuthUrl, googleSignupUrl } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // login | signup
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
      const fn = mode === 'login' ? login : signup;
      const data = await fn(email, fullName);
      loginSuccess(data.authToken, data.user);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      nav('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-grid" />
      </div>

      <div className="auth-left fade-up">
        <div className="auth-brand">
          <span className="auth-logo-icon">⚡</span>
          <span className="auth-logo-text">AutoGrade<span style={{color:'var(--accent-2)'}}>.ai</span></span>
        </div>

        <div className="auth-headline">
          <h1>AI-powered grading<br />for Google Classroom</h1>
          <p>Grade entire coursework submissions in minutes with Gemini AI. Smart rubric matching, auto feedback, instant results.</p>
        </div>

        <div className="auth-features">
          {[
            { icon: '🎯', label: 'Rubric-aware grading' },
            { icon: '⚡', label: 'Background job queue' },
            { icon: '📊', label: 'Live progress dashboard' },
            { icon: '🔒', label: 'Google Classroom OAuth' },
          ].map(f => (
            <div className="auth-feature" key={f.label}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign in</button>
            <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Create account</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="input-group" style={{ animationDelay: '0.05s' }}>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
            )}
            <div className="input-group">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>

          <div className="auth-google-btns">
            <a href={googleAuthUrl()} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              <GoogleIcon />
              Google {mode === 'login' ? 'Sign in' : 'Sign up'}
            </a>
          </div>

          <p className="auth-note">
            By continuing, you grant read-only access to your Google Classroom courses and Drive files.
          </p>
        </div>
      </div>

      <style>{`
        .auth-shell {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          position: relative;
          overflow: hidden;
        }
        .auth-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }
        .auth-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(124,106,247,0.15) 0%, transparent 70%);
          top: -100px; left: -100px;
        }
        .auth-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%);
          bottom: -50px; right: 300px;
        }
        .auth-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .auth-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          position: relative;
          z-index: 1;
        }
        .auth-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 60px;
        }
        .auth-logo-icon {
          font-size: 28px;
          background: var(--accent);
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px;
        }
        .auth-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
        }
        .auth-headline h1 {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 800;
          margin-bottom: 16px;
          line-height: 1.15;
        }
        .auth-headline p {
          color: var(--text-2);
          font-size: 16px;
          max-width: 400px;
          line-height: 1.7;
          margin-bottom: 48px;
        }
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .auth-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-2);
          font-size: 14px;
        }
        .auth-right {
          width: 460px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
          z-index: 1;
          border-left: 1px solid var(--border);
          background: rgba(10,10,15,0.6);
          backdrop-filter: blur(20px);
        }
        .auth-card {
          width: 100%;
          max-width: 380px;
        }
        .auth-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-2);
          border-radius: var(--radius-sm);
          padding: 4px;
          margin-bottom: 32px;
        }
        .auth-tab {
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: calc(var(--radius-sm) - 2px);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background: transparent;
          color: var(--text-2);
          transition: all 0.18s;
        }
        .auth-tab.active {
          background: var(--bg-3);
          color: var(--text);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .auth-divider {
          position: relative;
          text-align: center;
          margin: 24px 0;
        }
        .auth-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--border);
        }
        .auth-divider span {
          position: relative;
          background: var(--bg);
          padding: 0 12px;
          font-size: 12px;
          color: var(--text-3);
        }
        .auth-google-btns {
          display: flex;
          gap: 10px;
        }
        .auth-note {
          font-size: 12px;
          color: var(--text-3);
          text-align: center;
          margin-top: 20px;
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .auth-left { display: none; }
          .auth-right { width: 100%; border-left: none; }
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
