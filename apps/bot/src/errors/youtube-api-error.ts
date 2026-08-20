import { BotError } from './bot-error';

export class YoutubeAPIError extends BotError {
  constructor(cause?: unknown) {
    super('YouTube API request failed.', {
      code: 'YOUTUBE_API',
      userMessage: 'YouTube is unavailable right now. Try again in a moment.',
      cause,
    });
  }
}
