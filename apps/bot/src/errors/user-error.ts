import { BotError } from './bot-error';
import type { MessageKey } from '../i18n/en-US';

export class UserError extends BotError {
  readonly key: MessageKey;
  readonly vars: Record<string, string>;

  constructor(key: MessageKey, vars: Record<string, string> = {}) {
    super(key, { code: 'USER_ERROR', userMessage: key, severity: 'debug' });
    this.key = key;
    this.vars = vars;
  }
}
