import type { GuildMember, Role } from 'discord.js';

export function whyNotAssignable(me: GuildMember, role: Role) {
  if (role.id === role.guild.id) return 'autorole.everyone' as const;
  if (role.managed) return 'autorole.managed' as const;
  if (role.position >= me.roles.highest.position) return 'autorole.hierarchy' as const;
  return null;
}
