import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getUploadUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL.replace(/\/$/, '')}${cleanPath}`;
  }
  return cleanPath;
};

const api = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, '')}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common API calls
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const incomesAPI = {
  getAll: (params) => api.get('/incomes', { params }),
  getById: (id) => api.get(`/incomes/${id}`),
  create: (data) => api.post('/incomes', data),
  update: (id, data) => api.put(`/incomes/${id}`, data),
  delete: (id) => api.delete(`/incomes/${id}`),
  getSummary: (params) => api.get('/incomes/summary', { params }),
};

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getSummary: (params) => api.get('/expenses/summary', { params }),
};

export const ordersInAPI = {
  getAll: (params) => api.get('/orders-in', { params }),
  getById: (id) => api.get(`/orders-in/${id}`),
  create: (data) => api.post('/orders-in', data),
  update: (id, data) => api.put(`/orders-in/${id}`, data),
  delete: (id) => api.delete(`/orders-in/${id}`),
  getSummary: (params) => api.get('/orders-in/summary', { params }),
};

export const ordersOutAPI = {
  getAll: (params) => api.get('/orders-out', { params }),
  getById: (id) => api.get(`/orders-out/${id}`),
  create: (data) => api.post('/orders-out', data),
  update: (id, data) => api.put(`/orders-out/${id}`, data),
  delete: (id) => api.delete(`/orders-out/${id}`),
  getSummary: (params) => api.get('/orders-out/summary', { params }),
};

export const menusAPI = {
  getAll: (params) => api.get('/menus', { params }),
  getById: (id) => api.get(`/menus/${id}`),
  create: (data) => api.post('/menus', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/menus/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/menus/${id}`),
  getCategories: () => api.get('/menus/categories'),
};

export const ingredientsAPI = {
  getAll: (params) => api.get('/ingredients', { params }),
  getById: (id) => api.get(`/ingredients/${id}`),
  create: (data) => api.post('/ingredients', data),
  update: (id, data) => api.put(`/ingredients/${id}`, data),
  delete: (id) => api.delete(`/ingredients/${id}`),
  getSummary: () => api.get('/ingredients/summary'),
  getCategories: () => api.get('/ingredients/categories'),
};

export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/employees/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/employees/${id}`),
  getStats: () => api.get('/employees/stats'),
};

export const activitiesAPI = {
  getAll: (params) => api.get('/activities', { params }),
  getSummary: (params) => api.get('/activities/summary', { params }),
  getUserActivity: (userId, params) => api.get(`/activities/user/${userId}`, { params }),
};

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  exportFinance: (params) => api.get('/reports/export/finance', { params, responseType: 'blob' }),
  exportOrders: (params) => api.get('/reports/export/orders', { params, responseType: 'blob' }),
  exportIngredients: () => api.get('/reports/export/ingredients', { responseType: 'blob' }),
  exportEmployees: () => api.get('/reports/export/employees', { responseType: 'blob' }),
  generatePDF: (params) => api.get('/reports/pdf', { params, responseType: 'blob' }),
};

