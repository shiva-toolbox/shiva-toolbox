import {
  countStreamAlertsExcept,
  deleteStreamAlert,
  findGuildStreamAlerts,
  findStreamAlertByLogin,
  upsertStreamAlert,
} from '../../database';
import { UserError } from '../../errors';
import { MAX_ALERTS, PLATFORM } from './constants';
import { requireLogin, requireTwitchUser } from './lookup';

export function listAlerts(guildId: string) {
  return findGuildStreamAlerts(guildId, PLATFORM);
}

export async function addAlert(guildId: string, username: string, channelId: string) {
  const user = await requireTwitchUser(username);
  const otherAlerts = await countStreamAlertsExcept(guildId, PLATFORM, user.id);

  if (otherAlerts >= MAX_ALERTS) {
    throw new UserError('twitch.max', { max: String(MAX_ALERTS) });
  }

  await upsertStreamAlert({
    guildId,
    platform: PLATFORM,
    platformId: user.id,
    login: user.login,
    displayName: user.displayName,
    channelId,
  });

  return user.displayName;
}

export async function removeAlert(guildId: string, username: string) {
  const alert = await findStreamAlertByLogin(guildId, PLATFORM, requireLogin(username));
  if (!alert) {
    throw new UserError('twitch.notWatched');
  }

  await deleteStreamAlert(alert.id);
  return alert.displayName;
}
