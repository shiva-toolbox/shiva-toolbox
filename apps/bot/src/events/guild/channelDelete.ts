import { Events } from 'discord.js';
import { deleteReactionRolesByChannel, deleteStreamAlertsByChannel } from '../../database';
import { clearDeletedAlertChannel } from '../../modules/member-messages';
import { defineEvent } from '../../structures';

export default defineEvent({
  data: {
    name: Events.ChannelDelete,
  },

  execute(channel) {
    if (channel.isDMBased()) return;

    return Promise.all([
      clearDeletedAlertChannel(channel.guild, channel.id),
      deleteStreamAlertsByChannel(channel.guild.id, channel.id),
      deleteReactionRolesByChannel(channel.guild.id, channel.id),
    ]);
  },
});
