import axios from 'axios';
import { env } from '../config';
import { YoutubeAPIError } from '../errors';
import { parseYouTubeChannel, youtubeVideoUrl } from '../utils/youtube';

const API_URL = 'https://www.googleapis.com/youtube/v3';
const LIVE_CONCURRENCY = 4;
const LIVE_TIMEOUT_MS = 8_000;
const PLAYER_MARKER = 'ytInitialPlayerResponse';
const DETAILS_KEY = '"videoDetails"';

export type YoutubeChannel = {
  id: string;
  handle: string | null;
  title: string;
};

export type YoutubeStream = {
  id: string;
  channelId: string;
  channelTitle: string;
  title: string;
  url: string;
};

type YoutubeList<T> = { items?: T[] };

type ChannelItem = {
  id: string;
  snippet: {
    title: string;
    customUrl?: string;
  };
};

type VideoItem = {
  id: string;
  snippet: {
    channelId: string;
    channelTitle: string;
    title: string;
  };
};

type VideoDetails = {
  videoId?: string;
  title?: string;
  author?: string;
  isLive?: boolean | string;
};

function apiKey() {
  const key = env.YOUTUBE_API_KEY?.trim();
  return key || null;
}

async function youtubeGet<T>(path: string, params: Record<string, string>) {
  const key = apiKey();
  if (!key) throw new YoutubeAPIError();

  try {
    const { data } = await axios.get<T>(`${API_URL}/${path}`, {
      params: { ...params, key },
    });
    return data;
  } catch (error) {
    throw new YoutubeAPIError(error);
  }
}

function toChannel(item: ChannelItem): YoutubeChannel {
  const custom = item.snippet.customUrl?.replace(/^@/, '').toLowerCase() ?? null;
  return {
    id: item.id,
    handle: custom && !custom.startsWith('uc') ? custom : null,
    title: item.snippet.title,
  };
}

async function getChannelById(id: string) {
  const { items } = await youtubeGet<YoutubeList<ChannelItem>>('channels', {
    part: 'snippet',
    id,
  });
  const item = items?.[0];
  return item ? toChannel(item) : null;
}

async function getChannelByHandle(handle: string) {
  const { items } = await youtubeGet<YoutubeList<ChannelItem>>('channels', {
    part: 'snippet',
    forHandle: `@${handle}`,
  });
  const item = items?.[0];
  return item ? toChannel(item) : null;
}

async function searchChannel(query: string) {
  const { items } = await youtubeGet<YoutubeList<{ id?: { channelId?: string } }>>(
    'search',
    {
      part: 'snippet',
      type: 'channel',
      maxResults: '1',
      q: query,
    },
  );
  const channelId = items?.[0]?.id?.channelId;
  return channelId ? getChannelById(channelId) : null;
}

async function getChannelFromVideo(videoId: string) {
  const { items } = await youtubeGet<YoutubeList<VideoItem>>('videos', {
    part: 'snippet',
    id: videoId,
  });
  const channelId = items?.[0]?.snippet.channelId;
  return channelId ? getChannelById(channelId) : null;
}

export function isYouTubeConfigured() {
  return Boolean(apiKey());
}

export async function getYouTubeChannel(input: string) {
  const parsed = parseYouTubeChannel(input);
  if (!parsed) return null;

  if (parsed.kind === 'id') return getChannelById(parsed.value);
  if (parsed.kind === 'handle') return getChannelByHandle(parsed.value);
  if (parsed.kind === 'video') return getChannelFromVideo(parsed.value);
  return searchChannel(parsed.value);
}

function sliceJsonObject(html: string, start: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < html.length; index += 1) {
    const char = html[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }

  return null;
}

function readVideoDetails(html: string): VideoDetails | null {
  const player = html.indexOf(PLAYER_MARKER);
  if (player === -1) return null;

  const key = html.indexOf(DETAILS_KEY, player);
  if (key === -1) return null;

  const start = html.indexOf('{', key + DETAILS_KEY.length);
  if (start === -1) return null;

  const json = sliceJsonObject(html, start);
  if (!json) return null;

  try {
    return JSON.parse(json) as VideoDetails;
  } catch {
    return null;
  }
}

function isLive(details: VideoDetails) {
  return details.isLive === true || details.isLive === 'true';
}

async function fetchLivePage(channelId: string) {
  const { data } = await axios.get<string>(
    `https://www.youtube.com/channel/${channelId}/live`,
    {
      timeout: LIVE_TIMEOUT_MS,
      maxContentLength: 2_000_000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: 'CONSENT=YES+',
      },
      validateStatus: (status) => status < 500,
    },
  );

  return typeof data === 'string' ? data : '';
}

async function getLiveStream(channelId: string): Promise<YoutubeStream | null> {
  const details = readVideoDetails(await fetchLivePage(channelId));
  if (!details?.videoId || !isLive(details)) return null;

  return {
    id: details.videoId,
    channelId,
    channelTitle: details.author || '',
    title: details.title || '',
    url: youtubeVideoUrl(details.videoId),
  };
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  const queue = items.entries();

  const worker = async () => {
    for (const [index, item] of queue) {
      results[index] = await run(item);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function getYouTubeLiveStreams(channelIds: string[]) {
  const unique = [...new Set(channelIds)];
  if (unique.length === 0) return [];

  const streams = await mapWithLimit(unique, LIVE_CONCURRENCY, async (channelId) => {
    try {
      return await getLiveStream(channelId);
    } catch {
      return null;
    }
  });

  return streams.filter((stream): stream is YoutubeStream => stream !== null);
}
