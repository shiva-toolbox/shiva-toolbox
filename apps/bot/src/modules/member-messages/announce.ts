import type { Guild, GuildMember, PartialGuildMember } from 'discord.js';
import { logger } from '../../config';
import { guildLocale } from '../../i18n';
import { canSendEmbeds, isUnknownChannelError } from '../../utils/discord';
import { logError } from '../../utils/error-handling';
import {
  disableMemberMessage,
  getMemberMessageConfig,
  type MemberMessageKind,
} from './config';
import { buildMemberMessage, memberMessageTexts } from './message';

type AnyMember = GuildMember | PartialGuildMember;
type LogContext = Record<string, unknown>;

async function disableAfterChannelDeleted(
  guild: Guild,
  kind: MemberMessageKind,
  context: LogContext,
) {
  logger.warn(context, 'member alert channel was deleted; alerts disabled');

  await disableMemberMessage(guild, kind).catch((error) => {
    logError(error, 'failed to disable the member alert', context);
  });
}

async function resolveChannel(
  guild: Guild,
  channelId: string,
  kind: MemberMessageKind,
  context: LogContext,
) {
  const cached = guild.channels.cache.get(channelId);
  if (cached) return cached;

  return guild.channels.fetch(channelId).catch(async (error) => {
    if (isUnknownChannelError(error)) {
      await disableAfterChannelDeleted(guild, kind, context);
      return null;
    }

    logError(error, 'member alert channel fetch failed', { ...context, channelId });
    return null;
  });
}

export async function announceMemberMessage(member: AnyMember, kind: MemberMessageKind) {
  const guild = member.guild;
  const context = { guildId: guild.id, userId: member.id, kind };

  try {
    logger.info({ ...context, bot: member.user?.bot ?? null }, 'member alert event');

    const settings = await getMemberMessageConfig(guild.id, kind);
    if (!settings.channelId) {
      logger.warn(context, 'member alert skipped: no channel configured');
      return;
    }

    const channel = await resolveChannel(guild, settings.channelId, kind, context);
    if (!channel) return;

    const me = guild.members.me ?? (await guild.members.fetchMe().catch(() => null));

    if (!canSendEmbeds(channel, me) || !channel.isSendable()) {
      logger.warn(context, 'member alert skipped: missing channel permissions');
      return;
    }

    const locale = await guildLocale(guild);
    const texts = memberMessageTexts(settings, kind, locale);

    await channel.send(buildMemberMessage(texts, member, guild, locale));
    logger.info({ ...context, channelId: channel.id }, 'member alert sent');
  } catch (error) {
    if (isUnknownChannelError(error)) {
      await disableAfterChannelDeleted(guild, kind, context);
      return;
    }

    logError(error, 'member alert failed', context);
  }
}
