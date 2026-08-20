import { BotError } from './bot-error';

export class HandlerError extends BotError {
  constructor(message: string) {
    super(message, { code: 'HANDLER_FAILED' });
  }
}
