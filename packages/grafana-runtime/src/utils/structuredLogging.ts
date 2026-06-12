import { logDebug } from './logging';

type StructuredLogContext = Record<string, string>;

const serialize = (value: unknown): string => {
  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const createContext = (source: string, args: unknown[]): StructuredLogContext => {
  const context: StructuredLogContext = { source };

  args.forEach((arg, index) => {
    context[`arg${index + 1}`] = serialize(arg);
  });

  return context;
};

export function logStructuredDebug(source: string, message: unknown, ...args: unknown[]) {
  logDebug(serialize(message), createContext(source, args));
}
