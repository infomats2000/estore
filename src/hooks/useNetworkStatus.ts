import { useState, useEffect, useCallback } from 'react';
import { getOfflineQueue, flushOfflineQueue } from '../utils/offlineSyncEngine';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  queuedCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  triggerManualSync: () => Promise<void>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [queuedCount, setQueuedCount] = useState<number>(() => getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refreshQueueCount = useCallback(() => {
    setQueuedCount(getOfflineQueue().length);
  }, []);

  const triggerManualSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      const { syncedCount } = await flushOfflineQueue();
      if (syncedCount > 0) {
        setLastSyncedAt(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('[Network Hook] Sync error:', e);
    } finally {
      setIsSyncing(false);
      refreshQueueCount();
    }
  }, [isSyncing, refreshQueueCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      triggerManualSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshQueueCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(refreshQueueCount, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [triggerManualSync, refreshQueueCount]);

  return {
    isOnline,
    wasOffline,
    queuedCount,
    isSyncing,
    lastSyncedAt,
    triggerManualSync
  };
}
