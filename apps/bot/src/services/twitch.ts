import axios from 'axios';
import { env } from '../config';
import { TwitchAPIError } from '../errors';

const AUTH_URL = 'https://id.twitch.tv/oauth2/token';
const API_URL = 'https://api.twitch.tv/helix';
const STREAMS_PER_REQUEST = 100;

const TOKEN_SAFETY_WINDOW_MS = 60_000;

export type TwitchUser = {
  id: string;
  login: string;
  displayName: string;
};

export type TwitchStream = {
  id: string;
  userId: string;
  login: string;
  displayName: string;
  title: string;
  category: string;
};

type HelixUser = {
  id: string;
  login: string;
  display_name: string;
};

type HelixStream = {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  title: string;
  game_name: string;
};

const accessToken = {
  value: '',
  expiresAt: 0,
};

async function getAccessToken() {
  if (Date.now() < accessToken.expiresAt) {
    return accessToken.value;
  }

  const { data } = await axios.post<{ access_token: string; expires_in: number }>(
    AUTH_URL,
    null,
    {
      params: {
        client_id: env.TWITCH_CLIENT_ID,
        client_secret: env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
    },
  );

  accessToken.value = data.access_token;
  accessToken.expiresAt = Date.now() + data.expires_in * 1000 - TOKEN_SAFETY_WINDOW_MS;
  return accessToken.value;
}

function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

async function twitchGet<T>(path: string, query: URLSearchParams, retried = false) {
  try {
    const { data } = await axios.get<T>(`${API_URL}/${path}?${query}`, {
      headers: {
        'Client-ID': env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${await getAccessToken()}`,
      },
    });

    return data;
  } catch (error) {
    if (isUnauthorized(error) && !retried) {
      accessToken.expiresAt = 0;
      return twitchGet<T>(path, query, true);
    }

    throw new TwitchAPIError(error);
  }
}

function toTwitchUser(user: HelixUser): TwitchUser {
  return {
    id: user.id,
    login: user.login,
    displayName: user.display_name,
  };
}

function toTwitchStream(stream: HelixStream): TwitchStream {
  return {
    id: stream.id,
    userId: stream.user_id,
    login: stream.user_login,
    displayName: stream.user_name,
    title: stream.title,
    category: stream.game_name || '',
  };
}

export async function getTwitchUser(login: string) {
  const { data } = await twitchGet<{ data: HelixUser[] }>(
    'users',
    new URLSearchParams({ login }),
  );

  const user = data[0];
  return user ? toTwitchUser(user) : null;
}

export async function getLiveStreams(userIds: string[]) {
  const streams: TwitchStream[] = [];

  for (let index = 0; index < userIds.length; index += STREAMS_PER_REQUEST) {
    const query = new URLSearchParams();
    for (const id of userIds.slice(index, index + STREAMS_PER_REQUEST)) {
      query.append('user_id', id);
    }

    const { data } = await twitchGet<{ data: HelixStream[] }>('streams', query);
    streams.push(...data.map(toTwitchStream));
  }

  return streams;
}
