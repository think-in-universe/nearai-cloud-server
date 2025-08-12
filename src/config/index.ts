import { Config } from '../types/config';
import { ENV } from '../utils/envs';
import devConfig from './dev';
import prdConfig from './prd';

function getConfig(): Config {
  switch (ENV) {
    case 'dev':
      return devConfig;
    case 'prd':
      return prdConfig;
    default:
      throw new Error(`Unknown environment: ${ENV}`);
  }
}

export const config = getConfig();
