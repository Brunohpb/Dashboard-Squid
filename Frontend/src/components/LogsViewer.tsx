import React, { useState, useEffect } from 'react';
import { logsApi } from '../services/api';
import { 
  RawLogResponse
} from '../types';


type LogType = 'raw-access' | 'raw-cache';

interface LogsViewerProps {
  className?: string;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<LogType>('raw-access');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rawAccessLogs, setRawAccessLogs] = useState<RawLogResponse | null>(null);
  const [rawCacheLogs, setRawCacheLogs] = useState<RawLogResponse | null>(null);

  const [lines, setLines] = useState<number>(100);

  const loadRawAccessLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await logsApi.getRawAccessLogs(lines || 100);
      setRawAccessLogs(response.data);
    } catch (err) {
      setError('Erro ao carregar logs brutos de acesso');
      console.error('Erro ao carregar logs brutos de acesso:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRawCacheLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await logsApi.getRawCacheLogs(lines || 100);
      setRawCacheLogs(response.data);
    } catch (err) {
      setError('Erro ao carregar logs brutos de cache');
      console.error('Erro ao carregar logs brutos de cache:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = () => {
    switch (activeTab) {
      case 'raw-access':
        loadRawAccessLogs();
        break;
      case 'raw-cache':
        loadRawCacheLogs();
        break;
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeTab]);

  const applyFilters = () => {
    loadLogs();
  };

  const clearFilters = () => {
    setLines(100);
  };

  const renderRawLogs = (rawLogs: RawLogResponse | null) => {
    if (!rawLogs) return null;

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Informações dos Logs Brutos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Tipo:</span> {rawLogs.log_type}
            </div>
            <div>
              <span className="font-medium">Linhas solicitadas:</span> {rawLogs.lines_requested}
            </div>
            <div>
              <span className="font-medium">Linhas retornadas:</span> {rawLogs.lines_returned}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
          {rawLogs.raw_logs.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Logs Brutos</h2>
        <p className="text-gray-600 mt-1">Visualize o conteúdo bruto dos logs de acesso e cache do Squid</p>
      </div>

      {/* Abas apenas para Acesso e Cache brutos */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'raw-access', label: 'Logs Brutos - Acesso', icon: '📄' },
            { id: 'raw-cache', label: 'Logs Brutos - Cache', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LogType)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>


      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Linhas
            </label>
            <input
              type="number"
              value={Number.isFinite(lines) ? lines : ''}
              onChange={(e) => setLines(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
              min={1}
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : 'Aplicar'}
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando logs...</span>
          </div>
        ) : (
          <>
            {activeTab === 'raw-access' && renderRawLogs(rawAccessLogs)}
            {activeTab === 'raw-cache' && renderRawLogs(rawCacheLogs)}
          </>
        )}
      </div>
    </div>
  );
};

export default LogsViewer; 