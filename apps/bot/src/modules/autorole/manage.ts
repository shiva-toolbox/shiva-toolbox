import { PermissionFlagsBits, type Guild, type Role } from 'discord.js';
import { logger } from '../../config';
import { UserError } from '../../errors';
import { fetchMe } from '../../utils/discord';
import {
  getAutoroleConfig,
  MAX_AUTOROLE_ROLES,
  saveAutoroleConfig,
} from './config';
import { whyNotAssignable } from './roles';

export async function addAutorole(guild: Guild, role: Role) {
  const me = await fetchMe(guild);
  if (!me) {
    throw new UserError('autorole.needMember');
  }
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new UserError('autorole.needManageRoles');
  }

  const blocked = whyNotAssignable(me, role);
  if (blocked) {
    throw new UserError(blocked);
  }

  const current = await getAutoroleConfig(guild.id);
  if (current.roleIds.includes(role.id)) {
    throw new UserError('autorole.already');
  }
  if (current.roleIds.length >= MAX_AUTOROLE_ROLES) {
    throw new UserError('autorole.max', { max: String(MAX_AUTOROLE_ROLES) });
  }

  await saveAutoroleConfig(guild, {
    ...current,
    roleIds: [...current.roleIds, role.id],
  });
}

async function dropAutorole(guild: Guild, roleId: string) {
  const current = await getAutoroleConfig(guild.id);
  if (!current.roleIds.includes(roleId)) return false;

  await saveAutoroleConfig(guild, {
    ...current,
    roleIds: current.roleIds.filter((id) => id !== roleId),
  });

  return true;
}

export async function removeAutorole(guild: Guild, roleId: string) {
  const removed = await dropAutorole(guild, roleId);
  if (!removed) {
    throw new UserError('autorole.notInList');
  }
}

export async function removeDeletedAutorole(guild: Guild, roleId: string) {
  const removed = await dropAutorole(guild, roleId);
  if (removed) {
    logger.warn(
      { guildId: guild.id, roleId },
      'autorole role was deleted; removed from the list',
    );
  }
}

export async function setAutoroleDelay(guild: Guild, delaySeconds: number) {
  const current = await getAutoroleConfig(guild.id);
  return saveAutoroleConfig(guild, { ...current, delaySeconds });
}

export async function disableAutorole(guild: Guild) {
  const current = await getAutoroleConfig(guild.id);
  return saveAutoroleConfig(guild, { ...current, roleIds: [] });
}
