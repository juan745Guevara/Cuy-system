import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const farmId = localStorage.getItem('farmId');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (farmId) config.headers['x-farm-id'] = farmId;
  const speciesId = localStorage.getItem('speciesId');
  if (speciesId) config.headers['x-species-id'] = speciesId;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export default api;
