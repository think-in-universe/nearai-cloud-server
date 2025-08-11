import axios, { Axios } from 'axios';
import {
  ApiClientOptions,
  GetOptions,
  PostOptions,
  RequestOptions,
} from '../types/api-client';
import { ApiErrorOptions } from '../types/api-client';
import * as v from 'valibot';

export class ApiError extends Error {
  status?: number;

  type?: string | null;
  param?: string | null;
  code?: string | null;

  data?: unknown;

  constructor(options: ApiErrorOptions) {
    const schema = v.object({
      error: v.object({
        message: v.string(),
        type: v.nullable(v.string()), // Use `nullable` for LiteLLM compatibility
        param: v.nullable(v.string()),
        code: v.nullable(v.string()),
      }),
    });

    const { success, output } = v.safeParse(schema, options.data);

    const data = success ? output : undefined;

    super(data?.error.message ?? options.message);

    this.type = data?.error.type;
    this.param = data?.error.param;
    this.code = data?.error.code;

    this.data = options.data;

    this.status = options.status;

    this.name = ApiError.name;
  }
}

export abstract class ApiClient {
  protected client: Axios;

  protected constructor({ apiUrl, apiKey }: ApiClientOptions) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    });
  }

  protected async request<T, P = unknown, B = unknown>(
    options: RequestOptions<P, B>,
  ): Promise<T> {
    try {
      const res = await this.client.request<T>({
        url: options.path,
        method: options.method,
        params: options.query,
        data: options.body,
        headers: options.headers,
        responseType: options.responseType,
      });

      return res.data;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        throw new ApiError({
          status: e.status,
          message: e.message,
          data: e.response?.data,
        });
      }

      throw e;
    }
  }

  protected async get<T, P = unknown>(options: GetOptions<P>): Promise<T> {
    return this.request({
      ...options,
      method: 'get',
    });
  }

  protected async post<T, B = unknown>(options: PostOptions<B>): Promise<T> {
    return this.request({
      ...options,
      method: 'post',
    });
  }
}
