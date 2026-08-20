import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type Guild,
} from 'discord.js';
import { UserError } from '../../errors';
import { describe, guildLocale, t, type MessageKey } from '../../i18n';
import { defineCommand } from '../../structures';
import { isGuildAlertChannel } from '../../utils/discord';
import { InfoEmbed, SuccessEmbed } from '../../utils/embeds';
import {
  replyPrivately,
  runGuildSubcommand,
  type GuildSubcommand,
} from '../../utils/interaction';

type Platform = 'twitch' | 'youtube';

type StreamAlertModule = {
  addAlert: (guildId: string, query: string, channelId: string) => Promise<string>;
  removeAlert: (guildId: string, query: string) => Promise<string>;
  listAlerts: (guildId: string) => Promise<{ displayName: string; channelId: string }[]>;
  getAlertMessage: (guildId: string) => Promise<string>;
  setAlertMessage: (guild: Guild, message: string) => Promise<void>;
  previewLiveAlert: (guildId: string, query: string | null) => Promise<{ content: string }>;
};

/** `/twitch` and `/youtube` share this shape; only the target option name differs. */
export function streamAlertCommand<P extends Platform>({
  platform,
  target,
  alerts,
}: {
  platform: P;
  target: string;
  alerts: StreamAlertModule;
}) {
  const placeholders: MessageKey = `common.placeholders.${platform}`;

  const data = describe(new SlashCommandBuilder().setName(platform), `cmd.${platform}`)
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      describe(subcommand.setName('add'), `cmd.${platform}.add`)
        .addStringOption((option) =>
          describe(option.setName(target), `cmd.${platform}.add.target`).setRequired(true),
        )
        .addChannelOption((option) =>
          describe(option.setName('channel'), `cmd.${platform}.add.channel`).addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
          ),
        ),
    )
    .addSubcommand((subcommand) =>
      describe(subcommand.setName('remove'), `cmd.${platform}.remove`).addStringOption(
        (option) =>
          describe(option.setName(target), `cmd.${platform}.remove.target`).setRequired(true),
      ),
    )
    .addSubcommand((subcommand) =>
      describe(subcommand.setName('list'), `cmd.${platform}.list`),
    )
    .addSubcommand((subcommand) =>
      describe(subcommand.setName('message'), `cmd.${platform}.message`).addStringOption(
        (option) =>
          describe(option.setName('text'), `cmd.${platform}.message.text`)
            .setRequired(true)
            .setMaxLength(500),
      ),
    )
    .addSubcommand((subcommand) =>
      describe(subcommand.setName('preview'), `cmd.${platform}.preview`).addStringOption(
        (option) => describe(option.setName(target), `cmd.${platform}.preview.target`),
      ),
    );

  const subcommands: Record<string, GuildSubcommand> = {
    async add(interaction, guild) {
      const locale = await guildLocale(guild);
      const channel = interaction.options.getChannel('channel') ?? interaction.channel;
      if (!isGuildAlertChannel(channel)) {
        throw new UserError('common.textChannel');
      }

      const name = await alerts.addAlert(
        guild.id,
        interaction.options.getString(target, true),
        channel.id,
      );

      return replyPrivately(interaction, {
        embeds: [
          SuccessEmbed(
            t(locale, `${platform}.watching`, { name, channel: `<#${channel.id}>` }),
          ),
        ],
      });
    },

    async remove(interaction, guild) {
      const locale = await guildLocale(guild);
      const name = await alerts.removeAlert(
        guild.id,
        interaction.options.getString(target, true),
      );

      return replyPrivately(interaction, {
        embeds: [SuccessEmbed(t(locale, `${platform}.stopped`, { name }))],
      });
    },

    async message(interaction, guild) {
      const locale = await guildLocale(guild);
      await alerts.setAlertMessage(guild, interaction.options.getString('text', true));

      return replyPrivately(interaction, {
        embeds: [
          SuccessEmbed(
            t(locale, `${platform}.messageSet`, {
              placeholders: t(locale, placeholders),
            }),
          ),
        ],
      });
    },

    async preview(interaction, guild) {
      const payload = await alerts.previewLiveAlert(
        guild.id,
        interaction.options.getString(target),
      );

      return replyPrivately(interaction, { content: payload.content });
    },

    async list(interaction, guild) {
      const locale = await guildLocale(guild);
      const rows = await alerts.listAlerts(guild.id);
      const channels =
        rows.length > 0
          ? rows.map((row) => `• **${row.displayName}** → <#${row.channelId}>`).join('\n')
          : t(locale, `${platform}.none`);
      const message = await alerts.getAlertMessage(guild.id);

      return replyPrivately(interaction, {
        embeds: [
          InfoEmbed(`${t(locale, 'common.messageLine', { message })}\n\n${channels}`).setTitle(
            t(locale, `${platform}.listTitle`),
          ),
        ],
      });
    },
  };

  return defineCommand({
    data,
    execute: (interaction) => runGuildSubcommand(interaction, subcommands),
  });
}
