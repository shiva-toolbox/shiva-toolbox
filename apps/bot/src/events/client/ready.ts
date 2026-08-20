import { Events, GatewayIntentBits } from 'discord.js';
import { logger } from '../../config/logger';
import { startTwitchLiveChecks } from '../../modules/twitch';
import { startYouTubeLiveChecks } from '../../modules/youtube';
import { defineEvent } from '../../structures';

export default defineEvent({
  data: {
    name: Events.ClientReady,
    once: true,
  },

  execute(client) {
    logger.info(
      {
        tag: client.user.tag,
        guilds: client.guilds.cache.size,
        guildMembersIntent: client.options.intents.has(GatewayIntentBits.GuildMembers),
      },
      'logged in',
    );

    startTwitchLiveChecks(client);
    startYouTubeLiveChecks(client);
  },
});
