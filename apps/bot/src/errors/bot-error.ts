export type ErrorSeverity = 'debug' | 'warn' | 'error';

export type BotErrorOptions = {
  code?: string;
  userMessage?: string;
  severity?: ErrorSeverity;
  cause?: unknown;
};

export class BotError extends Error {
  readonly code: string;
  readonly userMessage: string;
  readonly severity: ErrorSeverity;

  constructor(message: string, options: BotErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code ?? 'BOT_ERROR';
    this.userMessage = options.userMessage ?? 'Something went wrong. Please try again.';
    this.severity = options.severity ?? 'error';
  }
}
