import { Events } from 'discord.js';
import { assignAutoroles } from '../../modules/autorole';
import { announceMemberMessage } from '../../modules/member-messages';
import { defineEvent } from '../../structures';
import { allowMemberEvent } from '../../utils/member-flood';

export default defineEvent({
  data: {
    name: Events.GuildMemberAdd,
  },

  execute(member) {
    if (!allowMemberEvent(member.guild.id, member.id, 'join')) return;

    return Promise.all([
      announceMemberMessage(member, 'join'),
      assignAutoroles(member),
    ]);
  },
});
