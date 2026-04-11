import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import GradesIndexPage from './pages/GradesIndexPage';
import GradePage from './pages/GradePage';
import './index.css';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:14}}>
      <div className="spinner spinner-lg"/>
      <p style={{color:'var(--text-3)',fontSize:13}}>Loading…</p>
    </div>
  );
  if (!user) return <Navigate to="/" replace/>;
  return <Layout>{children}</Layout>;
}

function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace/>;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                              element={<Public><AuthPage/></Public>}/>
      <Route path="/dashboard"                     element={<Protected><DashboardPage/></Protected>}/>
      <Route path="/courses"                       element={<Protected><CoursesPage/></Protected>}/>
      <Route path="/courses/:courseId"             element={<Protected><CourseDetailPage/></Protected>}/>
      <Route path="/grades"                        element={<Protected><GradesIndexPage/></Protected>}/>
      <Route path="/grades/:courseId/:courseWorkId" element={<Protected><GradePage/></Protected>}/>
      <Route path="*"                              element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes/>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background:'var(--bg-2)', color:'var(--text)',
              border:'1px solid var(--border)',
              fontFamily:'DM Sans,sans-serif', fontSize:'13px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
