import { isLocale } from '@shiva/shared';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { setGuildLocale } from '../../database';
import { describe, localized, t } from '../../i18n';
import { defineCommand } from '../../structures';
import { SuccessEmbed } from '../../utils/embeds';
import { replyPrivately, requireGuild } from '../../utils/interaction';

const data = describe(
  new SlashCommandBuilder()
    .setName('language')
    .setNameLocalizations(localized('cmd.language.localName')),
  'cmd.language',
)
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((option) =>
    describe(
      option.setName('locale').setNameLocalizations(localized('cmd.language.locale.localName')),
      'cmd.language.locale',
    )
      .setRequired(true)
      .addChoices(
        {
          name: 'English',
          name_localizations: localized('cmd.language.choice.en'),
          value: 'en-US',
        },
        {
          name: 'Português',
          name_localizations: localized('cmd.language.choice.pt'),
          value: 'pt-BR',
        },
      ),
  );

export default defineCommand({
  data,
  async execute(interaction) {
    const guild = requireGuild(interaction);
    const locale = interaction.options.getString('locale', true);
    if (!isLocale(locale)) return;

    await setGuildLocale(guild, locale);
    const name = t(
      locale,
      locale === 'en-US' ? 'language.name.en-US' : 'language.name.pt-BR',
    );

    return replyPrivately(interaction, {
      embeds: [SuccessEmbed(t(locale, 'language.set', { locale: name }))],
    });
  },
});
