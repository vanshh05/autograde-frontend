const BASE = import.meta.env.VITE_BACKEND_URL || 'https://autograde-ai-9zve.onrender.com';

function getToken() {
  return localStorage.getItem('authToken');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body instanceof FormData) delete headers['Content-Type'];

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login = (email, fullName) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, fullName }) });

export const signup = (email, fullName) =>
  request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, fullName }) });

export const googleAuthUrl  = () => `${BASE}/api/auth/google`;
export const googleSignupUrl = () => `${BASE}/api/auth/google/signup`;

// ── User ──────────────────────────────────────────────────────────────────────
export const getUser = () => request('/api/user');

// ── Classroom ─────────────────────────────────────────────────────────────────
export const getCourses = (pageSize = 50) =>
  request(`/api/classroom/courses?pageSize=${pageSize}`);

export const getCourseWork = (courseId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/api/classroom/coursework/${courseId}${q ? '?' + q : ''}`);
};

export const startGrading = (courseId, courseWorkId, formData) =>
  request(`/api/classroom/coursework/${courseId}/${courseWorkId}/submissions`, {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${getToken()}` },
  });

export const getJobStatus = (courseId, courseWorkId, jobId) =>
  request(`/api/classroom/coursework/${courseId}/${courseWorkId}/submissions/jobs/${jobId}`);

export const getDashboard = (courseId, courseWorkId) =>
  request(`/api/classroom/dashboard/${courseId}/${courseWorkId}`);

// NEW: Push AI grades back to Google Classroom
export const syncMarksToClassroom = (courseId, courseWorkId) =>
  request(`/api/classroom/coursework/${courseId}/${courseWorkId}/submissions/marks`, {
    method: 'PATCH',
  });
