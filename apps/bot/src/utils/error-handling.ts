import axios from 'axios';
import { DEFAULT_LOCALE, type Locale } from '@shiva/shared';
import { logger } from '../config/logger';
import { BotError, UserError } from '../errors';
import { t, type MessageKey } from '../i18n';
import { isMissingPermissionsError } from './discord';

const NETWORK_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

const CODE_KEYS: Record<string, MessageKey> = {
  TWITCH_API: 'errors.twitchUnavailable',
  YOUTUBE_API: 'errors.youtubeUnavailable',
  DATABASE_UNAVAILABLE: 'errors.databaseUnavailable',
};

function isNetworkError(error: unknown) {
  if (axios.isAxiosError(error)) return !error.response;
  if (!(error instanceof Error)) return false;

  const code = 'code' in error ? String(error.code) : '';
  return NETWORK_CODES.has(code) || error.message.toLowerCase().includes('fetch failed');
}

export function userMessageFromError(error: unknown, locale: Locale = DEFAULT_LOCALE) {
  if (error instanceof UserError) return t(locale, error.key, error.vars);

  if (error instanceof BotError) {
    const key = CODE_KEYS[error.code];
    if (key) return t(locale, key);
  }
  if (isMissingPermissionsError(error)) return t(locale, 'common.missingPermissions');
  if (isNetworkError(error)) return t(locale, 'common.network');
  return t(locale, 'common.generic');
}

export function logError(
  error: unknown,
  message: string,
  context: Record<string, unknown> = {},
) {
  const payload = { ...context, err: error };
  const severity = error instanceof BotError ? error.severity : 'error';

  if (severity === 'debug') {
    logger.debug(payload, message);
    return;
  }

  if (severity === 'warn') {
    logger.warn(payload, message);
    return;
  }

  logger.error(payload, message);
}
