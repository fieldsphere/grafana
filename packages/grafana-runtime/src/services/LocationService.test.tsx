import { renderHook } from '@testing-library/react';

import { locationService, HistoryWrapper, useLocationService, LocationServiceProvider } from './LocationService';

describe('LocationService', () => {
  describe('getSearchObject', () => {
    it('returns query string as object', () => {
      locationService.push('/test?query1=false&query2=123&query3=text');

      expect(locationService.getSearchObject()).toEqual({
        query1: false,
        query2: '123',
        query3: 'text',
      });
    });

    it('returns keys added multiple times as an array', () => {
      locationService.push('/test?servers=A&servers=B&servers=C');

      expect(locationService.getSearchObject()).toEqual({
        servers: ['A', 'B', 'C'],
      });
    });
  });

  describe('partial', () => {
    it('should handle removing params and updating', () => {
      locationService.push('/test?query1=false&query2=123&query3=text');
      locationService.partial({ query1: null, query2: 'update' });

      expect(locationService.getLocation().search).toBe('?query2=update&query3=text');
    });

    it('should handle array values', () => {
      locationService.push('/');
      locationService.partial({ servers: ['A', 'B', 'C'] });

      expect(locationService.getLocation().search).toBe('?servers=A&servers=B&servers=C');
    });

    it('should handle boolean string values', () => {
      locationService.push('/?query1=false&query2=true&query3');
      locationService.partial({ newProp: 'a' });

      expect(locationService.getLocation().search).toBe('?query1=false&query2=true&query3=true&newProp=a');
    });

    it('persist state', () => {
      locationService.push({
        pathname: '/d/123',
        state: {
          some: 'stateToPersist',
        },
      });
      locationService.partial({ q: 1 });

      expect(locationService.getLocation().search).toBe('?q=1');
      expect(locationService.getLocation().state).toEqual({
        some: 'stateToPersist',
      });
    });
  });

  describe('push and replace', () => {
    it('pushes a new entry and keeps the previous one in history', () => {
      const service = new HistoryWrapper();
      service.push('/first');
      service.push('/second');

      expect(service.getLocation().pathname).toBe('/second');
      expect(service.getHistory().action).toBe('PUSH');

      service.getHistory().goBack();
      expect(service.getLocation().pathname).toBe('/first');
    });

    it('replaces the current entry without adding to history', () => {
      const service = new HistoryWrapper();
      service.push('/first');
      const lengthBeforeReplace = service.getHistory().length;

      service.replace('/second');

      expect(service.getLocation().pathname).toBe('/second');
      expect(service.getHistory().action).toBe('REPLACE');
      expect(service.getHistory().length).toBe(lengthBeforeReplace);
    });

    it('accepts a location descriptor object', () => {
      const service = new HistoryWrapper();
      service.push({ pathname: '/d/123', search: '?from=now-5m', state: { some: 'state' } });

      expect(service.getLocation().pathname).toBe('/d/123');
      expect(service.getLocation().search).toBe('?from=now-5m');
      expect(service.getLocation().state).toEqual({ some: 'state' });
    });
  });

  describe('reload', () => {
    it('replaces the current location with an incrementing reload counter', () => {
      const service = new HistoryWrapper();
      service.push('/d/123?from=now-5m');

      service.reload();
      expect(service.getLocation().state).toEqual({ routeReloadCounter: 1 });

      service.reload();
      expect(service.getLocation().state).toEqual({ routeReloadCounter: 2 });

      // The reload must not move the user somewhere else
      expect(service.getLocation().pathname).toBe('/d/123');
      expect(service.getLocation().search).toBe('?from=now-5m');
    });
  });

  describe('getLocationObservable', () => {
    it('emits the current location immediately and on every subsequent change', () => {
      const service = new HistoryWrapper();
      const pathnames: string[] = [];

      const subscription = service.getLocationObservable().subscribe((location) => {
        pathnames.push(location.pathname);
      });

      service.push('/first');
      service.replace('/second');
      subscription.unsubscribe();
      service.push('/after-unsubscribe');

      expect(pathnames).toEqual(['/', '/first', '/second']);
    });
  });

  describe('getHistory shim', () => {
    it('exposes the history@4 listen callback shape of (location, action)', () => {
      const service = new HistoryWrapper();
      const listener = jest.fn();

      const unlisten = service.getHistory().listen(listener);
      service.push('/first');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/first' }), 'PUSH');

      unlisten();
      service.push('/second');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('blocks navigation while a block handler returns false, and stops once unblocked', () => {
      const service = new HistoryWrapper();
      service.push('/form');

      const unblock = service.getHistory().block(() => false);
      service.push('/somewhere-else');
      expect(service.getLocation().pathname).toBe('/form');

      unblock();
      service.push('/somewhere-else');
      expect(service.getLocation().pathname).toBe('/somewhere-else');
    });

    it('passes the attempted location and action to the block handler', () => {
      const service = new HistoryWrapper();
      const blockHandler = jest.fn().mockReturnValue(true);

      service.getHistory().block(blockHandler);
      service.push('/next?a=1');

      expect(blockHandler).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/next', search: '?a=1' }), 'PUSH');
      expect(service.getLocation().pathname).toBe('/next');
    });

    it('supports goBack, goForward and go', () => {
      const service = new HistoryWrapper();
      service.push('/first');
      service.push('/second');

      service.getHistory().goBack();
      expect(service.getLocation().pathname).toBe('/first');

      service.getHistory().goForward();
      expect(service.getLocation().pathname).toBe('/second');

      service.getHistory().go(-2);
      expect(service.getLocation().pathname).toBe('/');
    });
  });

  describe('hook access', () => {
    it('can set and access service from a context', () => {
      const locationServiceLocal = new HistoryWrapper();
      const wrapper: React.FunctionComponent<{ children: React.ReactNode }> = ({ children }) => (
        <LocationServiceProvider service={locationServiceLocal}>{children}</LocationServiceProvider>
      );
      const hookResult = renderHook(() => useLocationService(), { wrapper });
      expect(hookResult.result.current).toBe(locationServiceLocal);
    });
  });
});
