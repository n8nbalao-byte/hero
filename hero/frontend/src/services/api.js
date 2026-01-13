import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Relative path for production (proxied in dev)
});

api.interceptors.request.use((config) => {
  // Bypass localtunnel warning page
  config.headers['Bypass-Tunnel-Reminder'] = 'true';
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
