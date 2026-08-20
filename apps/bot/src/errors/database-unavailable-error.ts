import { BotError } from './bot-error';

export class DatabaseUnavailableError extends BotError {
  constructor(cause?: unknown) {
    super('Database is unavailable.', {
      code: 'DATABASE_UNAVAILABLE',
      userMessage: 'I cannot reach my database right now. Try again in a moment.',
      cause,
    });
  }
}
