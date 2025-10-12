// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  PROFILE: `${API_BASE_URL}/auth/profile`,
  
  // Resource endpoints
  RESOURCES: `${API_BASE_URL}/resources`,
  RESOURCE_BY_ID: (id) => `${API_BASE_URL}/resources/${id}`,
  
  // Reservation endpoints
  RESERVATIONS: `${API_BASE_URL}/reservations`,
  MY_RESERVATIONS: `${API_BASE_URL}/reservations/my-reservations`,
  RESERVATION_BY_ID: (id) => `${API_BASE_URL}/reservations/${id}`,
  
  // User endpoints (admin only)
  USERS: `${API_BASE_URL}/auth/users`,
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
  return userStr ? JSON.parse(userStr) : null;
};

// Helper function to logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export default API_BASE_URL;
