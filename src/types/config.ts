export type Config = {
  isDev?: boolean;
  supabase: {
    apiUrl: string;
    anonKey: string;
  };
  litellm: {
    apiUrl: string;
    adminKey: string;
  };
  log: {
    level: 'debug' | 'info';
  };
  server: {
    port: number;
  };
  slack: {
    webhookUrl?: string;
  };
};
