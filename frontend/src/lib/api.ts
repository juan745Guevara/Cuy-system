import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/** Tiempo que un GET se considera fresco (se sirve desde cache sin red). */
const GET_TTL_MS = 30_000;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const token = localStorage.getItem('token');
  const farmId = localStorage.getItem('farmId');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (farmId) config.headers['x-farm-id'] = farmId;
  const speciesId = localStorage.getItem('speciesId');
  if (speciesId) config.headers['x-species-id'] = speciesId;
  return config;
});

api.interceptors.response.use(
  (res) => {
    const method = res.config?.method?.toLowerCase();
    if (method && method !== 'get') clearApiCache();
    return res;
  },
  (err) => {
    if (typeof window !== 'undefined' && err.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  },
);

/* ------------------------------------------------------------------ */
/* Cache de lecturas (stale-while-navigate) + deduplicación de fetches */
/* ------------------------------------------------------------------ */

type CacheEntry = { at: number; res: AxiosResponse };
const getCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<AxiosResponse>>();

/** Limpia la cache de lectura (p. ej. al cambiar de granja o cerrar sesión). */
export function clearApiCache(): void {
  getCache.clear();
  inflight.clear();
}

function stableParams(params: unknown): string {
  if (!params || typeof params !== 'object') return String(params ?? '');
  const keys = Object.keys(params as Record<string, unknown>).sort();
  return keys
    .map((k) => `${k}=${String((params as Record<string, unknown>)[k])}`)
    .join('&');
}

function readKey(url: string, config?: AxiosRequestConfig): string {
  const farmId = typeof window !== 'undefined' ? localStorage.getItem('farmId') : '';
  const speciesId =
    typeof window !== 'undefined' ? localStorage.getItem('speciesId') : '';
  return `GET|${url}|${stableParams(config?.params)}|${farmId}|${speciesId}`;
}

const rawGet = api.get.bind(api);

api.get = ((url: string, config?: AxiosRequestConfig) => {
  if (typeof window === 'undefined') return rawGet(url, config);
  if (config?.responseType === 'blob' || config?.responseType === 'arraybuffer') {
    return rawGet(url, config);
  }

  const key = readKey(url, config);
  const cached = getCache.get(key);
  if (cached && Date.now() - cached.at < GET_TTL_MS) {
    return Promise.resolve(cached.res);
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = rawGet(url, config)
    .then((res) => {
      getCache.set(key, { at: Date.now(), res });
      return res;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}) as typeof api.get;

export default api;
