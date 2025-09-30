export type ApiErrorOptions = {
  status?: number;
  message: string;
  data?: unknown;
};

export type ApiClientOptions = {
  apiUrl: string;
  apiKey: string;
};

export type RequestOptions<Q, B> = {
  path: string;
  method: 'get' | 'post' | 'patch';
  query?: Q;
  body?: B;
  headers?: Record<string, string | undefined>;
  responseType?: 'stream';
  timeout?: number;
};

export type GetOptions<Q> = {
  path: string;
  query?: Q;
  headers?: Record<string, string | undefined>;
  responseType?: 'stream';
  timeout?: number;
};

export type PostOptions<B> = {
  path: string;
  body?: B;
  headers?: Record<string, string | undefined>;
  responseType?: 'stream';
  timeout?: number;
};

export type PatchOptions<B> = {
  path: string;
  body?: B;
  headers?: Record<string, string | undefined>;
  responseType?: 'stream';
  timeout?: number;
};
