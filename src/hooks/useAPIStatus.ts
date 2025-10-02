import { useState, useCallback } from 'react';

interface APIStatus {
  isOnline: boolean;
  lastError: string | null;
  retryCount: number;
}

export const useAPIStatus = () => {
  const [status, setStatus] = useState<APIStatus>({
    isOnline: true,
    lastError: null,
    retryCount: 0
  });

  const handleAPIError = useCallback((error: any) => {
    const isRateLimit = error?.status === 429 || 
                       error?.message?.includes('quota') || 
                       error?.message?.includes('rate limit');
    
    if (isRateLimit) {
      setStatus(prev => ({
        isOnline: false,
        lastError: 'API rate limit exceeded',
        retryCount: prev.retryCount + 1
      }));
    }
  }, []);

  const retryAPI = useCallback(() => {
    setStatus(prev => ({
      isOnline: true,
      lastError: null,
      retryCount: 0
    }));
  }, []);

  const dismissNotification = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      lastError: null
    }));
  }, []);

  return {
    status,
    handleAPIError,
    retryAPI,
    dismissNotification
  };
};

