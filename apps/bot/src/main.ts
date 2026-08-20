import { createClient, env, logger } from './config';
import { closeDatabase, connectDatabase } from './database';
import { loadCommands } from './handlers/commands';
import { deployCommands } from './handlers/deploy';
import { loadEvents } from './handlers/events';
import { logError } from './utils/error-handling';
import { listenForShutdown } from './utils/shutdown';

async function main() {
  const client = createClient();

  client.on('error', (error) => {
    logError(error, 'discord client error');
  });

  listenForShutdown(client);

  try {
    await connectDatabase();
    await loadCommands(client);
    await loadEvents(client);
    
    await client.login(env.DISCORD_TOKEN);

    await deployCommands(client);
  } catch (error) {
    logger.fatal({ err: error }, 'failed to start the bot');
    await client.destroy().catch(() => undefined);
    await closeDatabase();
    process.exit(1);
  }
}

void main();
