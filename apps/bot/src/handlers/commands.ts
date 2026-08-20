import { Collection, type Client } from 'discord.js';
import { resolve } from 'node:path';
import { logger } from '../config/logger';
import { HandlerError } from '../errors';
import type { BotCommand } from '../structures';
import { importDefaults } from '../utils/load-files';

function assertCommand(command: BotCommand, file: string) {
  if (!command.data?.name) {
    throw new HandlerError(`The command at ${file} has no "data.name".`);
  }

  if (!command.data.description) {
    throw new HandlerError(`The command at ${file} has no "data.description".`);
  }

  if (typeof command.execute !== 'function') {
    throw new HandlerError(`The command at ${file} has no "execute" function.`);
  }
}

export async function loadCommands(client: Client) {
  const modules = await importDefaults<BotCommand>(
    resolve(import.meta.dirname, '../commands'),
  );

  client.commands = new Collection();

  for (const { file, value: command } of modules) {
    assertCommand(command, file);

    if (client.commands.has(command.data.name)) {
      throw new HandlerError(`Duplicate command name "${command.data.name}" at ${file}.`);
    }

    client.commands.set(command.data.name, command);
  }

  logger.info(
    { count: client.commands.size, commands: [...client.commands.keys()] },
    'commands loaded',
  );
}
