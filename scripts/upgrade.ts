import { spawnSync } from 'child_process';
import {
  ENV_PHALA_CLOUD_API_KEY,
  ENV_PHALA_COMPOSE_ENV_FILE_PATH,
  ENV_PHALA_MAIN_CVM_ID,
  ENV_PHALA_REPLICA_CVM_ID,
} from './utils/envs';
import { getCvmStatus } from './utils/phala';
import { sleep } from './utils/common';
import { logger } from '../src/services/logger';

void upgrade();

async function upgrade() {
  if (!ENV_PHALA_MAIN_CVM_ID) {
    throw Error('Missing env: PHALA_MAIN_CVM_ID');
  }

  if (!ENV_PHALA_REPLICA_CVM_ID) {
    throw Error('Missing env: PHALA_REPLICA_CVM_ID');
  }

  console.log(
    '-------------------- Start to upgrade main CVM --------------------',
  );
  await upgradeCvm(ENV_PHALA_MAIN_CVM_ID);

  console.log(
    '-------------------- Start to upgrade replica CVM -----------------',
  );
  await upgradeCvm(ENV_PHALA_REPLICA_CVM_ID);

  console.log('All CVMs are successfully upgraded');
}

async function upgradeCvm(cvmId: string) {
  const initCvmStatus = await getCvmStatus(cvmId);

  // TODO: Maybe issue: CVM status keeps `starting` when the CVM fails to start
  if (!['starting', 'running', 'stopped'].includes(initCvmStatus)) {
    throw Error(
      `Unexpected CVM (${cvmId}) status (${initCvmStatus}) to upgrade`,
    );
  }

  requestUpgradeCvm(cvmId);

  let cvmStatusChanged = false;

  while (true) {
    const cvmStatus = await getCvmStatus(cvmId);

    if (!cvmStatusChanged && cvmStatus === initCvmStatus) {
      console.log(`CVM (${cvmId}) is preparing...`);
      await sleep(2 * 1000);
      continue;
    }

    cvmStatusChanged = true;

    if (cvmStatus === 'stopping') {
      console.log(`CVM (${cvmId}) is stopping...`);
      await sleep(2 * 1000);
      continue;
    }

    if (cvmStatus === 'stopped') {
      console.log(`CVM (${cvmId}) is stopped...`);
      await sleep(2 * 1000);
      continue;
    }

    if (cvmStatus === 'starting') {
      console.log(`CVM (${cvmId}) is restarting...`);
      await sleep(2 * 1000);
      continue;
    }

    if (cvmStatus === 'running') {
      console.log(`CVM (${cvmId}) is running...`);
      break;
    }

    throw Error(`CVM status has changed to an unexpected state: ${cvmStatus}`);
  }

  console.log(`\nCVM (${cvmId}) is successfully upgraded\n`);
}

function requestUpgradeCvm(cvmId: string) {
  const command = spawnSync(
    'phala',
    [
      'deploy',
      '--api-key',
      ENV_PHALA_CLOUD_API_KEY,
      '--uuid',
      cvmId,
      '--compose',
      'docker-compose.yaml',
      ...(ENV_PHALA_COMPOSE_ENV_FILE_PATH
        ? ['--env-file', ENV_PHALA_COMPOSE_ENV_FILE_PATH]
        : []),
    ],
    {
      encoding: 'utf-8',
    },
  );

  if (command.error) {
    throw command.error;
  }

  if (command.stdout.length > 0) {
    console.log(command.stdout);
  }

  if (command.stderr.length > 0) {
    logger.error(command.stderr);
  }

  if (command.status !== 0) {
    throw Error(`Command exited with code ${command.status}`);
  }
}
