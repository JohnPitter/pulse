const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

function getMinLevel(): number {
  const envLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as LogLevel;
  return LOG_LEVELS[envLevel] ?? LOG_LEVELS.info;
}

function log(level: LogLevel, message: string, context: string, data?: Record<string, unknown>): void {
  if (LOG_LEVELS[level] < getMinLevel()) {
    return;
  }

  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    ...data,
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case 'error':
      process.stderr.write(output + '\n');
      break;
    case 'warn':
      process.stderr.write(output + '\n');
      break;
    default:
      process.stdout.write(output + '\n');
      break;
  }
}

export function debug(message: string, context: string, data?: Record<string, unknown>): void {
  log('debug', message, context, data);
}

export function info(message: string, context: string, data?: Record<string, unknown>): void {
  log('info', message, context, data);
}

export function warn(message: string, context: string, data?: Record<string, unknown>): void {
  log('warn', message, context, data);
}

export function error(message: string, context: string, data?: Record<string, unknown>): void {
  log('error', message, context, data);
}
