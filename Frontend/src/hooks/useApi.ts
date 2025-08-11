import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '../types';

export function useApi<T>(
  apiCall: () => Promise<{ data: T }>,
  dependencies: any[] = []
): ApiResponse<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiResponse<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const response = await apiCall();
      setState({ data: response.data, error: undefined, loading: false });
    } catch (error: any) {
      setState({
        data: undefined,
        error: error.response?.data?.message || error.message || 'Erro desconhecido',
        loading: false,
      });
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}