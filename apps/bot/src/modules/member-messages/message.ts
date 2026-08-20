import type { Locale } from '@shiva/shared';
import type { Guild, GuildMember, PartialGuildMember } from 'discord.js';
import { localizedOrCustom, t } from '../../i18n';
import { BaseEmbed } from '../../utils/embeds';
import { applyPlaceholders } from '../../utils/text';
import type { MemberMessageConfig, MemberMessageKind } from './config';

type AnyMember = GuildMember | PartialGuildMember;

export type MemberMessageTexts = {
  title: string;
  message: string;
};

function memberUsername(member: AnyMember) {
  const user = member.user;
  if (!user) return member.displayName || 'Someone';

  return user.discriminator && user.discriminator !== '0'
    ? `${user.username}#${user.discriminator}`
    : user.username;
}

function memberDisplayUsername(member: AnyMember) {
  const user = member.user;
  return member.displayName || user?.globalName || user?.username || 'Someone';
}

export function formatMemberMessage(template: string, member: AnyMember, guild: Guild) {
  return applyPlaceholders(template, {
    user: `<@${member.id}>`,
    username: memberUsername(member),
    displayUsername: memberDisplayUsername(member),
    guild: guild.name,
    count: String(guild.memberCount),
    id: member.id,
  });
}

const LEGACY_JOIN_MESSAGES = [
  'Hey {user}, hope you have a great time on **{guild}**!',
  'Welcome {user} to **{guild}**!',
  'Bem-vindo {user} ao **{guild}**!',
] as const;

export function memberMessageTexts(
  settings: Pick<MemberMessageConfig, 'title' | 'message'>,
  kind: MemberMessageKind,
  locale: Locale,
): MemberMessageTexts {
  const join = kind === 'join';

  return {
    title: localizedOrCustom(
      settings.title,
      join ? 'default.join.title' : 'default.leave.title',
      locale,
    ),
    message: localizedOrCustom(
      settings.message,
      join ? 'default.join.message' : 'default.leave.message',
      locale,
      join ? LEGACY_JOIN_MESSAGES : [],
    ),
  };
}

export function buildMemberMessage(
  settings: MemberMessageTexts,
  member: AnyMember,
  guild: Guild,
  locale: Locale,
  kind: MemberMessageKind,
) {
  const avatar = member.user?.displayAvatarURL({ size: 256 });
  const embed = BaseEmbed()
    .setAuthor({ name: memberUsername(member), iconURL: avatar })
    .setTitle(formatMemberMessage(settings.title, member, guild))
    .setDescription(formatMemberMessage(settings.message, member, guild))
    .setThumbnail(avatar ?? null)
    .setFooter({ text: t(locale, 'default.member.userId', { id: member.id }) })
    .setTimestamp();

  if (kind !== 'join') return { embeds: [embed] };

  return { content: `<@${member.id}>`, embeds: [embed] };
}
