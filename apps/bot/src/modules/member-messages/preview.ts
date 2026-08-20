import type { Locale } from '@shiva/shared';
import type { Guild, GuildMember } from 'discord.js';
import { t } from '../../i18n';
import { canSendEmbeds } from '../../utils/discord';
import { getMemberMessageConfig, type MemberMessageKind } from './config';
import { buildMemberMessage, memberMessageTexts } from './message';

export function memberMessageLabel(locale: Locale, kind: MemberMessageKind) {
  return t(locale, kind === 'join' ? 'guildalert.join' : 'guildalert.leave');
}

async function channelStatus(
  guild: Guild,
  channelId: string | null,
  label: string,
  locale: Locale,
) {
  if (!channelId) {
    return t(locale, 'guildalert.channelUnset', { label });
  }

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !canSendEmbeds(channel, guild.members.me)) {
    return t(locale, 'guildalert.cannotPost', { label, channel: `<#${channelId}>` });
  }

  return t(locale, 'guildalert.channelOk', { label, channel: `<#${channelId}>` });
}

export async function previewMemberMessage(
  guild: Guild,
  kind: MemberMessageKind,
  member: GuildMember,
  locale: Locale,
) {
  const settings = await getMemberMessageConfig(guild.id, kind);

  return {
    content: await channelStatus(
      guild,
      settings.channelId,
      memberMessageLabel(locale, kind),
      locale,
    ),
    ...buildMemberMessage(memberMessageTexts(settings, kind, locale), member, guild, locale),
  };
}
