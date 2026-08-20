import { PermissionFlagsBits, type Guild, type GuildMember } from 'discord.js';
import { logger } from '../../config';
import { fetchMe } from '../../utils/discord';
import { logError } from '../../utils/error-handling';
import { getAutoroleConfig, saveAutoroleConfig } from './config';
import { whyNotAssignable } from './roles';

const pending = new Map<string, ReturnType<typeof setTimeout>>();

function jobKey(guildId: string, userId: string) {
  return `${guildId}:${userId}`;
}

export function cancelAutorole(guildId: string, userId: string) {
  const key = jobKey(guildId, userId);
  const timeout = pending.get(key);
  if (!timeout) return;

  clearTimeout(timeout);
  pending.delete(key);
}

async function pruneDeletedRoles(guild: Guild, roleIds: string[]) {
  for (const id of roleIds) {
    if (!guild.roles.cache.has(id)) {
      await guild.roles.fetch(id).catch(() => null);
    }
  }

  const existingIds = roleIds.filter((id) => guild.roles.cache.has(id));
  if (existingIds.length !== roleIds.length) {
    const current = await getAutoroleConfig(guild.id);
    await saveAutoroleConfig(guild, { ...current, roleIds: existingIds });
  }

  return existingIds;
}

async function applyAutoroles(guild: Guild, userId: string) {
  const settings = await getAutoroleConfig(guild.id);
  if (settings.roleIds.length === 0) return;

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;

  const me = await fetchMe(guild);
  if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    logger.warn({ guildId: guild.id }, 'autorole skipped: missing Manage Roles');
    return;
  }

  const existingIds = await pruneDeletedRoles(guild, settings.roleIds);
  const roleIds = existingIds.filter((id) => {
    const role = guild.roles.cache.get(id);
    return role && !member.roles.cache.has(id) && whyNotAssignable(me, role) === null;
  });

  if (roleIds.length === 0) return;

  await member.roles.add(roleIds, 'Autorole');
  logger.info({ guildId: guild.id, userId, roleIds }, 'autorole assigned');
}

function scheduleAutoroles(guild: Guild, userId: string, delaySeconds: number) {
  const key = jobKey(guild.id, userId);
  cancelAutorole(guild.id, userId);

  const timeout = setTimeout(() => {
    pending.delete(key);

    void applyAutoroles(guild, userId).catch((error) => {
      logError(error, 'autorole failed', { guildId: guild.id, userId });
    });
  }, delaySeconds * 1000);

  pending.set(key, timeout);
}

export async function assignAutoroles(member: GuildMember) {
  try {
    const settings = await getAutoroleConfig(member.guild.id);
    if (settings.roleIds.length === 0) return;

    if (settings.delaySeconds <= 0) {
      await applyAutoroles(member.guild, member.id);
      return;
    }

    scheduleAutoroles(member.guild, member.id, settings.delaySeconds);
  } catch (error) {
    logError(error, 'autorole failed', {
      guildId: member.guild.id,
      userId: member.id,
    });
  }
}
