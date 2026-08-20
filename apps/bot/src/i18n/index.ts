import { type Locale, localeFromDiscord } from '@shiva/shared';
import type { ChatInputCommandInteraction, Guild } from 'discord.js';
import { getGuildLocale, getGuildLocaleById } from '../database/guilds';
import { applyPlaceholders } from '../utils/text';
import { enUS, type MessageKey as EnMessageKey } from './en-US';
import { ptBR } from './pt-BR';

export type MessageKey = EnMessageKey;

export { describe, localized } from './builders';

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  'en-US': enUS,
  'pt-BR': ptBR,
};

export function t(locale: Locale, key: MessageKey, vars: Record<string, string> = {}) {
  return applyPlaceholders(catalogs[locale][key] ?? enUS[key], vars);
}

export function localizedOrCustom(
  value: string | null,
  key: MessageKey,
  locale: Locale,
  extras: readonly string[] = [],
) {
  if (!value || value === enUS[key] || extras.includes(value)) {
    return t(locale, key);
  }

  return value;
}

export async function guildLocale(guild: Guild) {
  return getGuildLocale(guild);
}

export async function guildLocaleById(guildId: string) {
  return getGuildLocaleById(guildId);
}

export async function interactionLocale(interaction: ChatInputCommandInteraction) {
  if (interaction.guild) return getGuildLocale(interaction.guild);
  return localeFromDiscord(interaction.locale);
}
