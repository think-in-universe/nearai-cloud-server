import { Config } from '../types/config';
import {
  ENV_SERVER_PORT,
  ENV_SUPABASE_API_URL,
  ENV_SUPABASE_ANON_KEY,
  ENV_SLACK_WEBHOOK_URL,
  ENV_LITELLM_API_URL,
  ENV_LITELLM_ADMIN_KEY,
} from '../utils/envs';

const config: Config = {
  isDev: true,
  supabase: {
    apiUrl: ENV_SUPABASE_API_URL,
    anonKey: ENV_SUPABASE_ANON_KEY,
  },
  litellm: {
    apiUrl: ENV_LITELLM_API_URL,
    adminKey: ENV_LITELLM_ADMIN_KEY,
  },
  log: {
    level: 'debug',
  },
  server: {
    port: ENV_SERVER_PORT,
  },
  slack: {
    webhookUrl: ENV_SLACK_WEBHOOK_URL,
  },
};

export default config;
