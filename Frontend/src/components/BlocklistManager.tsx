import React, { useState, useCallback } from 'react';
import { Shield, Plus, Trash2, Globe, AlertCircle, Search, Upload, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { blocklistApi, systemApi } from '../services/api';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { BulkUploadModal } from './BulkUploadModal';

interface BlocklistManagerProps {
  onActionComplete: (type: 'success' | 'error', message: string) => void;
  onStatusUpdate?: () => void;
}

const ITEMS_PER_PAGE = 10;

export function BlocklistManager({ onActionComplete, onStatusUpdate }: BlocklistManagerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data: blocklist, loading, error, refetch } = useApi(blocklistApi.getBlocklist, [refreshTrigger]);
  const [newUrl, setNewUrl] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [removingUrls, setRemovingUrls] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [bulkRemoving, setBulkRemoving] = useState(false);

  const isValidUrl = (url: string) => {
    const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return urlPattern.test(url) || url.includes('.');
  };

  const updateStatus = async () => {
    try {
      await systemApi.getStatus();
      onStatusUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const refreshList = useCallback(async () => {
    setRefreshTrigger(prev => prev + 1);
    await refetch();
  }, [refetch]);

  const handleAddUrl = async () => {
    if (!newUrl.trim()) {
      onActionComplete('error', 'Por favor, insira uma URL válida');
      return;
    }

    if (!isValidUrl(newUrl.trim())) {
      onActionComplete('error', 'Formato de URL inválido');
      return;
    }

    setAddingUrl(true);
    try {
      await blocklistApi.addUrl(newUrl.trim());
      onActionComplete('success', `URL ${newUrl} adicionada à lista de bloqueios`);
      setNewUrl('');
      await refreshList();
      await updateStatus();
    } catch (error: any) {
      const errorMessage = error.response?.data 
        ? `Erro ao adicionar URL: ${JSON.stringify(error.response.data, null, 2)}`
        : `Erro ao adicionar URL: ${error.message || 'Erro desconhecido'}`;
      onActionComplete('error', errorMessage);
    } finally {
      setAddingUrl(false);
    }
  };

  const handleRemoveUrl = async (url: string) => {
    setRemovingUrls(prev => new Set(prev).add(url));
    try {
      await blocklistApi.removeUrl(url);
      onActionComplete('success', `URL ${url} removida da lista de bloqueios`);
      await refreshList();
      await updateStatus();
    } catch (error: any) {
      const errorMessage = error.response?.data 
        ? `Erro ao remover URL: ${JSON.stringify(error.response.data, null, 2)}`
        : `Erro ao remover URL: ${error.message || 'Erro desconhecido'}`;
      onActionComplete('error', errorMessage);
    } finally {
      setRemovingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    }
  };

  const handleBulkRemove = async () => {
    if (selectedUrls.size === 0) {
      onActionComplete('error', 'Selecione pelo menos uma URL para remover');
      return;
    }

    setBulkRemoving(true);
    try {
      const urlsToRemove = Array.from(selectedUrls);
      await blocklistApi.removeBulk(urlsToRemove);
      onActionComplete('success', `${selectedUrls.size} URLs removidas com sucesso`);
      setSelectedUrls(new Set());
      await refreshList();
      await updateStatus();
    } catch (error: any) {
      const errorMessage = error.response?.data 
        ? `Erro ao remover URLs: ${JSON.stringify(error.response.data, null, 2)}`
        : `Erro ao remover URLs: ${error.message || 'Erro desconhecido'}`;
      onActionComplete('error', errorMessage);
    } finally {
      setBulkRemoving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddUrl();
    }
  };

  const handleBulkUploadSuccess = () => {
    onActionComplete('success', 'URLs adicionadas com sucesso via upload em lote');
    refreshList();
    updateStatus();
  };

  const handleBulkUploadError = (message: string) => {
    onActionComplete('error', message);
  };

  const toggleUrlSelection = (url: string) => {
    setSelectedUrls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUrls.size === paginatedUrls.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(paginatedUrls));
    }
  };

  const clearSelection = () => {
    setSelectedUrls(new Set());
  };

  // Filtrar URLs baseado no termo de pesquisa
  const filteredUrls = blocklist?.blocked_urls.filter(url =>
    url.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calcular paginação
  const totalPages = Math.ceil(filteredUrls.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUrls = filteredUrls.slice(startIndex, endIndex);

  // Resetar página quando mudar o filtro
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Limpar seleção quando mudar de página
  React.useEffect(() => {
    setSelectedUrls(new Set());
  }, [currentPage, searchTerm]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="w-5 h-5 mr-2 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Lista de Bloqueios</h2>
        </div>
        <div className="flex items-center gap-2">
          {blocklist && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
              {filteredUrls.length} de {blocklist.blocked_urls.length} URLs
            </span>
          )}
          <button
            onClick={() => setShowBulkUpload(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload TXT
          </button>
        </div>
      </div>

      {/* Formulário para adicionar nova URL */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label htmlFor="newUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Adicionar nova URL para bloqueio
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              id="newUrl"
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="exemplo.com ou www.exemplo.com"
              className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              disabled={addingUrl}
            />
            <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={handleAddUrl}
            disabled={addingUrl || !newUrl.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {addingUrl ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Bloquear
              </>
            )}
          </button>
        </div>
        {newUrl && !isValidUrl(newUrl) && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            Formato de URL inválido
          </p>
        )}
      </div>

      {/* Filtro de pesquisa */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar URLs..."
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Controles de seleção múltipla */}
      {paginatedUrls.length > 0 && (
        <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              {selectedUrls.size === paginatedUrls.length ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              {selectedUrls.size === paginatedUrls.length ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>
            {selectedUrls.size > 0 && (
              <span className="text-sm text-gray-600">
                {selectedUrls.size} selecionada{selectedUrls.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {selectedUrls.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Limpar seleção
              </button>
              <button
                onClick={handleBulkRemove}
                disabled={bulkRemoving}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
              >
                {bulkRemoving ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remover ({selectedUrls.size})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de URLs bloqueadas */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 h-12 rounded-lg"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">Erro ao carregar lista: {error}</p>
          <button
            onClick={refreshList}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : paginatedUrls.length > 0 ? (
        <>
          <div className="space-y-2 mb-4">
            {paginatedUrls.map((url, index) => (
              <div
                key={`${url}-${startIndex + index}`}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  selectedUrls.has(url) 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-red-50 border-red-200 hover:bg-red-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleUrlSelection(url)}
                    className="flex-shrink-0"
                  >
                    {selectedUrls.has(url) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-3 text-red-500" />
                    <span className="font-mono text-sm text-red-800">{url}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveUrl(url)}
                  disabled={removingUrls.has(url)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remover da lista de bloqueios"
                >
                  {removingUrls.has(url) ? (
                    <LoadingSpinner size="sm" className="text-red-500" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUrls.length)} de {filteredUrls.length} URLs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : searchTerm ? (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Nenhuma URL encontrada para "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Limpar pesquisa
          </button>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Nenhuma URL bloqueada</p>
          <p className="text-xs mt-1">Adicione uma URL acima ou faça upload de um arquivo TXT</p>
        </div>
      )}

      {/* Modal de Upload em Lote */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={handleBulkUploadSuccess}
        onError={handleBulkUploadError}
      />
    </div>
  );
}