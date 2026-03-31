import { useEffect, useState } from 'react';
import * as React from 'react';

import { store } from './store';

function logStorageFailure(operation: string, error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      level: 'ERROR',
      source: 'LocalStorageValueProvider',
      operation,
      message: err.message,
      name: err.name,
      stack: err.stack,
      timestamp: Date.now(),
    })
  );
}

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
      logStorageFailure('save', error);
    }
    setState({ value });
  };

  const onDeleteFromStore = () => {
    try {
      store.delete(storageKey);
    } catch (error) {
      logStorageFailure('delete', error);
    }
    setState({ value: defaultValue });
  };

  return <>{children(state.value, onSaveToStore, onDeleteFromStore)}</>;
};
