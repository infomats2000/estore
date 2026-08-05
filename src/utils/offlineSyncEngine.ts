const OFFLINE_STATE_CACHE_KEY = 'techseller_offline_app_state_v1';
const OFFLINE_QUEUE_KEY = 'techseller_offline_sync_queue_v1';

export interface QueuedOfflineTransaction {
  id: string;
  type: 'ORDER' | 'STATE_UPDATE' | 'CUSTOMER_CREATE';
  endpoint: string;
  payload: any;
  createdAt: string;
}

export function saveOfflineAppState(state: Record<string, any>): void {
  try {
    localStorage.setItem(OFFLINE_STATE_CACHE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Offline Engine] Failed to write offline app state cache:', e);
  }
}

export function getOfflineCachedState(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(OFFLINE_STATE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[Offline Engine] Failed to read offline app state cache:', e);
    return null;
  }
}

export function getOfflineQueue(): QueuedOfflineTransaction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function enqueueOfflineTransaction(transaction: Omit<QueuedOfflineTransaction, 'id' | 'createdAt'>): QueuedOfflineTransaction {
  const queue = getOfflineQueue();
  const newItem: QueuedOfflineTransaction = {
    ...transaction,
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };
  
  queue.push(newItem);
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[Offline Engine] Failed to enqueue transaction:', e);
  }
  return newItem;
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (e) {}
}

export async function flushOfflineQueue(): Promise<{ syncedCount: number; failedCount: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const remainingQueue: QueuedOfflineTransaction[] = [];

  for (const item of queue) {
    try {
      const response = await fetch(item.endpoint, {
        method: item.type === 'ORDER' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload)
      });

      if (response.ok) {
        syncedCount++;
      } else {
        failedCount++;
        remainingQueue.push(item);
      }
    } catch (err) {
      failedCount++;
      remainingQueue.push(item);
    }
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  } catch (e) {}

  return { syncedCount, failedCount };
}
