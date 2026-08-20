import type { StreamAlertRow } from '@shiva/database';
import { prisma } from './client';

export type { StreamAlertRow };

export type StreamAlertInput = {
  guildId: string;
  platform: string;
  platformId: string;
  login: string;
  displayName: string;
  channelId: string;
};

export async function findGuildStreamAlerts(
  guildId: string,
  platform: string,
): Promise<StreamAlertRow[]> {
  return prisma.streamAlert.findMany({
    where: { guildId, platform },
    orderBy: { displayName: 'asc' },
  });
}

export async function findStreamAlertsByPlatform(
  platform: string,
): Promise<StreamAlertRow[]> {
  return prisma.streamAlert.findMany({ where: { platform } });
}

export async function findStreamAlertByLogin(
  guildId: string,
  platform: string,
  login: string,
): Promise<StreamAlertRow | null> {
  return prisma.streamAlert.findFirst({ where: { guildId, platform, login } });
}

export async function countStreamAlertsExcept(
  guildId: string,
  platform: string,
  platformId: string,
): Promise<number> {
  return prisma.streamAlert.count({
    where: { guildId, platform, platformId: { not: platformId } },
  });
}

export async function upsertStreamAlert({
  guildId,
  platform,
  platformId,
  ...fields
}: StreamAlertInput) {
  await prisma.streamAlert.upsert({
    where: { guildId_platform_platformId: { guildId, platform, platformId } },
    create: { guildId, platform, platformId, ...fields },
    update: fields,
  });
}

export async function deleteStreamAlert(id: string) {
  await prisma.streamAlert.delete({ where: { id } });
}

export async function setStreamAlertVideo(id: string, lastVideoId: string | null) {
  await prisma.streamAlert.update({ where: { id }, data: { lastVideoId } });
}

export async function findStreamAlertByPlatformId(
  guildId: string,
  platform: string,
  platformId: string,
): Promise<StreamAlertRow | null> {
  return prisma.streamAlert.findUnique({
    where: { guildId_platform_platformId: { guildId, platform, platformId } },
  });
}

export async function deleteStreamAlertsByChannel(guildId: string, channelId: string) {
  await prisma.streamAlert.deleteMany({ where: { guildId, channelId } });
}
