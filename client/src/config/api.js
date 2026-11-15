// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  PROFILE: `${API_BASE_URL}/auth/profile`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  
  // Resource endpoints
  RESOURCES: `${API_BASE_URL}/resources`,
  RESOURCE_BY_ID: (id) => `${API_BASE_URL}/resources/${id}`,
  
  // Reservation endpoints
  RESERVATIONS: `${API_BASE_URL}/reservations`,
  MY_RESERVATIONS: `${API_BASE_URL}/reservations/my-reservations`,
  RESERVATION_BY_ID: (id) => `${API_BASE_URL}/reservations/${id}`,
  
  // User endpoints (admin only)
  USERS: `${API_BASE_URL}/auth/users`,
  USER_CREATE: `${API_BASE_URL}/auth/users`,
  USER_BY_ID: (id) => `${API_BASE_URL}/auth/users/${id}`,
  
  // Notification endpoints
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  NOTIFICATIONS_ALL: `${API_BASE_URL}/notifications/all`,
  NOTIFICATION_READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
  NOTIFICATION_READ_ALL: `${API_BASE_URL}/notifications/read-all`,
  NOTIFICATION_DELETE: (id) => `${API_BASE_URL}/notifications/${id}`,
  
  // Feedback endpoints
  FEEDBACK: `${API_BASE_URL}/feedback`,
  FEEDBACK_MY: `${API_BASE_URL}/feedback/my-feedback`,
  FEEDBACK_BY_ID: (id) => `${API_BASE_URL}/feedback/${id}`,
  FEEDBACK_ADMIN_ALL: `${API_BASE_URL}/feedback/admin/all`,
  FEEDBACK_ADMIN_RESPOND: (id) => `${API_BASE_URL}/feedback/admin/${id}/respond`,
  
  // Help endpoints
  HELP: `${API_BASE_URL}/help`,
  HELP_MY_REQUESTS: `${API_BASE_URL}/help/my-requests`,
  HELP_BY_ID: (id) => `${API_BASE_URL}/help/${id}`,
  HELP_ADMIN_ALL: `${API_BASE_URL}/help/admin/all`,
  HELP_ADMIN_RESPOND: (id) => `${API_BASE_URL}/help/admin/${id}/respond`,
  HELP_ADMIN_STATUS: (id) => `${API_BASE_URL}/help/admin/${id}/status`,
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Helper function to check if user is logged in
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Helper function to get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  try { return userStr ? JSON.parse(userStr) : null; } catch { return null; }
};

// Helper function to logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export default API_BASE_URL;

// I load long lists in smaller batches and return one combined list.
// I keep requests with a limit or offset as a single page.
export async function fetchList(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const target = new URL(url, window.location.origin);
  const fields = { '/resources': 'resources', '/reservations': 'reservations', '/auth/users': 'users', '/reservations/my-reservations': 'reservations' };
  const suffix = Object.keys(fields).find(key => target.pathname === new URL(API_BASE_URL, window.location.origin).pathname.replace(/\/$/,'') + key);
  if (method !== 'GET' || !suffix || target.searchParams.has('limit') || target.searchParams.has('offset')) return apiFetch(url, options);
  const field = fields[suffix];
  const items = [];
  let envelope;
  for (let offset = 0; ; offset += 200) {
    target.searchParams.set('limit', '200'); target.searchParams.set('offset', String(offset));
    const response = await apiFetch(target.toString(), options);
    if (!response.ok) return response;
    envelope = await response.json();
    const batch = envelope.data?.[field];
    if (!Array.isArray(batch)) throw new Error('Unexpected list response');
    items.push(...batch);
    if (batch.length < 200) break;
  }
  return new Response(JSON.stringify({ ...envelope, data: { ...envelope.data, [field]: items } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

let readRetryAt=0;
export function readRequestsPaused(){return Date.now()<readRetryAt;}
export async function apiFetch(url,options={}) {
  const read=['GET','HEAD'].includes((options.method||'GET').toUpperCase());
  if(read&&readRequestsPaused()) {
    const seconds=Math.max(1,Math.ceil((readRetryAt-Date.now())/1000));
    return new Response(JSON.stringify({success:false,message:'The server temporarily limited requests. Please try again in '+Math.ceil(seconds/60)+' minute(s).',retryAfter:seconds}),{status:429,headers:{'Content-Type':'application/json','Retry-After':String(seconds)}});
  }
  const response=await fetch(url,options);
  if(read&&response.status===429) {
    let data;try{data=await response.clone().json();}catch{/* Non-JSON proxy response. */}
    const seconds=Math.max(1,Number(response.headers.get('Retry-After'))||Number(data?.retryAfter)||60);
    readRetryAt=Date.now()+seconds*1000;
  }
  return response;
}
export async function apiResponseError(response,fallback='Unable to load this page. Please try again.') {
  let data;try{data=await response.json();}catch{/* Non-JSON proxy response. */}
  const error=new Error(data?.message||fallback);error.status=response.status;
  error.retryAfter=Math.max(1,Number(response.headers.get('Retry-After'))||Number(data?.retryAfter)||60);return error;
}
