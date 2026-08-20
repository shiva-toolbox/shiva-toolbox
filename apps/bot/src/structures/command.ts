import type {
  ChatInputCommandInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

type CommandMeta = {
  name: string;
  description: string;
  toJSON?: () => RESTPostAPIApplicationCommandsJSONBody;
};

export type CommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | CommandMeta;

export type BotCommand = {
  data: CommandData;
  execute: (interaction: ChatInputCommandInteraction) => Promise<unknown> | unknown;
};

export function defineCommand(command: BotCommand) {
  return command;
}
