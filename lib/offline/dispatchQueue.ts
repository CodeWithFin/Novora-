import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AxiosInstance } from 'axios';

interface StockOutPayload {
  items: { itemId: string; quantity: number; notes?: string }[];
  shopId: string;
  transactionDate?: string;
  globalNotes?: string;
}

export interface QueuedDispatch {
  id: string;
  payload: StockOutPayload;
  queuedAt: number;
  attempts: number;
}

interface NovoraOfflineDB extends DBSchema {
  'dispatch-queue': {
    key: string;
    value: QueuedDispatch;
  };
}

let dbPromise: Promise<IDBPDatabase<NovoraOfflineDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<NovoraOfflineDB>('novora-offline', 1, {
      upgrade(db) {
        db.createObjectStore('dispatch-queue', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function queueDispatch(
  payload: StockOutPayload
): Promise<void> {
  const db = await getDb();
  const { nanoid } = await import('nanoid');
  await db.put('dispatch-queue', {
    id: nanoid(),
    payload,
    queuedAt: Date.now(),
    attempts: 0,
  });
}

export async function getQueuedDispatches(): Promise<QueuedDispatch[]> {
  const db = await getDb();
  return db.getAll('dispatch-queue');
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('dispatch-queue', id);
}

export async function syncQueue(
  apiClient: AxiosInstance
): Promise<{ synced: number; failed: number }> {
  const queue = await getQueuedDispatches();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await apiClient.post('/stock/out', item.payload);
      await removeFromQueue(item.id);
      synced++;
    } catch {
      failed++;
      const db = await getDb();
      await db.put('dispatch-queue', {
        ...item,
        attempts: item.attempts + 1,
      });
    }
  }

  return { synced, failed };
}
