import type { ClientEvents } from 'discord.js';

export type BotEvent<Name extends keyof ClientEvents = keyof ClientEvents> = {
  data: {
    name: Name;
    once?: boolean;
  };
  execute: (...args: ClientEvents[Name]) => Promise<unknown> | unknown;
};

export type AnyBotEvent = {
  data: {
    name: keyof ClientEvents;
    once?: boolean;
  };
  execute: (...args: never[]) => Promise<unknown> | unknown;
};

export function defineEvent<Name extends keyof ClientEvents>(
  event: BotEvent<Name>,
): AnyBotEvent {
  return event;
}
