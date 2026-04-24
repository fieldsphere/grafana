import {store, createClientLog} from '@grafana/data';
const clientLog = createClientLog('public/app/features/dashboard-scene/panel-edit/PanelEditNext/localStorageWithTTL');



interface StoredValueWithTTL<T> {
  value: T;
  timestamp: number;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isExpired<T>(item: StoredValueWithTTL<T>, ttlMs: number): boolean {
  return Date.now() - item.timestamp > ttlMs;
}

export const setLocalStorageWithTTL = <T>(key: string, value: T) => {
  const item: StoredValueWithTTL<T> = {
    value,
    timestamp: Date.now(),
  };

  try {
    store.setObject(key, item);
  } catch (error) {
    clientLog.error('Failed to persist value with TTL', error);
  }
};

export function getLocalStorageWithTTL<T>(key: string, ttlMs: number = ONE_WEEK_MS): T | null {
  const item = store.getObject<StoredValueWithTTL<T>>(key);
  if (!item) {
    return null;
  }
  if (typeof item.timestamp !== 'number' || isExpired(item, ttlMs)) {
    store.delete(key);
    return null;
  }
  return item.value;
}
