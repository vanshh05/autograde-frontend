const BASE = import.meta.env.VITE_BACKEND_URL || 'https://autograde-ai-9zve.onrender.com';

function getToken() { return localStorage.getItem('authToken'); }

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Auth
export const googleAuthUrl   = () => `${BASE}/api/auth/google`;

// User
export const getUser          = () => request('/api/user');
export const getWalletBalance = () => request('/api/user/wallet/balance');

// Courses
export const getCourses = (pageSize = 50) => request(`/api/classroom/courses?pageSize=${pageSize}`);

// Coursework
export const getCreatedCourseWork    = (courseId) => request(`/api/classroom/coursework/created/${courseId}`);
export const getNotCreatedCourseWork = (courseId) => request(`/api/classroom/coursework/notCreated/${courseId}`);

// Create new assignment
export const createCoursework = (courseId, formData) =>
  request(`/api/classroom/createCoursework/${courseId}`, { method:'POST', body:formData });

// Grading
export const startGrading = (courseId, courseWorkId, formData) =>
  request(`/api/classroom/coursework/${courseId}/${courseWorkId}/submissions`, { method:'POST', body:formData });

export const getJobStatus = (courseId, courseWorkId, jobId) =>
  request(`/api/classroom/coursework/${courseId}/${courseWorkId}/submissions/jobs/${jobId}`);

export const getDashboard = (courseId, courseWorkId) =>
  request(`/api/classroom/dashboard/${courseId}/${courseWorkId}`);

// Sync marks
export const syncMarksToClassroom = (courseId, courseWorkId) =>
  request(`/api/classroom/coursework/${courseId}/${courseWorkId}/submissions/marks`, { method:'PATCH' });

// Payment
export const createRazorpayOrder = (rechargeAmountInr, idempotencyKey) =>
  request('/api/payments/razorpay/order', {
    method: 'POST',
    body: JSON.stringify({ rechargeAmountInr }),
    headers: idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {},
  });

// Verify payment + credit wallet — call after Razorpay handler fires
// Returns: { message, orderId, paymentId, status, amountInr, walletBalanceInr }
export const verifyRazorpayPayment = (razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
  request('/api/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });
