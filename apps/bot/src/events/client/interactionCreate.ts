import { Events } from 'discord.js';
import { defineEvent } from '../../structures';
import { replyCommandError } from '../../utils/interaction';

export default defineEvent({
  data: {
    name: Events.InteractionCreate,
  },

  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      await replyCommandError(interaction, error);
    }
  },
});
