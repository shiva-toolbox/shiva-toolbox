import { Events } from 'discord.js';
import { deleteReactionRolesByMessage } from '../../database';
import { defineEvent } from '../../structures';

export default defineEvent({
  data: {
    name: Events.MessageDelete,
  },

  execute(message) {
    return deleteReactionRolesByMessage(message.id);
  },
});
