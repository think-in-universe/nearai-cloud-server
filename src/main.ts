import { runServer } from './server/app';
import { sendSlackInfo } from './services/slack';
import { runMigrations } from './migrations';

async function main() {
  runMigrations();
  runServer();

  await sendSlackInfo('Server started');
}

void main();
