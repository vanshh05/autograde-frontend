const BASE = import.meta.env.VITE_BACKEND_URL || 'https://autograde-ai-9zve.onrender.com';

function getToken() { return localStorage.getItem('authToken'); }

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  // Only set Content-Type for requests that actually send a JSON body
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Always attach auth token
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// Auth
export const login  = (email, fullName) => request('/api/auth/login',  { method: 'POST', body: JSON.stringify({ email, fullName }) });
export const signup = (email, fullName) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, fullName }) });
export const googleAuthUrl   = () => `${BASE}/api/auth/google`;
export const googleSignupUrl = () => `${BASE}/api/auth/google/signup`;

// User
export const getUser = () => request('/api/user');

// Courses
export const getCourses = (pageSize = 50) => request(`/api/classroom/courses?pageSize=${pageSize}`);

// Coursework
export const getCreatedCourseWork    = (courseId) => request(`/api/classroom/coursework/created/${courseId}`);
export const getNotCreatedCourseWork = (courseId) => request(`/api/classroom/coursework/notCreated/${courseId}`);

// Create new assignment
export const createCoursework = (courseId, formData) =>
  request(`/api/classroom/createCoursework/${courseId}`, {
    method: 'POST',
    body: formData, // FormData — Content-Type is NOT set, browser adds multipart boundary automatically
  });

// Grading
export const startGrading = (courseId, courseWorkId, formData) =>
  request(`/api/classroom/coursework/${courseId}/${courseWorkId}/submissions`, {
    method: 'POST',
    body: formData,
  });

export const getJobStatus = (courseId, courseWorkId, jobId) =>
  request(`/api/classroom/coursework/${courseId}/${courseWorkId}/submissions/jobs/${jobId}`);

export const getDashboard = (courseId, courseWorkId) =>
  request(`/api/classroom/dashboard/${courseId}/${courseWorkId}`);

// Sync marks — PATCH with no body, no Content-Type header
export const syncMarksToClassroom = (courseId, courseWorkId) =>
  request(`/api/classroom/coursework/${courseId}/${courseWorkId}/submissions/marks`, {
    method: 'PATCH',
    // No body, no Content-Type — backend reads only path params and JWT
  });