import { spawnSync } from 'child_process';
import { logger } from './services/logger';

const SCHEMA_FILE_PATH = '.prisma/nearai-cloud.schema.prisma';

export function runMigrations(isDev = true) {
  logger.info(`${'-'.repeat(40)} Start running migrations ${'-'.repeat(40)}`);

  const isUpToDate = migrateStatus(isDev);

  if (!isUpToDate) {
    migrateDeploy(isDev);
  }

  logger.info(`${'-'.repeat(40)} End running migrations    ${'-'.repeat(40)}`);
}

function migrateStatus(isDev: boolean): boolean {
  const command = spawnSync('prisma', [
    'migrate',
    'status',
    '--schema',
    SCHEMA_FILE_PATH,
  ]);

  if (command.error) {
    throw command.error;
  }

  if (isDev && command.stderr.byteLength > 0) {
    logger.error(command.stderr.toString());
  }

  if (isDev && command.stdout.byteLength > 0) {
    logger.info(command.stdout.toString());
  }

  return command.status === 0;
}

function migrateDeploy(isDev: boolean) {
  const command = spawnSync('prisma', [
    'migrate',
    'deploy',
    '--schema',
    SCHEMA_FILE_PATH,
  ]);

  if (command.error) {
    throw command.error;
  }

  if (isDev && command.stderr.byteLength > 0) {
    logger.error(command.stderr.toString());
  }

  if (isDev && command.stdout.byteLength > 0) {
    logger.info(command.stdout.toString());
  }
}
