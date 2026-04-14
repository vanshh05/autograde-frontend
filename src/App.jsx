import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CreateAssignmentPage from './pages/CreateAssignmentPage';
import GradesIndexPage from './pages/GradesIndexPage';
import GradePage from './pages/GradePage';
import PaymentPage from './pages/PaymentPage';
import './index.css';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:14,background:'#020817'}}>
      <div className="spinner spinner-lg"/>
      <p style={{color:'#334155',fontSize:13}}>Loading…</p>
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
      <Route path="/"                               element={<Public><AuthPage/></Public>}/>
      <Route path="/dashboard"                      element={<Protected><DashboardPage/></Protected>}/>
      <Route path="/courses"                        element={<Protected><CoursesPage/></Protected>}/>
      <Route path="/courses/:courseId"              element={<Protected><CourseDetailPage/></Protected>}/>
      <Route path="/create"                         element={<Protected><CreateAssignmentPage/></Protected>}/>
      <Route path="/grades"                         element={<Protected><GradesIndexPage/></Protected>}/>
      <Route path="/grades/:courseId/:courseWorkId" element={<Protected><GradePage/></Protected>}/>
      <Route path="/credits"                         element={<Protected><PaymentPage/></Protected>}/>
      <Route path="*"                               element={<Navigate to="/" replace/>}/>
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
            style:{
              background:'rgba(15,23,42,0.95)', color:'#f1f5f9',
              border:'1px solid rgba(255,255,255,0.08)',
              fontFamily:'Inter,sans-serif', fontSize:'13px',
              backdropFilter:'blur(12px)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
