import type { Guild } from 'discord.js';
import { parseModuleConfig } from '@shiva/shared';
import { logger } from '../../config';
import { findModuleConfig, saveModuleConfig } from '../../database';

export type MemberMessageKind = 'join' | 'leave';

export type MemberMessageConfig = {
  channelId: string | null;
  title: string | null;
  message: string | null;
};

export const MEMBER_MESSAGE_KINDS = ['join', 'leave'] as const;

export function isMemberMessageKind(value: string): value is MemberMessageKind {
  return MEMBER_MESSAGE_KINDS.includes(value as MemberMessageKind);
}

function parseConfig(kind: MemberMessageKind, value: unknown): MemberMessageConfig {
  const { channelId, title, message } = parseModuleConfig(kind, value);
  return { channelId, title, message };
}

export async function getMemberMessageConfig(guildId: string, kind: MemberMessageKind) {
  return parseConfig(kind, await findModuleConfig(guildId, kind));
}

async function saveConfig(
  guild: Guild,
  kind: MemberMessageKind,
  patch: Partial<MemberMessageConfig>,
) {
  const stored = await findModuleConfig(guild.id, kind);
  const config = { ...stored, ...parseConfig(kind, stored), ...patch };

  await saveModuleConfig(guild, kind, {
    config,
    enabled: Boolean(config.channelId),
  });

  return parseConfig(kind, config);
}

export async function setMemberMessageChannel(
  guild: Guild,
  kind: MemberMessageKind,
  channelId: string,
) {
  return saveConfig(guild, kind, { channelId });
}

export async function setMemberMessageTitle(
  guild: Guild,
  kind: MemberMessageKind,
  title: string,
) {
  return saveConfig(guild, kind, { title });
}

export async function setMemberMessageText(
  guild: Guild,
  kind: MemberMessageKind,
  message: string,
) {
  return saveConfig(guild, kind, { message });
}

export async function disableMemberMessage(guild: Guild, kind: MemberMessageKind) {
  return saveConfig(guild, kind, { channelId: null });
}

export async function clearDeletedAlertChannel(guild: Guild, channelId: string) {
  for (const kind of MEMBER_MESSAGE_KINDS) {
    const settings = await getMemberMessageConfig(guild.id, kind);
    if (settings.channelId !== channelId) continue;

    await disableMemberMessage(guild, kind);
    logger.warn(
      { guildId: guild.id, channelId, kind },
      'member alert channel was deleted; alerts disabled',
    );
  }
}
