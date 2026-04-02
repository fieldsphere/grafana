type ConsoleLevel = 'log' | 'info' | 'debug' | 'warn' | 'error';

const PATCH_MARKER = Symbol.for('grafana.structured_console_patched');
const LOGGER_NAME = 'grafana.frontend.console';

type ConsoleWithMarker = Console & {
  [PATCH_MARKER]?: boolean;
};

interface StructuredConsoleEntry {
  logger: string;
  level: ConsoleLevel;
  message: string;
  timestamp: string;
  args: unknown[];
  original_args_count: number;
  payload: unknown;
}

function normalizeConsoleArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return {
      type: 'error',
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
    };
  }

  switch (typeof arg) {
    case 'bigint':
    case 'symbol':
      return arg.toString();
    case 'function':
      return `[Function ${(arg as Function).name || 'anonymous'}]`;
    default:
      return arg;
  }
}

function inferMessage(level: ConsoleLevel, args: unknown[]): string {
  if (typeof args[0] === 'string') {
    return args[0];
  }

  if (args[0] instanceof Error) {
    return args[0].message;
  }

  return `console.${level}`;
}

function buildStructuredEntry(level: ConsoleLevel, args: unknown[]): StructuredConsoleEntry {
  const normalizedArgs = args.map(normalizeConsoleArg);
  return {
    logger: LOGGER_NAME,
    level,
    message: inferMessage(level, args),
    timestamp: new Date().toISOString(),
    args: normalizedArgs,
    original_args_count: args.length,
    payload: normalizedArgs.length === 1 ? normalizedArgs[0] : normalizedArgs,
  };
}

export function enableStructuredConsoleLogging(targetConsole: Console = console): void {
  const consoleWithMarker = targetConsole as ConsoleWithMarker;
  if (consoleWithMarker[PATCH_MARKER]) {
    return;
  }

  const levels: ConsoleLevel[] = ['log', 'info', 'debug', 'warn', 'error'];
  for (const level of levels) {
    const original = targetConsole[level];
    if (typeof original !== 'function') {
      continue;
    }

    const originalBound = original.bind(targetConsole);
    targetConsole[level] = (...args: unknown[]) => {
      originalBound(buildStructuredEntry(level, args));
    };
  }

  consoleWithMarker[PATCH_MARKER] = true;
}
