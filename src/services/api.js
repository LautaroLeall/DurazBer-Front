import axios from 'axios';

// Normalizar URL base para garantizar que siempre termine en /api
const getApiBaseUrl = () => {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE = getApiBaseUrl();

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000
});

// Interceptor para inyectar token JWT automáticamente
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('durazber_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor para limpiar sesión si expira el token
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('durazber_token');
      localStorage.removeItem('durazber_user');
      window.dispatchEvent(new Event('durazber_auth_expired'));
    }
    return Promise.reject(error);
  }
);

export const api = {
  // --- SALUD / COLD-START ---
  checkHealth: async () => {
    try {
      const res = await client.get('/health', { timeout: 3500 });
      return { awake: true, database: res.data?.database || 'connected' };
    } catch {
      return { awake: false, database: 'offline_or_sleeping' };
    }
  },

  // --- AUTENTICACIÓN REAL ---
  login: async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('durazber_token', res.data.token);
      localStorage.setItem('durazber_user', JSON.stringify(res.data));
    }
    return res.data;
  },

  logout: async () => {
    try {
      await client.post('/auth/logout');
    } catch { }
    localStorage.removeItem('durazber_token');
    localStorage.removeItem('durazber_user');
  },

  getProfile: async () => {
    const res = await client.get('/auth/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await client.put('/auth/profile', data);
    if (res.data) {
      const current = JSON.parse(localStorage.getItem('durazber_user') || '{}');
      localStorage.setItem('durazber_user', JSON.stringify({ ...current, ...res.data }));
    }
    return res.data;
  },

  // --- RESUMEN REAL DEL DÍA ---
  getTodaySummary: async () => {
    const res = await client.get('/peaches/today');
    return res.data;
  },

  // --- SUMAR DURAZNOS REALES (+1, +2) ---
  quickIncrement: async (amount = 1) => {
    const res = await client.post('/peaches/increment', { amount });
    return res.data;
  },

  // --- RESTAR DURAZNO REAL (-1) ---
  quickDecrement: async () => {
    const res = await client.post('/peaches/decrement');
    return res.data;
  },

  // --- HISTORIAL REAL ---
  getHistoryLogs: async (date) => {
    const res = await client.get('/peaches/history', { params: { date } });
    return res.data;
  },

  deleteLog: async (id) => {
    const res = await client.delete(`/peaches/${id}`);
    return res.data;
  },

  // --- ESTADÍSTICAS REALES ---
  getWeeklyStats: async () => {
    const res = await client.get('/analytics/weekly');
    return res.data;
  },

  getThreeMonthComparative: async () => {
    const res = await client.get('/analytics/comparative');
    return res.data;
  },

  runManualPrune: async () => {
    const res = await client.post('/analytics/cleanup');
    return res.data;
  }
};
