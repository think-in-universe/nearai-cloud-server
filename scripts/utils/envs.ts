export const ENV_PHALA_CLOUD_API_KEY = requiredEnv('PHALA_CLOUD_API_KEY');

export const ENV_PHALA_COMPOSE_ENV_FILE_PATH = optionalEnv(
  'PHALA_COMPOSE_ENV_FILE_PATH',
);
export const ENV_PHALA_CVM_NAME = requiredEnv('PHALA_CVM_NAME');

export const ENV_PHALA_VCPU = optionalEnv('PHALA_VCPU');
export const ENV_PHALA_MEMORY = optionalEnv('PHALA_MEMORY');
export const ENV_PHALA_DISK_SIZE = optionalEnv('PHALA_DISK_SIZE');

export const ENV_PHALA_MAIN_CVM_ID = optionalEnv('PHALA_MAIN_CVM_ID');
export const ENV_PHALA_REPLICA_CVM_ID = optionalEnv('PHALA_REPLICA_CVM_ID');

function requiredEnv(name: string): string {
  const value = optionalEnv(name);
  if (value === undefined) {
    throw Error(`Missing env: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name];
}
