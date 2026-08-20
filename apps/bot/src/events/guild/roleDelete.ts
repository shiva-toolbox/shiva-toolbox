import { Events } from 'discord.js';
import { deleteReactionRolesByRole } from '../../database';
import { removeDeletedAutorole } from '../../modules/autorole';
import { defineEvent } from '../../structures';

export default defineEvent({
  data: {
    name: Events.GuildRoleDelete,
  },

  execute(role) {
    return Promise.all([
      removeDeletedAutorole(role.guild, role.id),
      deleteReactionRolesByRole(role.guild.id, role.id),
    ]);
  },
});
