import type { Guild } from 'discord.js';
import { parseModuleConfig } from '@shiva/shared';
import { findModuleConfig, saveModuleConfig } from '../../database';
import { guildLocaleById, localizedOrCustom } from '../../i18n';
import { getLiveStreams, type TwitchStream } from '../../services/twitch';
import { applyPlaceholders } from '../../utils/text';
import { twitchStreamUrl } from '../../utils/twitch';
import { PLATFORM } from './constants';
import { requireTwitchUser } from './lookup';

const SAMPLE_STREAM: TwitchStream = {
  id: 'preview',
  userId: '0',
  login: 'streamer',
  displayName: 'Streamer',
  title: 'Just Chatting',
  category: 'Just Chatting',
};

const LEGACY_MESSAGES = [
  '{user} is live on Twitch!',
  '{user} is live on Twitch!\n**{title}**\n{url}',
  '{user} is live on Twitch! **{title}** ({category}) {url}',
  '{user} is live playing {game}!',
] as const;

export function buildLiveAlert(stream: TwitchStream, message: string) {
  const url = twitchStreamUrl(stream.login);
  const content = applyPlaceholders(message, {
    user: stream.displayName,
    title: stream.title,
    game: stream.category,
    category: stream.category,
    url,
  });

  const hasLink = content.includes(url) || content.includes(`twitch.tv/${stream.login}`);

  return { content: hasLink ? content : `${content} ${url}` };
}

export async function getAlertMessage(guildId: string) {
  const message = parseModuleConfig(PLATFORM, await findModuleConfig(guildId, PLATFORM)).message;

  return localizedOrCustom(
    message,
    'default.twitch.message',
    await guildLocaleById(guildId),
    LEGACY_MESSAGES,
  );
}

export async function setAlertMessage(guild: Guild, message: string) {
  await saveModuleConfig(guild, PLATFORM, { config: { message }, enabled: true });
}

export async function previewLiveAlert(guildId: string, username: string | null) {
  const message = await getAlertMessage(guildId);
  if (!username) return buildLiveAlert(SAMPLE_STREAM, message);

  const user = await requireTwitchUser(username);
  const [live] = await getLiveStreams([user.id]);
  const stream = live ?? {
    ...SAMPLE_STREAM,
    userId: user.id,
    login: user.login,
    displayName: user.displayName,
    title: 'Untitled stream',
  };

  return buildLiveAlert(stream, message);
}
