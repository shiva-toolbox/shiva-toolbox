import { Events } from 'discord.js';
import { logger } from '../../config/logger';
import { defineEvent } from '../../structures';

export default defineEvent({
  data: {
    name: Events.GuildCreate,
  },

  execute(guild) {
    logger.info({ id: guild.id, name: guild.name }, 'joined guild');
  },
});
