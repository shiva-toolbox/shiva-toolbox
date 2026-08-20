import { parseEmoji, type Guild } from 'discord.js';
import { UserError } from '../../errors';

export function emojiKey(emoji: { id: string | null; identifier: string; name: string | null }) {
  return emoji.id ?? emoji.name ?? emoji.identifier;
}

/** Stored keys are either a unicode emoji or a custom emoji id. */
export function displayEmoji(key: string) {
  return /^\d+$/.test(key) ? `<:_:${key}>` : key;
}

export async function resolveGuildEmoji(guild: Guild, input: string) {
  const parsed = parseEmoji(input.trim());
  if (!parsed?.name) {
    throw new UserError('reactionRole.invalidEmoji');
  }

  if (!parsed.id) {
    return {
      key: parsed.name,
      react: parsed.name,
      display: parsed.name,
    };
  }

  const emoji =
    guild.emojis.cache.get(parsed.id) ??
    (await guild.emojis.fetch(parsed.id).catch(() => null));
  if (!emoji) {
    throw new UserError('reactionRole.invalidEmoji');
  }

  return {
    key: emoji.id,
    react: emoji.identifier,
    display: emoji.toString(),
  };
}
