import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { botConfig } from './bot';

export function createClient() {
  return new Client({
    presence: botConfig.presence,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.GuildMember, Partials.User, Partials.Message, Partials.Reaction],
  });
}
