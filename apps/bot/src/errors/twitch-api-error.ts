import { BotError } from './bot-error';

export class TwitchAPIError extends BotError {
  constructor(cause?: unknown) {
    super('Twitch API request failed.', {
      code: 'TWITCH_API',
      userMessage: 'Twitch is unavailable right now. Try again in a moment.',
      cause,
    });
  }
}
