import { spawnSync } from 'child_process';
import {
  ENV_PHALA_COMPOSE_ENV_FILE_PATH,
  ENV_PHALA_MAIN_CVM_ID,
} from './utils/envs';
import { logger } from '../src/services/logger';

replicate();

function replicate() {
  if (!ENV_PHALA_MAIN_CVM_ID) {
    throw Error('Missing env: PHALA_MAIN_CVM_ID');
  }

  replicateCvm(ENV_PHALA_MAIN_CVM_ID);
}

function replicateCvm(cvmId: string) {
  const command = spawnSync(
    'phala',
    [
      'cvms',
      'replicate',
      cvmId,
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
