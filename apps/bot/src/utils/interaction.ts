import {
  MessageFlags,
  type ChatInputCommandInteraction,
  type Guild,
  type InteractionReplyOptions,
} from 'discord.js';
import { logger } from '../config/logger';
import { HandlerError, UserError } from '../errors';
import { interactionLocale } from '../i18n';
import { ErrorEmbed } from './embeds';
import { logError, userMessageFromError } from './error-handling';

export type GuildSubcommand = (
  interaction: ChatInputCommandInteraction,
  guild: Guild,
) => Promise<unknown> | unknown;

export function replyPrivately(
  interaction: ChatInputCommandInteraction,
  payload: InteractionReplyOptions,
) {
  return interaction.reply({
    ...payload,
    flags: MessageFlags.Ephemeral as const,
  });
}

export async function replyCommandError(
  interaction: ChatInputCommandInteraction,
  error: unknown,
) {
  logError(error, 'command failed', { command: interaction.commandName });

  const locale = await interactionLocale(interaction);
  const payload = {
    embeds: [ErrorEmbed(userMessageFromError(error, locale))],
    flags: MessageFlags.Ephemeral as const,
  };

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
      return;
    }

    await interaction.reply(payload);
  } catch (replyError) {
    logger.error(
      { err: replyError, command: interaction.commandName },
      'failed to send the error reply',
    );
  }
}

export function requireGuild(interaction: ChatInputCommandInteraction): Guild {
  if (interaction.inGuild() && interaction.guild) return interaction.guild;
  throw new UserError('common.guildOnly');
}

export function runGuildSubcommand(
  interaction: ChatInputCommandInteraction,
  subcommands: Record<string, GuildSubcommand>,
) {
  const name = interaction.options.getSubcommand();
  const run = subcommands[name];

  if (!run) {
    throw new HandlerError(
      `/${interaction.commandName} has no handler for the "${name}" subcommand.`,
    );
  }

  return run(interaction, requireGuild(interaction));
}
