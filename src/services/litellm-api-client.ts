import {
  RegisterUserParams,
  GenerateKeyParams,
  DeleteKeyParams,
  GenerateKeyResponse,
  ListKeysParams,
  ListKeysResponse,
  User,
  Key,
  UpdateKeyParams,
  GetSpendLogsParams,
  SpendLog,
  GetUserParams,
  GetKeyParams,
  ManageUserParams,
  KeyMetadata,
} from '../types/litellm-api-client';
import { OpenAI } from 'openai/client';
import stream from 'stream';
import { config } from '../config';
import { ApiClientOptions } from '../types/api-client';
import { STATUS_CODES } from '../utils/consts';
import { ApiClient, ApiError } from './api-client';
import { litellmKeyHash } from '../utils/crypto';

export class LitellmApiClient extends ApiClient {
  constructor(options: ApiClientOptions) {
    super(options);
  }

  async registerUser({ userId, userEmail }: RegisterUserParams) {
    await this.post<
      void,
      {
        user_id?: string;
        user_email?: string;
        max_budget?: number;
        auto_create_key?: boolean;
        user_role?: string;
      }
    >({
      path: '/user/new',
      body: {
        user_id: userId,
        user_email: userEmail,
        max_budget: 0, // no budget when user is registered until user purchases credits
        auto_create_key: false,
        user_role: 'internal_user_viewer',
      },
    });
  }

  async getUser({ userId }: GetUserParams): Promise<User | null> {
    const { user_info } = await this.get<
      {
        user_info: {
          user_id?: string;
          user_email: string | null;
          max_budget: number | null;
          spend: number;
        };
      },
      {
        user_id: string;
      }
    >({
      path: '/user/info',
      query: {
        user_id: userId,
      },
    });

    if (!user_info.user_id) {
      return null;
    }

    return {
      userId: user_info.user_id,
      userEmail: user_info.user_email,
      maxBudget: user_info.max_budget,
      spend: user_info.spend,
    };
  }

  /**
   * Update user budget. The function should only be called by service account.
   */
  async manageUser({ userId, maxBudget }: ManageUserParams) {
    await this.post<
      void,
      {
        user_id: string;
        max_budget: number | null;
      }
    >({
      path: '/user/update',
      body: {
        user_id: userId,
        max_budget: maxBudget,
      },
    });
  }

  async generateKey({
    userId,
    teamId,
    keyAlias,
    keyDuration,
    models,
    maxBudget,
    rpmLimit,
    tpmLimit,
  }: GenerateKeyParams): Promise<GenerateKeyResponse> {
    const { key, expires } = await this.post<
      {
        key: string;
        expires: string | null;
      },
      {
        user_id?: string;
        team_id?: string;
        key_alias?: string;
        duration?: string;
        models?: string[];
        max_budget?: number;
        rpm_limit?: number;
        tpm_limit?: number;
      }
    >({
      path: '/key/generate',
      body: {
        user_id: userId,
        team_id: teamId,
        key_alias: keyAlias,
        duration: keyDuration,
        models: models,
        max_budget: maxBudget,
        rpm_limit: rpmLimit,
        tpm_limit: tpmLimit,
      },
    });

    return {
      key,
      expires,
    };
  }

  async updateKey({
    keyOrKeyHash,
    keyAlias,
    maxBudget,
    blocked,
  }: UpdateKeyParams) {
    await this.post<
      void,
      {
        key: string;
        key_alias?: string;
        max_budget?: number;
        blocked?: boolean;
      }
    >({
      path: '/key/update',
      body: {
        key: litellmKeyHash(keyOrKeyHash),
        key_alias: keyAlias,
        max_budget: maxBudget,
        blocked,
      },
    });
  }

  async deleteKey({ keyOrKeyHashes, keyAliases }: DeleteKeyParams) {
    await this.post<
      void,
      {
        keys?: string[];
        key_aliases?: string[];
      }
    >({
      path: '/key/delete',
      body: {
        keys: keyOrKeyHashes?.map((keyOrKeyHash) =>
          litellmKeyHash(keyOrKeyHash),
        ),
        key_aliases: keyAliases,
      },
    });
  }

