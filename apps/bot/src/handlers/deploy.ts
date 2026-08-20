import { REST, Routes, SlashCommandBuilder, type Client } from 'discord.js';
import { env, logger } from '../config';
import { HandlerError } from '../errors';
import type { BotCommand } from '../structures';

function toSlashBody(command: BotCommand) {
  if ('toJSON' in command.data && typeof command.data.toJSON === 'function') {
    return command.data.toJSON();
  }

  return new SlashCommandBuilder()
    .setName(command.data.name)
    .setDescription(command.data.description)
    .toJSON();
}

export async function deployCommands(client: Client) {
  const applicationId = client.application?.id ?? env.DISCORD_CLIENT_ID;

  if (!applicationId) {
    throw new HandlerError('Cannot deploy commands without an application id.');
  }

  const body = [...client.commands.values()].map(toSlashBody);
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  const guildId = env.BOT_DEV_GUILD_ID;

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body });
    logger.info({ guildId }, 'slash commands registered for the development guild');
    return;
  }

  await rest.put(Routes.applicationCommands(applicationId), { body });
  logger.info('slash commands registered globally');
}
