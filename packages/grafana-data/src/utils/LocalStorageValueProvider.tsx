import { useEffect, useState } from 'react';
import * as React from 'react';

import { createStructuredLogger } from '@grafana/runtime';

import { store } from './store';

const logger = createStructuredLogger('LocalStorageValueProvider');

export interface Props<T> {
  storageKey: string;
  defaultValue: T;
  children: (value: T, onSaveToStore: (value: T) => void, onDeleteFromStore: () => void) => React.ReactNode;
}

export const LocalStorageValueProvider = <T,>(props: Props<T>) => {
  const { children, storageKey, defaultValue } = props;

  const [state, setState] = useState({ value: store.getObject(props.storageKey, props.defaultValue) });

  useEffect(() => {
    const onStorageUpdate = (v: StorageEvent) => {
      if (v.key === storageKey) {
        setState({ value: store.getObject(props.storageKey, props.defaultValue) });
      }
    };

    window.addEventListener('storage', onStorageUpdate);

    return () => {
      window.removeEventListener('storage', onStorageUpdate);
    };
  });

  const onSaveToStore = (value: T) => {
    try {
      store.setObject(storageKey, value);
    } catch (error) {
      logger.error('Failed to save to store', error instanceof Error ? error : new Error(String(error)), {
        storageKey,
      });
    }
    setState({ value });
  };

  const onDeleteFromStore = () => {
    try {
      store.delete(storageKey);
    } catch (error) {
      logger.info('Failed to delete from store', { storageKey, error: String(error) });
    }
    setState({ value: defaultValue });
  };

  return <>{children(state.value, onSaveToStore, onDeleteFromStore)}</>;
};
