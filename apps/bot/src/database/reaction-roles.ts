import type { ReactionRoleRow } from '@shiva/database';
import { prisma } from './client';

export type { ReactionRoleRow };

export type ReactionRoleInput = {
  guildId: string;
  channelId: string;
  messageId: string;
  emoji: string;
  roleId: string;
};

export async function findReactionRole(messageId: string, emoji: string) {
  return prisma.reactionRole.findUnique({
    where: { messageId_emoji: { messageId, emoji } },
  });
}

export async function findGuildReactionRoles(guildId: string): Promise<ReactionRoleRow[]> {
  return prisma.reactionRole.findMany({
    where: { guildId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function findMessageReactionRoles(messageId: string): Promise<ReactionRoleRow[]> {
  return prisma.reactionRole.findMany({
    where: { messageId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function countGuildReactionRoles(guildId: string) {
  return prisma.reactionRole.count({ where: { guildId } });
}

export async function createReactionRole(input: ReactionRoleInput) {
  return prisma.reactionRole.create({ data: input });
}

export async function deleteReactionRole(messageId: string, emoji: string) {
  const row = await findReactionRole(messageId, emoji);
  if (!row) return null;

  await prisma.reactionRole.delete({ where: { id: row.id } });
  return row;
}

export async function deleteReactionRolesByMessage(messageId: string) {
  await prisma.reactionRole.deleteMany({ where: { messageId } });
}

export async function deleteReactionRolesByRole(guildId: string, roleId: string) {
  await prisma.reactionRole.deleteMany({ where: { guildId, roleId } });
}

export async function deleteReactionRolesByChannel(guildId: string, channelId: string) {
  await prisma.reactionRole.deleteMany({ where: { guildId, channelId } });
}
