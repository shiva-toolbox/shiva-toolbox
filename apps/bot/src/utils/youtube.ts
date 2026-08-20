const CHANNEL_ID = /^UC[\w-]{22}$/;
const HANDLE = /^[a-zA-Z0-9._-]{3,30}$/;
const VIDEO_ID = /^[\w-]{11}$/;

export type YouTubeRef =
  | { kind: 'id'; value: string }
  | { kind: 'handle'; value: string }
  | { kind: 'user'; value: string }
  | { kind: 'custom'; value: string }
  | { kind: 'video'; value: string };

function stripUrl(input: string) {
  return input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/i, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '');
}

export function parseYouTubeChannel(input: string): YouTubeRef | null {
  const raw = input.trim();
  if (!raw) return null;

  const videoFromQuery = raw.match(/[?&]v=([\w-]{11})/i)?.[1];
  if (videoFromQuery) return { kind: 'video', value: videoFromQuery };

  const youtuBe = raw.match(/(?:youtu\.be\/)([\w-]{11})/i)?.[1];
  if (youtuBe) return { kind: 'video', value: youtuBe };

  const stripped = stripUrl(raw).replace(/^youtube\.com\//i, '');

  const channelId = stripped.match(/^channel\/(UC[\w-]{22})/i)?.[1];
  if (channelId) return { kind: 'id', value: channelId };

  const handle = stripped.match(/^@([a-zA-Z0-9._-]{3,30})/i)?.[1];
  if (handle) return { kind: 'handle', value: handle.toLowerCase() };

  const user = stripped.match(/^user\/([a-zA-Z0-9._-]{3,30})/i)?.[1];
  if (user) return { kind: 'user', value: user };

  const custom = stripped.match(/^c\/([a-zA-Z0-9._-]{3,30})/i)?.[1];
  if (custom) return { kind: 'custom', value: custom };

  if (raw.startsWith('@') && HANDLE.test(raw.slice(1))) {
    return { kind: 'handle', value: raw.slice(1).toLowerCase() };
  }

  if (CHANNEL_ID.test(raw)) return { kind: 'id', value: raw };
  if (VIDEO_ID.test(raw)) return { kind: 'video', value: raw };
  if (HANDLE.test(raw)) return { kind: 'handle', value: raw.toLowerCase() };

  return null;
}

export function youtubeChannelUrl(channelId: string, handle?: string | null) {
  if (handle && !handle.startsWith('UC')) return `https://www.youtube.com/@${handle}`;
  return `https://www.youtube.com/channel/${channelId}`;
}

export function youtubeVideoUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
