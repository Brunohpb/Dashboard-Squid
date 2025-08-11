import React, { useState } from 'react';
import { Network, Shield, CheckCircle, AlertTriangle, FileText, Settings, List } from 'lucide-react';
import { StatusCard } from './components/StatusCard';
import { ServiceControl } from './components/ServiceControl';
import { BlocklistManager } from './components/BlocklistManager';
import LogsViewer from './components/LogsViewer';
import { ToastContainer } from './components/ui/Toast';
import { useToast } from './hooks/useToast';
import { useApi } from './hooks/useApi';
import { systemApi } from './services/api';

type TabType = 'status' | 'control' | 'blocklist' | 'logs';

function App() {
  const { toasts, addToast, removeToast } = useToast();
  const [statusRefreshTrigger, setStatusRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const { data: status } = useApi(systemApi.getStatus, [statusRefreshTrigger]);

  const handleActionComplete = (type: 'success' | 'error', message: string) => {
    addToast(type, message);
  };

  const handleStatusUpdate = () => {
    // Incrementar o trigger para forçar a atualização do status
    setStatusRefreshTrigger(prev => prev + 1);
  };

  const getStatusInfo = () => {
    if (!status) {
      return {
        text: 'Carregando...',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        icon: <div className="w-2 h-2 bg-gray-500 rounded-full mr-2 animate-pulse"></div>
      };
    }

    switch (status.overall_status?.toLowerCase()) {
      case 'healthy':
        return {
          text: 'Sistema Saudável',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
        };
      case 'warning':
        return {
          text: 'Atenção Necessária',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
        };
      case 'error':
        return {
          text: 'Sistema com Problemas',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
        };
      default:
        return {
          text: 'Status Desconhecido',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
        };
    }
  };

  const statusInfo = getStatusInfo();

  const tabs = [
    { id: 'status', label: 'Status do Sistema', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'control', label: 'Controle de Serviço', icon: <Settings className="w-4 h-4" /> },
    { id: 'blocklist', label: 'Gerenciar Blocklist', icon: <List className="w-4 h-4" /> },
    { id: 'logs', label: 'Visualizar Logs', icon: <FileText className="w-4 h-4" /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'status':
        return <StatusCard refreshTrigger={statusRefreshTrigger} />;
      case 'control':
        return (
          <ServiceControl 
            onActionComplete={handleActionComplete} 
            onStatusUpdate={handleStatusUpdate}
          />
        );
      case 'blocklist':
        return (
          <BlocklistManager 
            onActionComplete={handleActionComplete} 
            onStatusUpdate={handleStatusUpdate}
          />
        );
      case 'logs':
        return <LogsViewer />;
      default:
        return <StatusCard refreshTrigger={statusRefreshTrigger} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">Squid Proxy Dashboard</h1>
                <p className="text-sm text-gray-600">Gerenciamento de Proxy e Controle de Acesso</p>
              </div>
            </div>
            <div className={`flex items-center px-3 py-1 ${statusInfo.bgColor} ${statusInfo.textColor} rounded-full text-sm font-medium`}>
              {statusInfo.icon}
              {statusInfo.text}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {renderTabContent()}
        </div>

        <footer className="mt-12 py-8 border-t border-gray-200">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-2" />
            <span>Squid Proxy Dashboard - Desenvolvido por Bruno Barbosa</span>
          </div>
        </footer>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;