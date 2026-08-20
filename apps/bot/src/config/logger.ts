import pino, { type LoggerOptions } from 'pino';
import { env } from './env';

const isProduction = env.NODE_ENV === 'production';

const options: LoggerOptions = {
  level: env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  redact: ['DISCORD_TOKEN', 'DATABASE_URL'],
};

if (!isProduction) {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(options);
