import type { Collection } from 'discord.js';
import type { BotCommand } from '../structures/command';

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, BotCommand>;
  }
}
