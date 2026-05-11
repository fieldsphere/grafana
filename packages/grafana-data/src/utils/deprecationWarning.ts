import { type KeyValue } from '../types/data';

import { emitStructuredBrowserLog } from './structuredBrowserLog';

// Avoid writing the warning message more than once every 10s
const history: KeyValue<number> = {};

export const deprecationWarning = (file: string, oldName: string, newName?: string) => {
  let message = `[Deprecation warning] ${file}: ${oldName} is deprecated`;
  if (newName) {
    message += `. Use ${newName} instead`;
  }
  const now = Date.now();
  const last = history[message];
  if (!last || now - last > 10000) {
    emitStructuredBrowserLog('warn', message);
    history[message] = now;
  }
};