  async getKey({ keyOrKeyHash }: GetKeyParams): Promise<Key | null> {
    let keyInfo;

    try {
      keyInfo = await this.get<
        {
          key: string;
          info: {
            key_name: string;
            key_alias: string | null;
            spend: number;
            expires: string | null;
            models: string[];
            user_id: string;
            team_id: string | null;
            rpm_limit: number | null;
            tpm_limit: number | null;
            budget_id: string | null;
            max_budget: number | null;
            budget_duration: string | null;
            budget_reset_at: string | null;
            blocked: boolean | null;
            created_at: string;
            metadata: KeyMetadata;
          };
        },
        {
          key: string | undefined;
        }
      >({
        path: '/key/info',
        query: {
          key: litellmKeyHash(keyOrKeyHash),
        },
      });
    } catch (e: unknown) {
      if (
        e instanceof ApiError &&
        e.code === STATUS_CODES.NOT_FOUND.toString()
      ) {
        return null;
      }

      throw e;
    }

    return {
      keyHash: keyInfo.key,
      keyName: keyInfo.info.key_name,
      keyAlias: keyInfo.info.key_alias,
      spend: keyInfo.info.spend,
      expires: keyInfo.info.expires,
      models: keyInfo.info.models,
      userId: keyInfo.info.user_id,
      teamId: keyInfo.info.team_id,
      rpmLimit: keyInfo.info.rpm_limit,
      tpmLimit: keyInfo.info.tpm_limit,
      budgetId: keyInfo.info.budget_id,
      maxBudget: keyInfo.info.max_budget,
      budgetDuration: keyInfo.info.budget_duration,
      budgetResetAt: keyInfo.info.budget_reset_at,
      blocked: keyInfo.info.blocked,
      createdAt: keyInfo.info.created_at,
      metadata: keyInfo.info.metadata,
    };
  }

  async listKeys({
    userId,
    page,
    pageSize = 10,
    sortBy = 'created_at',
    sortOrder = 'desc',
  }: ListKeysParams): Promise<ListKeysResponse> {
    const { keys, total_count, current_page, total_pages } = await this.get<
      {
        keys: {
          token: string;
          key_name: string;
          key_alias: string | null;
          spend: number;
          expires: string | null;
          models: string[];
          user_id: string;
          team_id: string | null;
          rpm_limit: number | null;
          tpm_limit: number | null;
          max_budget: number | null;
          budget_duration: string | null;
          budget_reset_at: string | null;
          blocked: boolean | null;
          created_at: string;
          metadata: KeyMetadata;
        }[];
        total_count: number;
        current_page: number;
        total_pages: number;
      },
      {
        user_id?: string;
        page?: number;
        size?: number;
        return_full_object?: boolean;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
      }
    >({
      path: '/key/list',
      query: {
        user_id: userId,
        page: page,
        size: pageSize,
        return_full_object: true,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    });

    return {
      keys: keys.map((key) => ({
        keyHash: key.token,
        keyName: key.key_name,
        keyAlias: key.key_alias,
        spend: key.spend,
        expires: key.expires,
        models: key.models,
        userId: key.user_id,
        teamId: key.team_id,
        rpmLimit: key.rpm_limit,
        tpmLimit: key.tpm_limit,
        budgetId: null, // TODO: Doesn't exist in the response. Keeping it `null` will confuse users if the id does exist
        maxBudget: key.max_budget,
        budgetDuration: key.budget_duration,
        budgetResetAt: key.budget_reset_at,
        blocked: key.blocked,
        createdAt: key.created_at,
        metadata: key.metadata,
      })),
      totalKeys: total_count,
      page: current_page,
      pageSize,
      totalPages: total_pages,
    };
  }

  async getSpendLogs({
    userId,
    keyOrKeyHash,
    startDate,
    endDate,
  }: GetSpendLogsParams): Promise<SpendLog[]> {
    const logs = await this.get<
      {
        request_id: string;
        user: string;
        api_key: string;
        status: string;
        call_type: string;
        spend: number;
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        model_id: string;
        model_group: string;
        startTime: string;
        endTime: string;
      }[],
      {
        user_id?: string;
        api_key?: string;
        start_date?: string;
        end_date?: string;
        summarize?: boolean;
      }
    >({
      path: '/spend/logs',
      query: {
        user_id: userId,
        api_key: keyOrKeyHash ? litellmKeyHash(keyOrKeyHash) : undefined,
        start_date: startDate,
        end_date: endDate,
        summarize: false,
      },
    });

    return logs.map((log) => {
      return {
        requestId: log.request_id,
        userId: log.user,
        keyHash: log.api_key,
        status: log.status,
        callType: log.call_type,
        spend: log.spend,
        promptTokens: log.prompt_tokens,
        completionTokens: log.completion_tokens,
        totalTokens: log.total_tokens,
        modelId: log.model_id,
        model: log.model_group,
        startTime: log.startTime,
        endTime: log.endTime,
      };
    });
  }

  async chatCompletions(
    params: OpenAI.ChatCompletionCreateParams,
  ): Promise<OpenAI.ChatCompletion | stream.Readable> {
    return this.post({
      path: '/chat/completions',
      body: params,
      responseType: params.stream ? 'stream' : undefined,
    });
  }

  async models(): Promise<OpenAI.PageResponse<OpenAI.Model>> {
    return this.get({
      path: '/models',
    });
  }
}

export function createLitellmApiClient(
  apiKey: string,
  apiUrl: string = config.litellm.apiUrl,
): LitellmApiClient {
  return new LitellmApiClient({
    apiUrl,
    apiKey,
  });
}

export const adminLitellmApiClient = createLitellmApiClient(
  config.litellm.adminKey,
);
