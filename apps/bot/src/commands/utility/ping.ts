import { SlashCommandBuilder } from 'discord.js';
import { describe, interactionLocale, t } from '../../i18n';
import { defineCommand } from '../../structures';
import { BaseEmbed } from '../../utils/embeds';
import { replyPrivately } from '../../utils/interaction';

export default defineCommand({
  data: describe(new SlashCommandBuilder().setName('ping'), 'cmd.ping'),

  async execute(interaction) {
    const locale = await interactionLocale(interaction);
    const embed = BaseEmbed()
      .setTitle(t(locale, 'ping.title'))
      .addFields(
        {
          name: t(locale, 'ping.latency'),
          value: `${Date.now() - interaction.createdTimestamp}ms`,
          inline: true,
        },
        {
          name: t(locale, 'ping.api'),
          value: `${interaction.client.ws.ping}ms`,
          inline: true,
        },
      );

    return replyPrivately(interaction, { embeds: [embed] });
  },
});
