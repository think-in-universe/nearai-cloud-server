import { runServer } from './server/app';
import { sendSlackInfo } from './services/slack';
import { runMigrations } from './migrations';
import { config } from './config';

async function main() {
  runMigrations(config.isDev);
  runServer();

  await sendSlackInfo('Server started');
}

void main();
