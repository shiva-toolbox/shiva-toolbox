import {
  countStreamAlertsExcept,
  deleteStreamAlert,
  findGuildStreamAlerts,
  findStreamAlertByLogin,
  findStreamAlertByPlatformId,
  upsertStreamAlert,
} from '../../database';
import { UserError } from '../../errors';
import { parseYouTubeChannel } from '../../utils/youtube';
import { MAX_ALERTS, PLATFORM } from './constants';
import { requireYouTubeChannel } from './lookup';

export function listAlerts(guildId: string) {
  return findGuildStreamAlerts(guildId, PLATFORM);
}

export async function addAlert(guildId: string, query: string, channelId: string) {
  const channel = await requireYouTubeChannel(query);
  const otherAlerts = await countStreamAlertsExcept(guildId, PLATFORM, channel.id);

  if (otherAlerts >= MAX_ALERTS) {
    throw new UserError('youtube.max', { max: String(MAX_ALERTS) });
  }

  await upsertStreamAlert({
    guildId,
    platform: PLATFORM,
    platformId: channel.id,
    login: channel.handle ?? channel.id.toLowerCase(),
    displayName: channel.title,
    channelId,
  });

  return channel.title;
}

export async function removeAlert(guildId: string, query: string) {
  const parsed = parseYouTubeChannel(query);
  const alert = parsed
    ? parsed.kind === 'id'
      ? await findStreamAlertByPlatformId(guildId, PLATFORM, parsed.value)
      : await findStreamAlertByLogin(
          guildId,
          PLATFORM,
          parsed.kind === 'handle' ? parsed.value : parsed.value.toLowerCase(),
        )
    : null;

  if (!alert) {
    throw new UserError('youtube.notWatched');
  }

  await deleteStreamAlert(alert.id);
  return alert.displayName;
}
