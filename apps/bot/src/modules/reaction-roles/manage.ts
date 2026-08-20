import {
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
  type Message,
  type MessageReaction,
  type PartialMessageReaction,
  type Role,
  type TextBasedChannel,
} from 'discord.js';
import {
  countGuildReactionRoles,
  createReactionRole,
  deleteReactionRole,
  findGuildReactionRoles,
  findMessageReactionRoles,
  findReactionRole,
} from '../../database';
import { UserError } from '../../errors';
import { guildLocale, t } from '../../i18n';
import { canSendEmbeds, fetchMe } from '../../utils/discord';
import { BaseEmbed } from '../../utils/embeds';
import { MAX_PER_MESSAGE, MAX_REACTION_ROLES } from './constants';
import { displayEmoji, resolveGuildEmoji } from './emoji';
import { whyNotAssignable } from '../autorole/roles';

export async function listReactionRoles(guildId: string) {
  return findGuildReactionRoles(guildId);
}

async function requireAssignable(guild: Guild, role: Role) {
  const me = await fetchMe(guild);
  if (!me) throw new UserError('autorole.needMember');
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new UserError('reactionRole.needManageRoles');
  }

  const blocked = whyNotAssignable(me, role);
  if (blocked) throw new UserError(blocked);
  return me;
}

function canAddReactions(channel: TextBasedChannel, me: GuildMember | null) {
  if (!me || channel.isDMBased() || !channel.isTextBased()) return false;
  return Boolean(
    'permissionsFor' in channel &&
      channel.permissionsFor(me)?.has(PermissionFlagsBits.AddReactions),
  );
}

async function refreshPanel(message: Message, rows: { emoji: string; roleId: string }[]) {
  if (!message.author.bot || !message.embeds[0]) return;

  const locale = message.guild ? await guildLocale(message.guild) : 'en-US';
  const description = rows
    .map((row) =>
      t(locale, 'reactionRole.panelLine', {
        emoji: displayEmoji(row.emoji),
        role: `<@&${row.roleId}>`,
      }),
    )
    .join('\n');

  await message.edit({
    embeds: [
      BaseEmbed()
        .setTitle(t(locale, 'reactionRole.panelTitle'))
        .setDescription(description || t(locale, 'reactionRole.none')),
    ],
  });
}

async function requireMessage(channel: TextBasedChannel, messageId: string) {
  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) {
    throw new UserError('reactionRole.unknownMessage');
  }

  return message;
}

export type AddReactionRoleInput = {
  role: Role;
  emoji: string;
  channel: TextBasedChannel;
  messageId: string | null;
};

export async function addReactionRole(
  guild: Guild,
  { role, emoji: emojiInput, channel, messageId }: AddReactionRoleInput,
) {
  await requireAssignable(guild, role);

  const me = guild.members.me;
  if (!canSendEmbeds(channel, me) || !channel.isSendable()) {
    throw new UserError('common.cannotSend');
  }
  if (!canAddReactions(channel, me)) {
    throw new UserError('reactionRole.needReact');
  }

  const emoji = await resolveGuildEmoji(guild, emojiInput);
  const count = await countGuildReactionRoles(guild.id);
  if (count >= MAX_REACTION_ROLES) {
    throw new UserError('reactionRole.max', { max: String(MAX_REACTION_ROLES) });
  }

  const existingMessage = messageId ? await requireMessage(channel, messageId) : null;
  let message = existingMessage;
  if (!message) {
    const locale = await guildLocale(guild);
    message = await channel.send({
      embeds: [
        BaseEmbed()
          .setTitle(t(locale, 'reactionRole.panelTitle'))
          .setDescription(
            t(locale, 'reactionRole.panelLine', {
              emoji: emoji.display,
              role: `${role}`,
            }),
          ),
      ],
    });
  } else {
    const onMessage = await findMessageReactionRoles(message.id);
    if (onMessage.length >= MAX_PER_MESSAGE) {
      throw new UserError('reactionRole.maxOnMessage', { max: String(MAX_PER_MESSAGE) });
    }
    if (await findReactionRole(message.id, emoji.key)) {
      throw new UserError('reactionRole.exists');
    }
  }

  try {
    await message.react(emoji.react);
  } catch {
    if (!existingMessage) await message.delete().catch(() => undefined);
    throw new UserError('reactionRole.invalidEmoji');
  }

  try {
    await createReactionRole({
      guildId: guild.id,
      channelId: channel.id,
      messageId: message.id,
      emoji: emoji.key,
      roleId: role.id,
    });
  } catch (error) {
    await message.reactions.cache.get(emoji.key)?.users.remove(message.client.user.id).catch(() => undefined);
    throw error;
  }

  const rows = await findMessageReactionRoles(message.id);
  await refreshPanel(message, rows).catch(() => undefined);

  return { emoji: emoji.display, message };
}

export type RemoveReactionRoleInput = {
  channel: TextBasedChannel;
  messageId: string;
  emoji: string;
};

export async function removeReactionRoleMapping(
  guild: Guild,
  { channel, messageId, emoji: emojiInput }: RemoveReactionRoleInput,
) {
  const message = await requireMessage(channel, messageId);
  const emoji = await resolveGuildEmoji(guild, emojiInput);
  const removed = await deleteReactionRole(message.id, emoji.key);
  if (!removed) {
    throw new UserError('reactionRole.missing');
  }

  await message.reactions.cache
    .get(emoji.key)
    ?.users.remove(guild.client.user.id)
    .catch(() => undefined);

  const rows = await findMessageReactionRoles(message.id);
  if (rows.length === 0 && message.author.id === guild.client.user.id) {
    await message.delete().catch(() => undefined);
  } else {
    await refreshPanel(message, rows).catch(() => undefined);
  }

  return emoji.display;
}

export async function applyReactionRole(
  reaction: MessageReaction | PartialMessageReaction,
  member: GuildMember,
  add: boolean,
) {
  const emoji = reaction.emoji.id ?? reaction.emoji.name;
  if (!emoji) return;

  const mapping = await findReactionRole(reaction.message.id, emoji);
  if (!mapping) return;

  const me = await fetchMe(member.guild);
  const role =
    member.guild.roles.cache.get(mapping.roleId) ??
    (await member.guild.roles.fetch(mapping.roleId).catch(() => null));
  if (!me || !role || whyNotAssignable(me, role)) return;

  if (add) {
    if (!member.roles.cache.has(role.id)) await member.roles.add(role, 'Reaction role');
    return;
  }

  if (member.roles.cache.has(role.id)) await member.roles.remove(role, 'Reaction role');
}
