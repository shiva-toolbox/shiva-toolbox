import {
  ChannelType,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type SlashCommandSubcommandBuilder,
} from 'discord.js';
import { UserError } from '../../errors';
import { describe, guildLocale, localized, t } from '../../i18n';
import {
  disableMemberMessage,
  isMemberMessageKind,
  memberMessageLabel,
  previewMemberMessage,
  setMemberMessageChannel,
  setMemberMessageText,
  setMemberMessageTitle,
} from '../../modules/member-messages';
import { defineCommand } from '../../structures';
import { requireSendableChannel } from '../../utils/discord';
import { SuccessEmbed } from '../../utils/embeds';
import {
  replyPrivately,
  runGuildSubcommand,
  type GuildSubcommand,
} from '../../utils/interaction';

function addActionOption(subcommand: SlashCommandSubcommandBuilder) {
  return subcommand.addStringOption((option) =>
    describe(option.setName('action'), 'cmd.guildalert.action')
      .setRequired(true)
      .addChoices(
        {
          name: 'Join',
          name_localizations: localized('cmd.guildalert.choice.join'),
          value: 'join',
        },
        {
          name: 'Leave',
          name_localizations: localized('cmd.guildalert.choice.leave'),
          value: 'leave',
        },
      ),
  );
}

function resolveAction(interaction: ChatInputCommandInteraction) {
  const action = interaction.options.getString('action', true);
  if (!isMemberMessageKind(action)) {
    throw new UserError('guildalert.unknownAction', { action });
  }

  return action;
}

const data = describe(
  new SlashCommandBuilder()
    .setName('guildalert')
    .setNameLocalizations(localized('cmd.guildalert.localName')),
  'cmd.guildalert',
)
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((subcommand) =>
    addActionOption(
      describe(subcommand.setName('channel'), 'cmd.guildalert.channel'),
    ).addChannelOption((option) =>
      describe(
        option.setName('channel'),
        'cmd.guildalert.channel.channel',
      ).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    ),
  )
  .addSubcommand((subcommand) =>
    addActionOption(
      describe(subcommand.setName('title'), 'cmd.guildalert.title'),
    ).addStringOption((option) =>
      describe(option.setName('text'), 'cmd.guildalert.title.text')
        .setRequired(true)
        .setMaxLength(256),
    ),
  )
  .addSubcommand((subcommand) =>
    addActionOption(
      describe(subcommand.setName('message'), 'cmd.guildalert.message'),
    ).addStringOption((option) =>
      describe(option.setName('text'), 'cmd.guildalert.message.text')
        .setRequired(true)
        .setMaxLength(1000),
    ),
  )
  .addSubcommand((subcommand) =>
    addActionOption(describe(subcommand.setName('preview'), 'cmd.guildalert.preview')),
  )
  .addSubcommand((subcommand) =>
    addActionOption(describe(subcommand.setName('disable'), 'cmd.guildalert.disable')),
  );

const subcommands: Record<string, GuildSubcommand> = {
  async channel(interaction, guild) {
    const locale = await guildLocale(guild);
    const action = resolveAction(interaction);
    const channel = await requireSendableChannel(
      guild,
      interaction.options.getChannel('channel') ?? interaction.channel,
    );

    await setMemberMessageChannel(guild, action, channel.id);

    return replyPrivately(interaction, {
      embeds: [
        SuccessEmbed(
          t(locale, 'guildalert.channelSet', {
            label: memberMessageLabel(locale, action),
            channel: `<#${channel.id}>`,
          }),
        ),
      ],
    });
  },

  async title(interaction, guild) {
    const locale = await guildLocale(guild);
    const action = resolveAction(interaction);
    await setMemberMessageTitle(
      guild,
      action,
      interaction.options.getString('text', true),
    );

    return replyPrivately(interaction, {
      embeds: [
        SuccessEmbed(
          t(locale, 'guildalert.titleSet', {
            label: memberMessageLabel(locale, action),
            placeholders: t(locale, 'common.placeholders.member'),
          }),
        ),
      ],
    });
  },

  async message(interaction, guild) {
    const locale = await guildLocale(guild);
    const action = resolveAction(interaction);
    await setMemberMessageText(
      guild,
      action,
      interaction.options.getString('text', true),
    );

    return replyPrivately(interaction, {
      embeds: [
        SuccessEmbed(
          t(locale, 'guildalert.messageSet', {
            label: memberMessageLabel(locale, action),
            placeholders: t(locale, 'common.placeholders.member'),
          }),
        ),
      ],
    });
  },

  async preview(interaction, guild) {
    const locale = await guildLocale(guild);
    const member =
      interaction.member instanceof GuildMember
        ? interaction.member
        : await guild.members.fetch(interaction.user.id);

    return replyPrivately(
      interaction,
      await previewMemberMessage(guild, resolveAction(interaction), member, locale),
    );
  },

  async disable(interaction, guild) {
    const locale = await guildLocale(guild);
    const action = resolveAction(interaction);
    await disableMemberMessage(guild, action);

    return replyPrivately(interaction, {
      embeds: [
        SuccessEmbed(
          t(locale, 'guildalert.off', { label: memberMessageLabel(locale, action) }),
        ),
      ],
    });
  },
};

export default defineCommand({
  data,
  execute: (interaction) => runGuildSubcommand(interaction, subcommands),
});
