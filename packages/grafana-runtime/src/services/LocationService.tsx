import type { History as RouterHistory, Location as RouterLocation, Path as RouterPath, To as RouterTo } from '@remix-run/router';
import * as H from 'history';
import React, { useContext } from 'react';
import { BehaviorSubject, Observable } from 'rxjs';

import { deprecationWarning, UrlQueryMap, urlUtil } from '@grafana/data';
import { attachDebugger, createLogger } from '@grafana/ui';

import { config } from '../config';

import { LocationUpdate } from './LocationSrv';

/**
 * @public
 * A wrapper to help work with browser location and history
 */
export interface LocationService {
  partial: (query: Record<string, any>, replace?: boolean) => void;
  push: (location: H.Path | H.LocationDescriptor<any>) => void;
  replace: (location: H.Path | H.LocationDescriptor<any>) => void;
  reload: () => void;
  getLocation: () => H.Location;
  getHistory: () => H.History;
  getRouterHistory: () => RouterHistory;
  getSearch: () => URLSearchParams;
  getSearchObject: () => UrlQueryMap;
  getLocationObservable: () => Observable<H.Location>;

  /**
   * This is from the old LocationSrv interface
   * @deprecated use partial, push or replace instead */
  update: (update: LocationUpdate) => void;
}

/** @internal */
export class HistoryWrapper implements LocationService {
  private readonly history: H.History;
  private readonly routerHistory: RouterHistory;
  private locationObservable: BehaviorSubject<H.Location>;

  constructor(history?: H.History) {
    // If no history passed create an in memory one if being called from test
    this.history =
      history ||
      (process.env.NODE_ENV === 'test'
        ? H.createMemoryHistory({ initialEntries: ['/'] })
        : H.createBrowserHistory({ basename: config.appSubUrl ?? '/' }));
    this.routerHistory = new V4RouterHistoryAdapter(this.history);

    this.locationObservable = new BehaviorSubject(this.history.location);

    this.history.listen((location) => {
      this.locationObservable.next(location);
    });

    this.partial = this.partial.bind(this);
    this.push = this.push.bind(this);
    this.replace = this.replace.bind(this);
    this.getSearch = this.getSearch.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.getLocation = this.getLocation.bind(this);
  }

  getLocationObservable() {
    return this.locationObservable.asObservable();
  }

  getHistory() {
    return this.history;
  }

  getRouterHistory() {
    return this.routerHistory;
  }

  getSearch() {
    return new URLSearchParams(this.history.location.search);
  }

  partial(query: Record<string, any>, replace?: boolean) {
    const currentLocation = this.history.location;
    const newQuery = this.getSearchObject();

    for (const key in query) {
      // removing params with null | undefined
      if (query[key] === null || query[key] === undefined) {
        delete newQuery[key];
      } else {
        newQuery[key] = query[key];
      }
    }

    const updatedUrl = urlUtil.renderUrl(currentLocation.pathname, newQuery);

    if (replace) {
      this.history.replace(updatedUrl, this.history.location.state);
    } else {
      this.history.push(updatedUrl, this.history.location.state);
    }
  }

  push(location: H.Path | H.LocationDescriptor) {
    this.history.push(location);
  }

  replace(location: H.Path | H.LocationDescriptor) {
    this.history.replace(location);
  }

  reload() {
    const prevState = (this.history.location.state as any)?.routeReloadCounter;
    this.history.replace({
      ...this.history.location,
      state: { routeReloadCounter: prevState ? prevState + 1 : 1 },
    });
  }

  getLocation() {
    return this.history.location;
  }

  getSearchObject() {
    return locationSearchToObject(this.history.location.search);
  }

  /** @deprecated use partial, push or replace instead */
  update(options: LocationUpdate) {
    deprecationWarning('LocationSrv', 'update', 'partial, push or replace');
    if (options.partial && options.query) {
      this.partial(options.query, options.partial);
    } else {
      const newLocation: H.LocationDescriptor = {
        pathname: options.path,
      };
      if (options.query) {
        newLocation.search = urlUtil.toUrlParams(options.query);
      }
      if (options.replace) {
        this.replace(newLocation);
      } else {
        this.push(newLocation);
      }
    }
  }
}

/**
 * @public
 * Parses a location search string to an object
 * */
export function locationSearchToObject(search: string | number): UrlQueryMap {
  let queryString = typeof search === 'number' ? String(search) : search;

  if (queryString.length > 0) {
    if (queryString.startsWith('?')) {
      return urlUtil.parseKeyValue(queryString.substring(1));
    }
    return urlUtil.parseKeyValue(queryString);
  }

  return {};
}

/**
 * @public
 */
export let locationService: LocationService = new HistoryWrapper();

/**
 * Used for tests only
 * @internal
 */
export const setLocationService = (location: LocationService) => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('locationService can be only overriden in test environment');
  }
  locationService = location;
};

const navigationLog = createLogger('Router');

/** @internal */
export const navigationLogger = navigationLog.logger;

// For debugging purposes the location service is attached to global _debug variable
attachDebugger('location', locationService, navigationLog);

// Simple context so the location service can be used without being a singleton
const LocationServiceContext = React.createContext<LocationService | undefined>(undefined);

export function useLocationService(): LocationService {
  const service = useContext(LocationServiceContext);
  if (!service) {
    throw new Error('useLocationService must be used within a LocationServiceProvider');
  }
  return service;
}

export const LocationServiceProvider: React.FC<{ service: LocationService; children: React.ReactNode }> = ({
  service,
  children,
}) => {
  return <LocationServiceContext.Provider value={service}>{children}</LocationServiceContext.Provider>;
};

class V4RouterHistoryAdapter implements RouterHistory {
  constructor(private readonly history: H.History) {}

  get action(): RouterHistory['action'] {
    return this.history.action as RouterHistory['action'];
  }

  get location(): RouterLocation {
    return toRouterLocation(this.history.location);
  }

  createHref(to: RouterTo) {
    return this.history.createHref(toHistoryLocationDescriptor(to));
  }

  createURL(to: RouterTo) {
    const href = this.createHref(to);
    return new URL(href, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  }

  encodeLocation(to: RouterTo): RouterPath {
    if (typeof to === 'string') {
      const encoded = new URL(to, 'http://localhost');
      return {
        pathname: encoded.pathname,
        search: encoded.search,
        hash: encoded.hash,
      };
    }

    return {
      pathname: to.pathname ?? '',
      search: to.search ?? '',
      hash: to.hash ?? '',
    };
  }

  push(to: RouterTo, state?: any) {
    this.history.push(toHistoryLocationDescriptor(to), state);
  }

  replace(to: RouterTo, state?: any) {
    this.history.replace(toHistoryLocationDescriptor(to), state);
  }

  go(delta: number) {
    this.history.go(delta);
  }

  listen(listener: Parameters<RouterHistory['listen']>[0]) {
    return this.history.listen((location, action) => {
      listener({
        action: action as RouterHistory['action'],
        location: toRouterLocation(location),
        delta: null,
      });
    });
  }
}

function toRouterLocation(location: H.Location): RouterLocation {
  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    state: location.state,
    key: location.key ?? 'default',
  };
}

function toHistoryLocationDescriptor(to: RouterTo): H.LocationDescriptorObject {
  if (typeof to === 'string') {
    return to;
  }

  return {
    pathname: to.pathname ?? '',
    search: to.search ?? '',
    hash: to.hash ?? '',
  };
}
