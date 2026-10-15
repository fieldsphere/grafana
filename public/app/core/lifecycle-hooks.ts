import { initDevFeatures } from 'app/dev';
import { notifyIfMockApiEnabled } from 'app/dev-utils';

import { performStartupRequest } from './utils/startupRequest';

const STARTUP_REQUEST_PATH = '/api/health';

/**
 * Lifecycle tasks that need to be run prior to app initialization,
 * such as setting up mock APIs or enabling dev-only features
 */
export async function preInitTasks() {
  await initDevFeatures();
}

/**
 * Lifecycle tasks that need to be run once the app has fully initialized,
 * such as notifying if mock APIs are enabled
 */
export async function postInitTasks() {
  notifyIfMockApiEnabled();
  void performStartupRequest(STARTUP_REQUEST_PATH);
}
