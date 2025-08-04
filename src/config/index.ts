import { Config } from '../types/config';
import { ENV } from '../utils/envs';

const module = await import(`./${ENV}.ts`);

export const config: Config = module.default;
