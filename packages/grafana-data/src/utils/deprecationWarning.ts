import { KeyValue } from '../types/data';

import { createInternalLogger } from './logger';

const logger = createInternalLogger('DeprecationWarning');

// Avoid writing the warning message more than once every 10s
const history: KeyValue<number> = {};

export const deprecationWarning = (file: string, oldName: string, newName?: string) => {
  let message = `${oldName} is deprecated`;
  if (newName) {
    message += `. Use ${newName} instead`;
  }
  const now = Date.now();
  const cacheKey = `${file}:${message}`;
  const last = history[cacheKey];
  if (!last || now - last > 10000) {
    logger.warn(message, { file, oldName, newName });
    history[cacheKey] = now;
  }
};
