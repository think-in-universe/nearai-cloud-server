export type Config = {
  isDev?: boolean;
  supabase: {
    apiUrl: string;
    anonKey: string;
  };
  litellm: {
    apiUrl: string;
    adminKey: string;
    dbUrl: string;
    signingKey: string;
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
