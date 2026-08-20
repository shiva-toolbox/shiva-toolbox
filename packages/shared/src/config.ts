import { z } from 'zod';
import type { Locale } from './locale';
import type { ModuleId } from './modules';

export const MAX_AUTOROLE_ROLES = 10;
export const MAX_AUTOROLE_DELAY_SECONDS = 3600;

/** Null means "not configured": the bot renders the default in the guild locale. */
function text() {
  return z.string().trim().min(1).nullable().catch(null);
}

function snowflake() {
  return z.string().min(1).nullable().catch(null);
}

/** Keeps the valid ids when one entry is corrupted, and drops duplicates. */
function idList() {
  return z
    .array(z.string().min(1).catch(''))
    .catch([])
    .transform((ids) => [...new Set(ids.filter(Boolean))]);
}

export const autoroleConfigSchema = z.object({
  roleIds: idList(),
  delaySeconds: z.coerce
    .number()
    .catch(0)
    .transform((value) =>
      Math.min(MAX_AUTOROLE_DELAY_SECONDS, Math.max(0, Math.trunc(value))),
    ),
});

export const joinConfigSchema = z.object({
  channelId: snowflake(),
  title: text(),
  message: text(),
  dmEnabled: z.boolean().catch(false),
});

export const leaveConfigSchema = z.object({
  channelId: snowflake(),
  title: text(),
  message: text(),
});

export const youtubeConfigSchema = z.object({
  channelIds: idList(),
  alertChannelId: snowflake(),
  message: text(),
});

export const twitchConfigSchema = z.object({
  alertChannelId: snowflake(),
  message: text(),
});

export const reactionRolesConfigSchema = z.object({
  messageId: snowflake(),
});

export const MODULE_CONFIG_SCHEMAS = {
  autorole: autoroleConfigSchema,
  join: joinConfigSchema,
  leave: leaveConfigSchema,
  youtube: youtubeConfigSchema,
  twitch: twitchConfigSchema,
  'reaction-roles': reactionRolesConfigSchema,
} satisfies Record<ModuleId, z.ZodType>;

export type AutoroleConfig = z.infer<typeof autoroleConfigSchema>;
export type JoinConfig = z.infer<typeof joinConfigSchema>;
export type LeaveConfig = z.infer<typeof leaveConfigSchema>;
export type YoutubeConfig = z.infer<typeof youtubeConfigSchema>;
export type TwitchConfig = z.infer<typeof twitchConfigSchema>;
export type ReactionRolesConfig = z.infer<typeof reactionRolesConfigSchema>;

export type ModuleConfigMap = {
  [K in ModuleId]: z.infer<(typeof MODULE_CONFIG_SCHEMAS)[K]>;
};

/** A stored config that is not an object at all still has to yield defaults. */
function asRecord(value: unknown) {
  const isRecord = typeof value === 'object' && value !== null && !Array.isArray(value);
  return isRecord ? value : {};
}

/**
 * Stored configs come from the database and from the dashboard, so every field
 * falls back on its own instead of rejecting the whole record.
 */
export function parseModuleConfig<K extends ModuleId>(
  moduleId: K,
  value: unknown,
): ModuleConfigMap[K] {
  return MODULE_CONFIG_SCHEMAS[moduleId].parse(asRecord(value)) as ModuleConfigMap[K];
}

export const DEFAULT_MODULE_CONFIG: ModuleConfigMap = {
  autorole: parseModuleConfig('autorole', {}),
  join: parseModuleConfig('join', {}),
  leave: parseModuleConfig('leave', {}),
  youtube: parseModuleConfig('youtube', {}),
  twitch: parseModuleConfig('twitch', {}),
  'reaction-roles': parseModuleConfig('reaction-roles', {}),
};

export interface GuildModuleState<T extends ModuleId = ModuleId> {
  moduleId: T;
  enabled: boolean;
  config: ModuleConfigMap[T];
}

export interface GuildSettings {
  guildId: string;
  locale: Locale;
  modules: { [K in ModuleId]: GuildModuleState<K> };
}
