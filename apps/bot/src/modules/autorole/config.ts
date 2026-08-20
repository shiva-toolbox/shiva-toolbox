import type { Guild } from 'discord.js';
import {
  MAX_AUTOROLE_DELAY_SECONDS,
  MAX_AUTOROLE_ROLES,
  parseModuleConfig,
  type AutoroleConfig,
} from '@shiva/shared';
import { findModuleConfig, saveModuleConfig } from '../../database';

export const MODULE_ID = 'autorole';

export { MAX_AUTOROLE_DELAY_SECONDS, MAX_AUTOROLE_ROLES };

export type AutoroleSettings = AutoroleConfig;

export async function getAutoroleConfig(guildId: string) {
  return parseModuleConfig(MODULE_ID, await findModuleConfig(guildId, MODULE_ID));
}

export async function saveAutoroleConfig(guild: Guild, settings: AutoroleSettings) {
  await saveModuleConfig(guild, MODULE_ID, {
    config: settings,
    enabled: settings.roleIds.length > 0,
  });

  return settings;
}
