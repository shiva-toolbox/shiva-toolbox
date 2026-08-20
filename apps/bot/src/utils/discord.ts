import {
  ChannelType,
  DiscordAPIError,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  type Channel,
  type Guild,
  type GuildMember,
} from 'discord.js';
import { UserError } from '../errors';

export const EMBED_CHANNEL_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
] as const;

function isDiscordErrorCode(error: unknown, ...codes: number[]) {
  return error instanceof DiscordAPIError && codes.includes(Number(error.code));
}

export function isUnknownChannelError(error: unknown) {
  return isDiscordErrorCode(error, RESTJSONErrorCodes.UnknownChannel);
}

export function isMissingPermissionsError(error: unknown) {
  return isDiscordErrorCode(
    error,
    RESTJSONErrorCodes.MissingPermissions,
    RESTJSONErrorCodes.MissingAccess,
  );
}

export function isGuildAlertChannel(
  channel: { id: string; type: ChannelType } | null | undefined,
): channel is {
  id: string;
  type: ChannelType.GuildText | ChannelType.GuildAnnouncement;
} {
  return (
    channel?.type === ChannelType.GuildText ||
    channel?.type === ChannelType.GuildAnnouncement
  );
}

export function fetchMe(guild: Guild) {
  return guild.members.me ?? guild.members.fetchMe().catch(() => null);
}

export function canSendEmbeds(channel: Channel, me: GuildMember | null) {
  if (!me || !channel.isTextBased() || channel.isDMBased() || !channel.isSendable())
    return false;
  return Boolean(channel.permissionsFor(me)?.has([...EMBED_CHANNEL_PERMISSIONS]));
}

export async function requireTextChannel(
  guild: Guild,
  candidate: { id: string; type: ChannelType } | null,
) {
  const channel = isGuildAlertChannel(candidate)
    ? await guild.channels.fetch(candidate.id).catch(() => null)
    : null;

  if (!channel?.isTextBased()) {
    throw new UserError('common.textChannelMessages');
  }

  return channel;
}

export async function requireSendableChannel(
  guild: Guild,
  candidate: { id: string; type: ChannelType } | null,
) {
  const channel = await requireTextChannel(guild, candidate);
  if (!canSendEmbeds(channel, await fetchMe(guild))) {
    throw new UserError('common.cannotSend');
  }

  return channel;
}
