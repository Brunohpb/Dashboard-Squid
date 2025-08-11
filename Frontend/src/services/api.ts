import axios from 'axios';
import { SystemStatus, BlocklistResponse, AccessLogResponse, CacheLogResponse, RawLogResponse, LogFilters } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/squid';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 50000,
});

export const systemApi = {
  getStatus: () => api.get<SystemStatus>('/status'),
  startService: () => api.post('/service/start'),
  stopService: () => api.post('/service/stop'),
  restartService: () => api.post('/service/restart'),
};

export const blocklistApi = {
  getBlocklist: () => api.get<BlocklistResponse>('/blocklist'),
  addUrl: (url: string) => api.post('/blocklist', { url }),
  removeUrl: (url: string) => api.delete('/blocklist', { data: { url } }),
  addBulkFromTxt: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/blocklist/bulk/txt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  removeBulk: (urls: string[]) => api.delete('/blocklist/bulk', { data: { urls } }),
};

export const logsApi = {
  // Logs de Acesso Parseados
  getAccessLogs: (filters: LogFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.lines) params.append('lines', filters.lines.toString());
    if (filters.filter_ip) params.append('filter_ip', filters.filter_ip);
    if (filters.filter_url) params.append('filter_url', filters.filter_url);
    return api.get<AccessLogResponse>(`/logs/access?${params.toString()}`);
  },

  // Logs de Cache Parseados
  getCacheLogs: (filters: LogFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.lines) params.append('lines', filters.lines.toString());
    if (filters.filter_level) params.append('filter_level', filters.filter_level);
    if (filters.filter_message) params.append('filter_message', filters.filter_message);
    return api.get<CacheLogResponse>(`/logs/cache?${params.toString()}`);
  },

  // Logs Brutos de Acesso
  getRawAccessLogs: (lines: number = 100) => {
    return api.get<RawLogResponse>(`/logs/raw/access?lines=${lines}`);
  },

  // Logs Brutos de Cache
  getRawCacheLogs: (lines: number = 100) => {
    return api.get<RawLogResponse>(`/logs/raw/cache?lines=${lines}`);
  },
};

export default api;