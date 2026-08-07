const OFFLINE_STATE_CACHE_KEY = 'techseller_offline_app_state_v1';
const OFFLINE_QUEUE_KEY = 'techseller_offline_sync_queue_v1';
const MAX_OFFLINE_QUEUE_ITEMS = 250;
const OFFLINE_DB_NAME = 'store-erp-offline';
const OFFLINE_DB_STORE = 'state';

const openOfflineDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
  const request = indexedDB.open(OFFLINE_DB_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(OFFLINE_DB_STORE)) request.result.createObjectStore(OFFLINE_DB_STORE);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export interface QueuedOfflineTransaction {
  id: string;
  type: 'ORDER' | 'STATE_UPDATE' | 'STATE_SLICE_UPDATE' | 'STATE_RECORD_UPDATE' | 'CUSTOMER_CREATE';
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  payload: any;
  createdAt: string;
  retryCount?: number;
  lastAttemptAt?: string;
}

export async function saveOfflineAppState(state: Record<string, any>): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_DB_STORE, 'readwrite');
      transaction.objectStore(OFFLINE_DB_STORE).put(state, OFFLINE_STATE_CACHE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    localStorage.removeItem(OFFLINE_STATE_CACHE_KEY);
  } catch (e) {
    try { localStorage.setItem(OFFLINE_STATE_CACHE_KEY, JSON.stringify(state)); } catch {
      console.warn('[Offline Engine] Failed to write offline app state cache:', e);
    }
  }
}

export async function getOfflineCachedState(): Promise<Record<string, any> | null> {
  try {
    const db = await openOfflineDb();
    const state = await new Promise<Record<string, any> | null>((resolve, reject) => {
      const request = db.transaction(OFFLINE_DB_STORE, 'readonly').objectStore(OFFLINE_DB_STORE).get(OFFLINE_STATE_CACHE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (state) return state;
  } catch {}
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
  let queue = getOfflineQueue();
  const newItem: QueuedOfflineTransaction = {
    ...transaction,
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };
  
  if (transaction.type === 'STATE_SLICE_UPDATE' || transaction.type === 'STATE_RECORD_UPDATE') {
    queue = queue.filter((item) => !(item.type === transaction.type && item.endpoint === transaction.endpoint));
  }
  queue.push(newItem);
  if (queue.length > MAX_OFFLINE_QUEUE_ITEMS) {
    queue = queue.slice(queue.length - MAX_OFFLINE_QUEUE_ITEMS);
  }
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
      const token = localStorage.getItem('authToken') || '';
      const response = await fetch(item.endpoint, {
        method: item.method || (item.type === 'ORDER' ? 'POST' : 'PUT'),
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Idempotency-Key': item.id,
        },
        ...(item.method === 'DELETE' ? {} : { body: JSON.stringify(item.payload) })
      });

      if (response.ok) {
        syncedCount++;
      } else {
        failedCount++;
        if ((item.retryCount || 0) < 8) {
          remainingQueue.push({ ...item, retryCount: (item.retryCount || 0) + 1, lastAttemptAt: new Date().toISOString() });
        }
      }
    } catch (err) {
      failedCount++;
      if ((item.retryCount || 0) < 8) {
        remainingQueue.push({ ...item, retryCount: (item.retryCount || 0) + 1, lastAttemptAt: new Date().toISOString() });
      }
    }
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  } catch (e) {}

  return { syncedCount, failedCount };
}
