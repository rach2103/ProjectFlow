/**
 * Simple logger utility using console with timestamps.
 * In production, replace with Winston or Pino for structured logging.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger = {
  info: (message: string, ...args: any[]): void => {
    console.log(formatMessage('info', message), ...args);
  },

  warn: (message: string, ...args: any[]): void => {
    console.warn(formatMessage('warn', message), ...args);
  },

  error: (message: string, ...args: any[]): void => {
    console.error(formatMessage('error', message), ...args);
  },

  debug: (message: string, ...args: any[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message), ...args);
    }
  },
};
