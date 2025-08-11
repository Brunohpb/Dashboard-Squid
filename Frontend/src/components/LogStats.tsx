import React from 'react';
import { AccessLogResponse, CacheLogResponse } from '../types';
import { TrendingUp, Users, Globe, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface LogStatsProps {
  accessLogs: AccessLogResponse | null;
  cacheLogs: CacheLogResponse | null;
}

const LogStats: React.FC<LogStatsProps> = ({ accessLogs, cacheLogs }) => {
  const getAccessStats = () => {
    if (!accessLogs) return null;

    const logs = accessLogs.logs;
    const uniqueIPs = new Set(logs.map(log => log.client_ip)).size;
    const uniqueURLs = new Set(logs.map(log => log.url)).size;
    
    const statusCodes = logs.reduce((acc, log) => {
      const code = log.result_code.split('/')[1] || log.result_code;
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const successCount = statusCodes['200'] || 0;
    const errorCount = Object.entries(statusCodes).reduce((sum, [code, count]) => {
      return sum + (code.startsWith('4') || code.startsWith('5') ? count : 0);
    }, 0);

    const totalBytes = logs.reduce((sum, log) => sum + parseInt(log.bytes) || 0, 0);
    const avgDuration = logs.reduce((sum, log) => sum + parseFloat(log.duration) || 0, 0) / logs.length;

    return {
      totalRequests: logs.length,
      uniqueIPs,
      uniqueURLs,
      successCount,
      errorCount,
      totalBytes,
      avgDuration: isNaN(avgDuration) ? 0 : avgDuration
    };
  };

  const getCacheStats = () => {
    if (!cacheLogs) return null;

    const logs = cacheLogs.logs;
    const errorCount = logs.filter(log => log.level === 'ERROR').length;
    const warnCount = logs.filter(log => log.level === 'WARN').length;
    const infoCount = logs.filter(log => log.level === 'INFO').length;

    return {
      totalLogs: logs.length,
      errorCount,
      warnCount,
      infoCount
    };
  };

  const accessStats = getAccessStats();
  const cacheStats = getCacheStats();

  if (!accessStats && !cacheStats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas dos Logs</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estatísticas de Acesso */}
        {accessStats && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-700 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Logs de Acesso
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Total de Requisições</p>
                    <p className="text-lg font-semibold text-blue-900">{accessStats.totalRequests}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">IPs Únicos</p>
                    <p className="text-lg font-semibold text-green-900">{accessStats.uniqueIPs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">URLs Únicas</p>
                    <p className="text-lg font-semibold text-purple-900">{accessStats.uniqueURLs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Duração Média</p>
                    <p className="text-lg font-semibold text-yellow-900">{accessStats.avgDuration.toFixed(3)}s</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Sucessos (200)</p>
                    <p className="text-lg font-semibold text-green-900">{accessStats.successCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Erros (4xx/5xx)</p>
                    <p className="text-lg font-semibold text-red-900">{accessStats.errorCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total de Bytes Transferidos:</span> {accessStats.totalBytes.toLocaleString()} bytes
              </p>
            </div>
          </div>
        )}

        {/* Estatísticas de Cache */}
        {cacheStats && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-700 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Logs de Cache
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Total de Logs</p>
                    <p className="text-lg font-semibold text-blue-900">{cacheStats.totalLogs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Erros</p>
                    <p className="text-lg font-semibold text-red-900">{cacheStats.errorCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Avisos</p>
                    <p className="text-lg font-semibold text-yellow-900">{cacheStats.warnCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Informações</p>
                    <p className="text-lg font-semibold text-green-900">{cacheStats.infoCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {cacheStats.errorCount > 0 && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <span className="font-medium">⚠️ Atenção:</span> {cacheStats.errorCount} erro(s) detectado(s) nos logs de cache.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogStats; 