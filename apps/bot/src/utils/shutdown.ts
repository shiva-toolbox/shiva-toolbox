import type { Client } from 'discord.js';
import { logger } from '../config/logger';
import { closeDatabase } from '../database';

export function listenForShutdown(client: Client) {
  const stop = async (signal: string) => {
    logger.info({ signal }, 'shutting down');

    await client.destroy().catch((error: unknown) => {
      logger.error({ err: error }, 'failed to destroy the discord client');
    });
    await closeDatabase();

    process.exit(0);
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void stop(signal);
    });
  }
}
