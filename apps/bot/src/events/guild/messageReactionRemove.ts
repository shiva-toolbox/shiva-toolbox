import { Events } from 'discord.js';
import { applyReactionRole } from '../../modules/reaction-roles';
import { defineEvent } from '../../structures';
import { logError } from '../../utils/error-handling';

export default defineEvent({
  data: {
    name: Events.MessageReactionRemove,
  },

  async execute(reaction, user) {
    if (user.bot) return;

    if (reaction.partial) {
      const fetched = await reaction.fetch().catch(() => null);
      if (!fetched) return;
    }

    const message = reaction.message.partial
      ? await reaction.message.fetch().catch(() => null)
      : reaction.message;
    if (!message?.guild) return;

    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    try {
      await applyReactionRole(reaction, member, false);
    } catch (error) {
      logError(error, 'reaction role remove failed', {
        guildId: message.guild.id,
        messageId: message.id,
        userId: user.id,
      });
    }
  },
});
