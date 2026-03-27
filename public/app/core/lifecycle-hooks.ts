import { initDevFeatures } from 'app/dev';
import { notifyIfMockApiEnabled } from 'app/dev-utils';

const STARTUP_REQUEST_PATH = '/api/health';

export type FetchLike = (input: string, init?: RequestInit) => Promise<unknown>;

/**
 * Lifecycle tasks that need to be run prior to app initialization,
 * such as setting up mock APIs or enabling dev-only features
 */
export async function preInitTasks() {
  await initDevFeatures();
}

export async function performStartupRequest(
  requestPath: string,
  fetchImpl: FetchLike = window.fetch.bind(window),
  origin: string = window.location.origin
): Promise<boolean> {
  const url = new URL(requestPath, origin);
  if (url.origin !== origin) {
    console.warn(`[Security] Blocked cross-origin startup request: ${url.toString()}`);
    return false;
  }

  try {
    await fetchImpl(url.toString(), { method: 'GET', credentials: 'same-origin' });
  } catch (error) {
    console.warn(`[Startup] Failed startup request: ${url.toString()}`, error);
  }

  return true;
}

/**
 * Lifecycle tasks that need to be run once the app has fully initialized,
 * such as notifying if mock APIs are enabled
 */
export async function postInitTasks() {
  notifyIfMockApiEnabled();
  void performStartupRequest(STARTUP_REQUEST_PATH);
}
