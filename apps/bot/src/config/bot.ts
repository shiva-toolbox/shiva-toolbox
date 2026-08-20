import { ActivityType, PresenceUpdateStatus } from 'discord.js';

export const botConfig = {
  embedColor: 0x7ee0c9,
  presence: {
    status: PresenceUpdateStatus.Idle,
    activities: [
      { name: 'Destruction yields transformation.', type: ActivityType.Watching },
    ],
  },
} as const;
