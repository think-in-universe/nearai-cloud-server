import winston, { LoggerOptions } from 'winston';
import { config } from '../config';

export function createLogger({ isDev = true }: { isDev?: boolean } = {}) {
  const loggerOptions: LoggerOptions = {
    level: config.log.level,
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      ...[
        ...(isDev ? [winston.format.colorize({ all: true })] : []),
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.align(),
        winston.format.printf(
          (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
        ),
      ],
    ),
  };

  return winston.createLogger(loggerOptions);
}

export const logger = createLogger({ isDev: config.isDev });
