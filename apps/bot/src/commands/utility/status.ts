import { BRAND } from '@shiva/shared';
import { SlashCommandBuilder } from 'discord.js';
import { describe, interactionLocale, t } from '../../i18n';
import { defineCommand } from '../../structures';
import { BaseEmbed } from '../../utils/embeds';
import { replyPrivately } from '../../utils/interaction';

export default defineCommand({
  data: describe(new SlashCommandBuilder().setName('status'), 'cmd.status'),

  async execute(interaction) {
    const locale = await interactionLocale(interaction);
    const embed = BaseEmbed()
      .setTitle(BRAND.name)
      .setDescription(
        [
          t(locale, 'status.tagline'),
          '',
          `• ${t(locale, 'status.autorole')}`,
          `• ${t(locale, 'status.joinLeave')}`,
          `• ${t(locale, 'status.twitch')}`,
          `• ${t(locale, 'status.youtube')}`,
          `• ${t(locale, 'status.reactionRoles')}`,
          `• ${t(locale, 'status.language')}`,
        ].join('\n'),
      );

    return replyPrivately(interaction, { embeds: [embed] });
  },
});
