import { spawnSync } from 'child_process';
import {
  ENV_PHALA_CLOUD_API_KEY,
  ENV_PHALA_COMPOSE_ENV_FILE_PATH,
  ENV_PHALA_CVM_NAME,
  ENV_PHALA_DISK_SIZE,
  ENV_PHALA_MEMORY,
  ENV_PHALA_VCPU,
} from './utils/envs';
import { logger } from '../src/services/logger';

create();

function create() {
  createCvm();
}

function createCvm() {
  const command = spawnSync(
    'phala',
    [
      'deploy',
      '--api-key',
      ENV_PHALA_CLOUD_API_KEY,
      '--name',
      ENV_PHALA_CVM_NAME,
      ...(ENV_PHALA_VCPU ? ['--vcpu', ENV_PHALA_VCPU] : []),
      ...(ENV_PHALA_MEMORY ? ['--memory', ENV_PHALA_MEMORY] : []),
      ...(ENV_PHALA_DISK_SIZE ? ['--disk-size', ENV_PHALA_DISK_SIZE] : []),
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
