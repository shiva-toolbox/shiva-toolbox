import { prisma } from '@shiva/database';
import { logger } from '../config/logger';
import { DatabaseUnavailableError } from '../errors';

export { prisma } from '@shiva/database';
export type { Prisma } from '@shiva/database';

export async function connectDatabase() {
  try {
    await prisma.$connect();
    await prisma.guild.findFirst({ select: { id: true } });
    logger.info('database connected');
  } catch (error) {
    throw new DatabaseUnavailableError(error);
  }
}

export async function closeDatabase() {
  await prisma.$disconnect().catch(() => undefined);
}
