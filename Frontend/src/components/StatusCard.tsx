import React from 'react';
import { Server, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { systemApi } from '../services/api';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface StatusCardProps {
  refreshTrigger?: number;
}

export function StatusCard({ refreshTrigger }: StatusCardProps) {
  const { data: status, loading, error, refetch } = useApi(systemApi.getStatus, [refreshTrigger]);

  const getOverallStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Server className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Server className="w-5 h-5 mr-2 text-blue-600" />
            Status do Sistema
          </h2>
          <LoadingSpinner />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Server className="w-5 h-5 mr-2 text-blue-600" />
            Status do Sistema
          </h2>
          <button
            onClick={refetch}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">Erro ao carregar status: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Server className="w-5 h-5 mr-2 text-blue-600" />
          Status do Sistema
        </h2>
        <button
          onClick={refetch}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Atualizar status"
        >
          <Activity className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status do Sistema */}
        <div className="space-y-4">
          {/* Status Geral */}
          {status?.overall_status && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {getOverallStatusIcon(status.overall_status)}
                <span className="font-medium text-gray-900 ml-3">Status Geral</span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOverallStatusColor(status.overall_status)}`}>
                {status.overall_status}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                status?.container_running ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium text-gray-900">Container</span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              status?.container_running 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {status?.container_running ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                status?.squid_process_running ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium text-gray-900">Processo Squid</span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              status?.squid_process_running 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {status?.squid_process_running ? 'Rodando' : 'Parado'}
            </span>
          </div>

          {/* Configuração */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                status?.config_valid ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium text-gray-900">Configuração</span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              status?.config_valid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {status?.config_valid ? 'Válida' : 'Inválida'}
            </span>
          </div>
        </div>

        {/* Erros de Configuração */}
        <div className="space-y-4">
          {status?.config_errors && status.config_errors.length > 0 ? (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                <span className="font-medium text-red-900">Erros de Configuração</span>
              </div>
              <div className="space-y-2">
                {status.config_errors.map((error, index) => (
                  <div key={index} className="bg-white p-3 rounded border text-xs text-red-700">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                <span className="font-medium text-green-900">Nenhum erro de configuração encontrado</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}