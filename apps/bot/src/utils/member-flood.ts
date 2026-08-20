import { logger } from '../config/logger';

export type MemberEventKind = 'join' | 'leave';

const MEMBER_WINDOW_MS = 60_000;
const GUILD_LIMIT = 20;
const GUILD_WINDOW_MS = 60_000;
const SWEEP_AT = 5_000;

type Burst = {
  count: number;
  resetAt: number;
  warned: boolean;
};

const seenMembers = new Map<string, number>();
const guildBursts = new Map<string, Burst>();

function sweep(now: number) {
  for (const [key, expiresAt] of seenMembers) {
    if (expiresAt <= now) seenMembers.delete(key);
  }

  for (const [guildId, burst] of guildBursts) {
    if (burst.resetAt <= now) guildBursts.delete(guildId);
  }
}

function isRepeat(guildId: string, userId: string, kind: MemberEventKind, now: number) {
  const key = `${guildId}:${userId}:${kind}`;
  const expiresAt = seenMembers.get(key);

  if (expiresAt && expiresAt > now) return true;
  if (seenMembers.size >= SWEEP_AT) sweep(now);

  seenMembers.set(key, now + MEMBER_WINDOW_MS);
  return false;
}

function isBursting(guildId: string, now: number) {
  const burst = guildBursts.get(guildId);

  if (!burst || burst.resetAt <= now) {
    guildBursts.set(guildId, { count: 1, resetAt: now + GUILD_WINDOW_MS, warned: false });
    return false;
  }

  burst.count += 1;
  if (burst.count <= GUILD_LIMIT) return false;

  if (!burst.warned) {
    burst.warned = true;
    logger.warn(
      { guildId, limit: GUILD_LIMIT, windowMs: GUILD_WINDOW_MS },
      'member events throttled: burst detected',
    );
  }

  return true;
}

export function allowMemberEvent(
  guildId: string,
  userId: string,
  kind: MemberEventKind,
) {
  const now = Date.now();

  if (isRepeat(guildId, userId, kind, now)) {
    logger.debug({ guildId, userId, kind }, 'member event throttled: repeated');
    return false;
  }

  return !isBursting(guildId, now);
}
