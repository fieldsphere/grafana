import { KeyValue } from '../types/data';

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
    Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'warn'), console, [{ timestamp: new Date().toISOString(), level: 'warn', source: 'packages/grafana-data/src/utils/deprecationWarning.ts', args: [message] }]);
    history[message] = now;
  }
};
