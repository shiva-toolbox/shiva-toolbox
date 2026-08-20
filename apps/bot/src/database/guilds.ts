import type { Guild } from 'discord.js';
import { DEFAULT_LOCALE, isLocale, localeFromDiscord, type Locale } from '@shiva/shared';
import { prisma, type Prisma } from './client';

export type ModuleConfig = Prisma.InputJsonObject;

export async function ensureGuild(guild: Guild) {
  const fields = {
    name: guild.name,
    icon: guild.icon,
    ownerId: guild.ownerId,
  };

  await prisma.guild.upsert({
    where: { id: guild.id },
    create: { id: guild.id, locale: localeFromDiscord(guild.preferredLocale), ...fields },
    update: fields,
  });
}

export async function getGuildLocale(guild: Guild): Promise<Locale> {
  const row = await prisma.guild.findUnique({
    where: { id: guild.id },
    select: { locale: true },
  });

  if (isLocale(row?.locale)) return row.locale;
  return localeFromDiscord(guild.preferredLocale);
}

/** For background work that only carries the guild id, with no cached Guild. */
export async function getGuildLocaleById(guildId: string): Promise<Locale> {
  const row = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { locale: true },
  });

  return isLocale(row?.locale) ? row.locale : DEFAULT_LOCALE;
}

export async function setGuildLocale(guild: Guild, locale: Locale) {
  await ensureGuild(guild);
  await prisma.guild.update({ where: { id: guild.id }, data: { locale } });
}

export async function findModuleConfig(
  guildId: string,
  moduleId: string,
): Promise<ModuleConfig> {
  const row = await prisma.guildModule.findUnique({
    where: { guildId_moduleId: { guildId, moduleId } },
  });

  return (row?.config ?? {}) as ModuleConfig;
}

export async function saveModuleConfig(
  guild: Guild,
  moduleId: string,
  { config, enabled }: { config: ModuleConfig; enabled: boolean },
) {
  await ensureGuild(guild);

  await prisma.guildModule.upsert({
    where: { guildId_moduleId: { guildId: guild.id, moduleId } },
    create: { guildId: guild.id, moduleId, enabled, config },
    update: { enabled, config },
  });
}
