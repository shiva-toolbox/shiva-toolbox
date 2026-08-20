import type { Guild } from 'discord.js';
import { parseModuleConfig } from '@shiva/shared';
import { findModuleConfig, saveModuleConfig } from '../../database';
import { guildLocaleById, localizedOrCustom } from '../../i18n';
import { getYouTubeLiveStreams, type YoutubeStream } from '../../services/youtube';
import { applyPlaceholders } from '../../utils/text';
import { youtubeVideoUrl } from '../../utils/youtube';
import { PLATFORM } from './constants';
import { requireYouTubeChannel } from './lookup';

const SAMPLE_STREAM: YoutubeStream = {
  id: 'preview',
  channelId: '0',
  channelTitle: 'Channel',
  title: 'Live now',
  url: youtubeVideoUrl('dQw4w9WgXcQ'),
};

export function buildLiveAlert(stream: YoutubeStream, message: string) {
  const content = applyPlaceholders(message, {
    channel: stream.channelTitle,
    user: stream.channelTitle,
    title: stream.title,
    url: stream.url,
  });

  const hasLink = content.includes(stream.url) || content.includes('youtu');
  return { content: hasLink ? content : `${content} ${stream.url}` };
}

export async function getAlertMessage(guildId: string) {
  const message = parseModuleConfig(PLATFORM, await findModuleConfig(guildId, PLATFORM)).message;

  return localizedOrCustom(message, 'default.youtube.message', await guildLocaleById(guildId));
}

export async function setAlertMessage(guild: Guild, message: string) {
  await saveModuleConfig(guild, PLATFORM, { config: { message }, enabled: true });
}

export async function previewLiveAlert(guildId: string, query: string | null) {
  const message = await getAlertMessage(guildId);
  if (!query) return buildLiveAlert(SAMPLE_STREAM, message);

  const channel = await requireYouTubeChannel(query);
  const [live] = await getYouTubeLiveStreams([channel.id]);
  const stream = live ?? {
    ...SAMPLE_STREAM,
    channelId: channel.id,
    channelTitle: channel.title,
  };

  return buildLiveAlert(stream, message);
}
