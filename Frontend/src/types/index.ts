export interface SystemStatus {
  container_running: boolean;
  squid_process_running: boolean;
  config_valid: boolean;
  container_status: string;
  squid_processes: string;
  config_errors: string[];
  overall_status: string;
}

export interface BlocklistResponse {
  blocked_urls: string[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Tipos para Logs de Acesso
export interface AccessLogEntry {
  timestamp: string;
  duration: string;
  client_ip: string;
  result_code: string;
  bytes: string;
  method: string;
  url: string;
  user: string;
  hierarchy_code: string;
  content_type: string;
  raw_line: string;
}

export interface AccessLogResponse {
  status: string;
  log_type: string;
  lines_requested: number;
  lines_returned: number;
  filters_applied: {
    ip?: string;
    url?: string;
  };
  logs: AccessLogEntry[];
}

// Tipos para Logs de Cache
export interface CacheLogEntry {
  timestamp: string;
  level: string;
  message: string;
  raw_line: string;
}

export interface CacheLogResponse {
  status: string;
  log_type: string;
  lines_requested: number;
  lines_returned: number;
  filters_applied: {
    level?: string;
    message?: string;
  };
  logs: CacheLogEntry[];
}

// Tipos para Logs Brutos
export interface RawLogResponse {
  status: string;
  log_type: string;
  lines_requested: number;
  lines_returned: number;
  raw_logs: string[];
}

// Tipos para filtros de logs
export interface LogFilters {
  lines?: number;
  filter_ip?: string;
  filter_url?: string;
  filter_level?: string;
  filter_message?: string;
}