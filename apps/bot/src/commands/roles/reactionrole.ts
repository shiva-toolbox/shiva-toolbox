import { ChannelType, PermissionFlagsBits, Role, SlashCommandBuilder } from 'discord.js';
import { UserError } from '../../errors';
import { describe, guildLocale, localized, t } from '../../i18n';
import {
  addReactionRole,
  displayEmoji,
  listReactionRoles,
  removeReactionRoleMapping,
} from '../../modules/reaction-roles';
import { defineCommand } from '../../structures';
import { requireTextChannel } from '../../utils/discord';
import { InfoEmbed, SuccessEmbed } from '../../utils/embeds';
import {
  replyPrivately,
  runGuildSubcommand,
  type GuildSubcommand,
} from '../../utils/interaction';

const data = describe(
  new SlashCommandBuilder()
    .setName('reactionrole')
    .setNameLocalizations(localized('cmd.reactionrole.localName')),
  'cmd.reactionrole',
)
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((subcommand) =>
    describe(subcommand.setName('add'), 'cmd.reactionrole.add')
      .addRoleOption((option) =>
        describe(option.setName('role'), 'cmd.reactionrole.add.role').setRequired(true),
      )
      .addStringOption((option) =>
        describe(option.setName('emoji'), 'cmd.reactionrole.add.emoji').setRequired(true),
      )
      .addChannelOption((option) =>
        describe(option.setName('channel'), 'cmd.reactionrole.add.channel').addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement,
        ),
      )
      .addStringOption((option) =>
        describe(option.setName('message'), 'cmd.reactionrole.add.message'),
      ),
  )
  .addSubcommand((subcommand) =>
    describe(subcommand.setName('remove'), 'cmd.reactionrole.remove')
      .addStringOption((option) =>
        describe(option.setName('message'), 'cmd.reactionrole.remove.message').setRequired(
          true,
        ),
      )
      .addStringOption((option) =>
        describe(option.setName('emoji'), 'cmd.reactionrole.remove.emoji').setRequired(true),
      )
      .addChannelOption((option) =>
        describe(
          option.setName('channel'),
          'cmd.reactionrole.remove.channel',
        ).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      ),
  )
  .addSubcommand((subcommand) =>
    describe(subcommand.setName('list'), 'cmd.reactionrole.list'),
  );

const subcommands: Record<string, GuildSubcommand> = {
  async add(interaction, guild) {
    const locale = await guildLocale(guild);
    const option = interaction.options.getRole('role', true);
    const role =
      option instanceof Role
        ? option
        : await guild.roles.fetch(option.id).catch(() => null);
    if (!role) {
      throw new UserError('common.roleNotFound');
    }

    const { emoji } = await addReactionRole(guild, {
      role,
      emoji: interaction.options.getString('emoji', true),
      channel: await requireTextChannel(
        guild,
        interaction.options.getChannel('channel') ?? interaction.channel,
      ),
      messageId: interaction.options.getString('message'),
    });

    return replyPrivately(interaction, {
      embeds: [SuccessEmbed(t(locale, 'reactionRole.added', { emoji, role: `${role}` }))],
    });
  },

  async remove(interaction, guild) {
    const locale = await guildLocale(guild);
    const emoji = await removeReactionRoleMapping(guild, {
      channel: await requireTextChannel(
        guild,
        interaction.options.getChannel('channel') ?? interaction.channel,
      ),
      messageId: interaction.options.getString('message', true),
      emoji: interaction.options.getString('emoji', true),
    });

    return replyPrivately(interaction, {
      embeds: [SuccessEmbed(t(locale, 'reactionRole.removed', { emoji }))],
    });
  },

  async list(interaction, guild) {
    const locale = await guildLocale(guild);
    const rows = await listReactionRoles(guild.id);
    const body =
      rows.length > 0
        ? rows
            .map((row) => {
              const link = `https://discord.com/channels/${guild.id}/${row.channelId}/${row.messageId}`;
              return `• ${displayEmoji(row.emoji)} <@&${row.roleId}> → ${link}`;
            })
            .join('\n')
        : t(locale, 'reactionRole.none');

    return replyPrivately(interaction, {
      embeds: [InfoEmbed(body).setTitle(t(locale, 'reactionRole.listTitle'))],
    });
  },
};

export default defineCommand({
  data,
  execute: (interaction) => runGuildSubcommand(interaction, subcommands),
});
