import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { blocklistApi } from '../services/api';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function BulkUploadModal({ isOpen, onClose, onSuccess, onError }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/plain' && !selectedFile.name.endsWith('.txt')) {
        onError('Por favor, selecione um arquivo .txt válido');
        return;
      }

      setFile(selectedFile);
      
      // Ler e mostrar preview do arquivo
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))
          .slice(0, 10); // Mostrar apenas as primeiras 10 linhas
        setPreview(lines);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onError('Por favor, selecione um arquivo');
      return;
    }

    setLoading(true);
    try {
      await blocklistApi.addBulkFromTxt(file);
      onSuccess();
      onClose();
      setFile(null);
      setPreview([]);
    } catch (error: any) {
      const errorMessage = error.response?.data 
        ? `Erro no upload: ${JSON.stringify(error.response.data, null, 2)}`
        : `Erro no upload: ${error.message || 'Erro desconhecido'}`;
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'text/plain' && !droppedFile.name.endsWith('.txt')) {
        onError('Por favor, selecione um arquivo .txt válido');
        return;
      }
      setFile(droppedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))
          .slice(0, 10);
        setPreview(lines);
      };
      reader.readAsText(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Upload em Lote
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Faça upload de um arquivo .txt com uma URL por linha. Linhas que começam com # são ignoradas.
            </p>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                file 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!file ? (
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Arraste um arquivo .txt aqui ou
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    clique para selecionar
                  </button>
                </div>
              ) : (
                <div>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 underline text-sm mt-2"
                  >
                    Selecionar outro arquivo
                  </button>
                </div>
              )}
            </div>
          </div>

          {preview.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Preview (primeiras 10 URLs):</h3>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {preview.map((url, index) => (
                  <div key={index} className="text-xs font-mono text-gray-700 py-1">
                    {url}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                'Fazer Upload'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 