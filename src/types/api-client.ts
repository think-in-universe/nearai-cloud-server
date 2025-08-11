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
  method: 'get' | 'post';
  query?: Q;
  body?: B;
  headers?: Record<string, string | undefined>;
  responseType?: 'stream';
};

export type GetOptions<Q> = {
  path: string;
  query?: Q;
  headers?: Record<string, string | undefined>;
  responseType?: 'stream';
};

export type PostOptions<B> = {
  path: string;
  body?: B;
  headers?: Record<string, string | undefined>;
  responseType?: 'stream';
};
