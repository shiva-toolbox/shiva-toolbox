import { PermissionFlagsBits, Role, SlashCommandBuilder } from 'discord.js';
import { UserError } from '../../errors';
import { describe, guildLocale, localized, t } from '../../i18n';
import {
  addAutorole,
  disableAutorole,
  getAutoroleConfig,
  MAX_AUTOROLE_DELAY_SECONDS,
  removeAutorole,
  setAutoroleDelay,
} from '../../modules/autorole';
import { defineCommand } from '../../structures';
import { InfoEmbed, SuccessEmbed } from '../../utils/embeds';
import {
  replyPrivately,
  runGuildSubcommand,
  type GuildSubcommand,
} from '../../utils/interaction';

const data = describe(
  new SlashCommandBuilder()
    .setName('autorole')
    .setNameLocalizations(localized('cmd.autorole.localName')),
  'cmd.autorole',
)
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((subcommand) =>
    describe(subcommand.setName('add'), 'cmd.autorole.add').addRoleOption((option) =>
      describe(option.setName('role'), 'cmd.autorole.add.role').setRequired(true),
    ),
  )
  .addSubcommand((subcommand) =>
    describe(subcommand.setName('remove'), 'cmd.autorole.remove').addRoleOption((option) =>
      describe(option.setName('role'), 'cmd.autorole.remove.role').setRequired(true),
    ),
  )
  .addSubcommand((subcommand) =>
    describe(subcommand.setName('delay'), 'cmd.autorole.delay').addIntegerOption((option) =>
      describe(option.setName('seconds'), 'cmd.autorole.delay.seconds')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(MAX_AUTOROLE_DELAY_SECONDS),
    ),
  )
  .addSubcommand((subcommand) => describe(subcommand.setName('list'), 'cmd.autorole.list'))
  .addSubcommand((subcommand) =>
    describe(subcommand.setName('disable'), 'cmd.autorole.disable'),
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

    await addAutorole(guild, role);

    return replyPrivately(interaction, {
      embeds: [SuccessEmbed(t(locale, 'autorole.added', { role: `${role}` }))],
    });
  },

  async remove(interaction, guild) {
    const locale = await guildLocale(guild);
    const role = interaction.options.getRole('role', true);
    await removeAutorole(guild, role.id);

    return replyPrivately(interaction, {
      embeds: [SuccessEmbed(t(locale, 'autorole.removed', { role: `<@&${role.id}>` }))],
    });
  },

  async delay(interaction, guild) {
    const locale = await guildLocale(guild);
    const seconds = interaction.options.getInteger('seconds', true);
    await setAutoroleDelay(guild, seconds);

    return replyPrivately(interaction, {
      embeds: [
        SuccessEmbed(
          seconds === 0
            ? t(locale, 'autorole.instant')
            : t(locale, 'autorole.delayed', { seconds: String(seconds) }),
        ),
      ],
    });
  },

  async disable(interaction, guild) {
    const locale = await guildLocale(guild);
    await disableAutorole(guild);

    return replyPrivately(interaction, {
      embeds: [SuccessEmbed(t(locale, 'autorole.off'))],
    });
  },

  async list(interaction, guild) {
    const locale = await guildLocale(guild);
    const settings = await getAutoroleConfig(guild.id);
    const roles =
      settings.roleIds.length > 0
        ? settings.roleIds.map((id) => `• <@&${id}>`).join('\n')
        : t(locale, 'autorole.noRoles');
    const delay =
      settings.delaySeconds === 0
        ? t(locale, 'autorole.delayInstant')
        : t(locale, 'autorole.delaySeconds', { seconds: String(settings.delaySeconds) });

    return replyPrivately(interaction, {
      embeds: [
        InfoEmbed(`${t(locale, 'autorole.delayLine', { delay })}\n\n${roles}`).setTitle(
          t(locale, 'autorole.listTitle'),
        ),
      ],
    });
  },
};

export default defineCommand({
  data,
  execute: (interaction) => runGuildSubcommand(interaction, subcommands),
});
