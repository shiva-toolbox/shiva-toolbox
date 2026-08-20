import type { Client } from 'discord.js';
import { logger } from '../../config';
import {
  findStreamAlertsByPlatform,
  setStreamAlertVideo,
  type StreamAlertRow,
} from '../../database';
import { isUnknownChannelError } from '../../utils/discord';
import { logError } from '../../utils/error-handling';

type StreamLike = { id: string };

type StreamWatcherOptions<S extends StreamLike> = {
  platform: string;
  checkEveryMs: number;
  fetchLive: (platformIds: string[]) => Promise<S[]>;
  /** Ties a live stream back to the `platformId` stored on the alert. */
  platformIdOf: (stream: S) => string;
  buildAlert: (stream: S, message: string) => { content: string };
  getAlertMessage: (guildId: string) => Promise<string>;
};

export function createStreamWatcher<S extends StreamLike>({
  platform,
  checkEveryMs,
  fetchLive,
  platformIdOf,
  buildAlert,
  getAlertMessage,
}: StreamWatcherOptions<S>) {
  async function announce(
    client: Client,
    alert: StreamAlertRow,
    stream: S,
    message: string,
  ) {
    const context = {
      platform,
      guildId: alert.guildId,
      channelId: alert.channelId,
      login: alert.login,
    };

    const onFailure = (error: unknown, reason: string) => {
      if (isUnknownChannelError(error)) {
        logger.warn(context, 'stream alert channel was deleted');
      } else {
        logError(error, reason, context);
      }

      return null;
    };

    const channel = await client.channels
      .fetch(alert.channelId)
      .catch((error) => onFailure(error, 'failed to fetch the stream alert channel'));
    if (!channel?.isSendable() || channel.isDMBased()) return;

    await channel
      .send(buildAlert(stream, message))
      .catch((error) => onFailure(error, 'failed to send the stream alert'));
  }

  async function check(client: Client) {
    const alerts = await findStreamAlertsByPlatform(platform);
    if (alerts.length === 0) return;

    const streams = await fetchLive([...new Set(alerts.map((alert) => alert.platformId))]);
    const live = new Map(streams.map((stream) => [platformIdOf(stream), stream]));
    const messages = new Map<string, string>();

    const messageFor = async (guildId: string) => {
      const cached = messages.get(guildId);
      if (cached) return cached;

      const message = await getAlertMessage(guildId);
      messages.set(guildId, message);
      return message;
    };

    for (const alert of alerts) {
      const stream = live.get(alert.platformId);

      if (!stream) {
        if (alert.lastVideoId) await setStreamAlertVideo(alert.id, null);
        continue;
      }

      if (alert.lastVideoId === stream.id) continue;

      await announce(client, alert, stream, await messageFor(alert.guildId));
      await setStreamAlertVideo(alert.id, stream.id);
    }
  }

  return function startLiveChecks(client: Client) {
    const loop = async () => {
      await check(client).catch((error) => {
        logError(error, 'stream live check failed', { platform });
      });

      setTimeout(() => {
        void loop();
      }, checkEveryMs);
    };

    void loop();
  };
}
