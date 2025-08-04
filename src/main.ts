import { runServer } from './server/app';
import { sendSlackInfo } from './services/slack';

async function main() {
  runServer();
  await sendSlackInfo('Server started');
}

await main();
