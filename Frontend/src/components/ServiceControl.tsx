import React, { useState } from 'react';
import { Play, Square, RotateCcw, Settings } from 'lucide-react';
import { systemApi } from '../services/api';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ServiceControlProps {
  onActionComplete: (type: 'success' | 'error', message: string) => void;
  onStatusUpdate?: () => void;
}

export function ServiceControl({ onActionComplete, onStatusUpdate }: ServiceControlProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async () => {
    try {
      
      await systemApi.getStatus();
      onStatusUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleServiceAction = async (action: 'start' | 'stop' | 'restart', actionName: string) => {
    setLoading(action);
    try {
      if (action === 'start') await systemApi.startService();
      else if (action === 'stop') await systemApi.stopService();
      else await systemApi.restartService();
      
      onActionComplete('success', `Serviço ${actionName.toLowerCase()} com sucesso!`);
      
      
      setTimeout(async () => {
        await updateStatus();
      }, 1000);
      
    } catch (error: any) {
      
      const errorMessage = error.response?.data 
        ? `Erro ao ${actionName.toLowerCase()}: ${JSON.stringify(error.response.data, null, 2)}`
        : `Erro ao ${actionName.toLowerCase()}: ${error.message || 'Erro desconhecido'}`;
      onActionComplete('error', errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const buttons = [
    {
      action: 'start' as const,
      label: 'Iniciar',
      icon: Play,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Iniciar o serviço Squid'
    },
    {
      action: 'stop' as const,
      label: 'Parar',
      icon: Square,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Parar o serviço Squid'
    },
    {
      action: 'restart' as const,
      label: 'Reiniciar',
      icon: RotateCcw,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Reiniciar o serviço Squid'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Settings className="w-5 h-5 mr-2 text-orange-600" />
        <h2 className="text-lg font-semibold text-gray-900">Controle do Serviço</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {buttons.map(({ action, label, icon: Icon, color, description }) => (
          <div key={action} className="text-center">
            <button
              onClick={() => handleServiceAction(action, label)}
              disabled={loading !== null}
              className={`w-full p-4 text-white rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${color} ${
                loading === action ? 'animate-pulse' : ''
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                {loading === action ? (
                  <LoadingSpinner size="md" className="text-white" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <span className="font-medium">{label}</span>
            </button>
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Aviso:</strong> Parar o serviço pode interromper a navegação dos usuários. 
          Use com cuidado em ambientes de produção.
        </p>
      </div>
    </div>
  );
}