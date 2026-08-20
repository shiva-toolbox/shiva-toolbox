import type { Client } from 'discord.js';
import { resolve } from 'node:path';
import { logger } from '../config/logger';
import { HandlerError } from '../errors';
import type { AnyBotEvent } from '../structures';
import { logError } from '../utils/error-handling';
import { importDefaults } from '../utils/load-files';

export async function loadEvents(client: Client) {
  const modules = await importDefaults<AnyBotEvent>(
    resolve(import.meta.dirname, '../events'),
  );

  for (const { file, value: event } of modules) {
    if (!event.data?.name) {
      throw new HandlerError(`The event at ${file} has no "data.name".`);
    }

    if (typeof event.execute !== 'function') {
      throw new HandlerError(`The event at ${file} has no "execute" function.`);
    }

    const name = event.data.name;
    const run = (...args: unknown[]) => {
      const execute = event.execute as (...eventArgs: unknown[]) => unknown;

      void Promise.resolve(execute(...args)).catch((error) => {
        logError(error, 'event handler failed', { event: name, file });
      });
    };

    if (event.data.once) {
      client.once(name, run);
    } else {
      client.on(name, run);
    }
  }

  logger.info(
    { count: modules.length, events: modules.map((module) => module.file) },
    'events loaded',
  );
}
