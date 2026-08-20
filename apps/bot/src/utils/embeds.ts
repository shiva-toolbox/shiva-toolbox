import { Colors, EmbedBuilder, type ColorResolvable, type EmbedData } from 'discord.js';
import { botConfig } from '../config/bot';

export const BaseEmbed = (
  data?: EmbedData,
  color: ColorResolvable = botConfig.embedColor,
) => new EmbedBuilder(data).setColor(color);

export const ErrorEmbed = (text: string) => BaseEmbed({ description: text }, Colors.Red);

export const SuccessEmbed = (text: string) => BaseEmbed({ description: text });

export const InfoEmbed = (text: string) => BaseEmbed({ description: text });
