import { Events } from 'discord.js';
import { cancelAutorole } from '../../modules/autorole';
import { announceMemberMessage } from '../../modules/member-messages';
import { defineEvent } from '../../structures';
import { allowMemberEvent } from '../../utils/member-flood';

export default defineEvent({
  data: {
    name: Events.GuildMemberRemove,
  },

  execute(member) {
    cancelAutorole(member.guild.id, member.id);

    if (!allowMemberEvent(member.guild.id, member.id, 'leave')) return;

    return announceMemberMessage(member, 'leave');
  },
});
