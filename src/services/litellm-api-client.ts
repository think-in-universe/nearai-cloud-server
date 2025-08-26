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
  CreateModelParams,
  UpdateModelParams,
  ListModelsPaginationParams,
  Model,
  GetModelParams,
  GenerateServiceAccountParams,
  CreateCredentialParams,
  Credential,
  UpdateCredentialParams,
  ListUsersParams,
  ListUsersResponse,
  GetUserDailyActivityParams,
  GetTagDailyActivityParams,
  DeleteModelParams,
  CreateModelResponse,
  ListModelsPaginationResponse,
  ListModelsParams,
  CreateTeamParams,
  CreateTeamResponse,
  UpdateTeamParams,
  ListTeamsParams,
  ListTeamsResponse,
} from '../types/litellm-api-client';
import { OpenAI } from 'openai/client';
import stream from 'stream';
import { config } from '../config';
import { ApiClientOptions } from '../types/api-client';
import { STATUS_CODES } from '../utils/consts';
import { ApiClient, ApiError } from './api-client';
import { litellmKeyHash } from '../utils/crypto';
import { litellmDatabaseClient } from './litellm-database-client';

export class LitellmApiClient extends ApiClient {
  constructor(options: ApiClientOptions) {
    super(options);
  }

  async registerUser({ userId, userEmail, teamId }: RegisterUserParams) {
    await this.post<
      void,
      {
        user_id?: string;
        user_email?: string;
        max_budget?: number;
        auto_create_key?: boolean;
        user_role?: string;
        team_id?: string;
      }
    >({
      path: '/user/new',
      body: {
        user_id: userId,
        user_email: userEmail,
        max_budget: 0, // no budget when user is registered until user purchases credits
        auto_create_key: false,
        user_role: 'internal_user_viewer',
        team_id: teamId,
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

  async listUsers({
    page,
    pageSize = 10,
    sortBy = 'created_at',
    sortOrder = 'desc',
  }: ListUsersParams): Promise<ListUsersResponse> {
    const {
      users,
      total,
      page: current_page,
      page_size,
      total_pages,
    } = await this.get<
      {
        users: {
          user_id: string;
          user_email: string | null;
          max_budget: number | null;
          spend: number;
        }[];
        total: number;
        page: number;
        page_size: number;
        total_pages: number;
      },
      {
        page?: number;
        page_size?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
      }
    >({
      path: '/user/list',
      query: {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    });

    return {
      users: users.map((user) => {
        return {
          userId: user.user_id,
          userEmail: user.user_email,
          maxBudget: user.max_budget,
          spend: user.spend,
        };
      }),
      totalUsers: total,
      page: current_page,
      pageSize: page_size,
      totalPages: total_pages,
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

  async createTeam({
    teamId,
    teamAlias,
    maxBudget,
    models,
  }: CreateTeamParams): Promise<CreateTeamResponse> {
    const { team_id } = await this.post<
      {
        team_id: string;
      },
      {
        team_id?: string;
        team_alias: string;
        max_budget?: number;
        models?: string[];
      }
    >({
      path: '/team/new',
      body: {
        team_id: teamId,
        team_alias: teamAlias,
        max_budget: maxBudget,
        models,
      },
    });

    return {
      teamId: team_id,
    };
  }

  async updateTeam({ teamId, teamAlias, maxBudget, models }: UpdateTeamParams) {
    await this.post<
      void,
      {
        team_id: string;
        team_alias?: string;
        max_budget?: number;
        models?: string[];
      }
    >({
      path: '/team/update',
      body: {
        team_id: teamId,
        team_alias: teamAlias,
        max_budget: maxBudget,
        models,
      },
    });
  }

  async listTeams({
    page,
    pageSize = 10,
    sortBy = 'created_at',
    sortOrder = 'desc',
  }: ListTeamsParams): Promise<ListTeamsResponse> {
    const {
      teams,
      total,
      page: current_page,
      page_size,
      total_pages,
    } = await this.get<
      {
        teams: {
          team_id: string;
          team_alias: string;
          max_budget: number | null;
          models: string[];
        }[];
        total: number;
        page: number;
        page_size: number;
        total_pages: number;
      },
      {
        page?: number;
        page_size?: number;
        sort_by?: string;
        sort_order?: string;
      }
    >({
      path: '/v2/team/list',
      query: {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    });

    return {
      teams: teams.map((team) => {
        return {
          teamId: team.team_id,
          teamAlias: team.team_alias,
          maxBudget: team.max_budget,
          models: team.models,
        };
      }),
      totalTeams: total,
      page: current_page,
      pageSize: page_size,
      totalPages: total_pages,
    };
  }

  async getUserDailyActivity({
    startDate,
    endDate,
    page,
    pageSize = 10,
  }: GetUserDailyActivityParams): Promise<Record<string, unknown>> {
    return this.get<
      Record<string, unknown>,
      {
        start_date: string;
        end_date: string;
        page?: number;
        page_size?: number;
      }
    >({
      path: '/user/daily/activity',
      query: {
        start_date: startDate,
        end_date: endDate,
        page,
        page_size: pageSize,
      },
    });
  }

  async getTagDailyActivity({
    tags,
    startDate,
    endDate,
    page,
    pageSize = 10,
  }: GetTagDailyActivityParams): Promise<Record<string, unknown>> {
    return this.get<
      Record<string, unknown>,
      {
        tags?: string;
        start_date: string;
        end_date: string;
        page?: number;
        page_size?: number;
      }
    >({
      path: '/tag/daily/activity',
      query: {
        tags: tags?.join(),
        start_date: startDate,
        end_date: endDate,
        page,
        page_size: pageSize,
      },
    });
  }

  async generateKey({
    keyType,
    userId,
    teamId,
    keyAlias,
    keyDuration,
    models,
    maxBudget,
    rpmLimit,
    tpmLimit,
    metadata,
  }: GenerateKeyParams): Promise<GenerateKeyResponse> {
    const { key, expires } = await this.post<
      {
        key: string;
        expires: string | null;
      },
      {
        key_type?: string;
        user_id?: string;
        team_id?: string;
        key_alias?: string;
        duration?: string;
        models?: string[];
        max_budget?: number;
        rpm_limit?: number;
        tpm_limit?: number;
        metadata?: Record<string, unknown>;
      }
    >({
      path: '/key/generate',
      body: {
        key_type: keyType,
        user_id: userId,
        team_id: teamId,
        key_alias: keyAlias,
        duration: keyDuration,
        models,
        max_budget: maxBudget,
        rpm_limit: rpmLimit,
        tpm_limit: tpmLimit,
        metadata,
      },
    });

    return {
      key,
      expires,
    };
  }

  async generateServiceAccount({
    keyType,
    serviceAccountId,
    teamId,
    keyAlias,
    keyDuration,
    models,
    maxBudget,
    rpmLimit,
    tpmLimit,
  }: GenerateServiceAccountParams): Promise<GenerateKeyResponse> {
    return this.generateKey({
      keyType,
      teamId,
      keyAlias,
      keyDuration,
      models,
      maxBudget,
      rpmLimit,
      tpmLimit,
      metadata: {
        service_account_id: serviceAccountId,
      },
    });
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

  async createModel({
    model,
    providerModelName,
    providerName,
    credentialName,
    inputCostPerToken,
    outputCostPerToken,
    metadata,
  }: CreateModelParams): Promise<CreateModelResponse> {
    const res = await this.post<
      {
        model_id: string;
      },
      {
        model_name: string;
        litellm_params: {
          model: string;
          custom_llm_provider: string;
          litellm_credential_name: string;
          input_cost_per_token?: number;
          output_cost_per_token?: number;
        };
        model_info: {
          nearai_metadata: {
            verifiable: boolean;
            context_length: number;
            model_full_name: string;
            model_description: string;
            model_icon: string;
          };
        };
      }
    >({
      path: '/model/new',
      body: {
        model_name: model,
        litellm_params: {
          model: providerModelName,
          custom_llm_provider: providerName,
          litellm_credential_name: credentialName,
          input_cost_per_token: inputCostPerToken,
          output_cost_per_token: outputCostPerToken,
        },
        model_info: {
          nearai_metadata: {
            verifiable: metadata.verifiable,
            context_length: metadata.contextLength,
            model_full_name: metadata.modelFullName,
            model_description: metadata.modelDescription,
            model_icon: metadata.modelIcon,
          },
        },
      },
    });

    return {
      modelId: res.model_id,
    };
  }

  async updateModel({
    modelId,
    model,
    providerModelName,
    providerName,
    credentialName,
    inputCostPerToken,
    outputCostPerToken,
    metadata,
  }: UpdateModelParams) {
    if (metadata && Object.keys(metadata).length > 0) {
      const model = await this.getModel({ modelId });

      if (!model) {
        throw new ApiError({
          status: STATUS_CODES.BAD_REQUEST,
          message: 'Model not found',
        });
      }

      metadata = Object.assign(model.metadata, metadata);
    }

    await this.patch<
      void,
      {
        model_name?: string;
        litellm_params?: {
          model?: string;
          custom_llm_provider?: string;
          litellm_credential_name?: string;
          input_cost_per_token?: number;
          output_cost_per_token?: number;
        };
        model_info: {
          nearai_metadata?: {
            verifiable?: boolean;
            context_length?: number;
            model_full_name?: string;
            model_description?: string;
            model_icon?: string;
          };
        };
      }
    >({
      path: `/model/${modelId}/update`,
      body: {
        model_name: model,
        litellm_params: {
          model: providerModelName,
          custom_llm_provider: providerName,
          litellm_credential_name: credentialName,
          input_cost_per_token: inputCostPerToken,
          output_cost_per_token: outputCostPerToken,
        },
        model_info: {
          nearai_metadata: metadata
            ? {
                verifiable: metadata.verifiable,
                context_length: metadata.contextLength,
                model_full_name: metadata.modelFullName,
                model_description: metadata.modelDescription,
                model_icon: metadata.modelIcon,
              }
            : undefined,
        },
      },
    });
  }

  async deleteModel({ modelId }: DeleteModelParams) {
    await this.post<
      void,
      {
        id: string;
      }
    >({
      path: '/model/delete',
      body: {
        id: modelId,
      },
    });
  }

  async listModelsPagination({
    page = 1,
    pageSize = 100,
  }: ListModelsPaginationParams = {}): Promise<ListModelsPaginationResponse> {
    const { models, totalModels } = await litellmDatabaseClient.listModels(
      (page - 1) * pageSize,
      pageSize,
    );

    return {
      models: models.map((model) => {
        return {
          modelId: model.model_info.id,
          model: model.model_name,
          providerModelName: model.litellm_params.model,
          providerName: model.litellm_params.custom_llm_provider,
          credentialName: model.litellm_params.litellm_credential_name,
          inputCostPerToken: model.litellm_params.input_cost_per_token,
          outputCostPerToken: model.litellm_params.output_cost_per_token,
          metadata: {
            verifiable: model.model_info.nearai_metadata?.verifiable ?? null,
            contextLength:
              model.model_info.nearai_metadata?.context_length ?? null,
            modelFullName:
              model.model_info.nearai_metadata?.model_full_name ?? null,
            modelDescription:
              model.model_info.nearai_metadata?.model_description ?? null,
            modelIcon: model.model_info.nearai_metadata?.model_icon ?? null,
          },
        };
      }),
      totalModels,
      page,
      pageSize,
      totalPages: Math.ceil(totalModels / pageSize),
    };
  }

  async listModels({ modelId }: ListModelsParams = {}): Promise<Model[]> {
    try {
      const { data: models } = await this.get<
        {
          data: {
            model_name: string;
            litellm_params: {
              model: string;
              custom_llm_provider: string;
              litellm_credential_name: string;
              input_cost_per_token: number;
              output_cost_per_token: number;
            };
            model_info: {
              id: string;
              nearai_metadata?: {
                verifiable?: boolean;
                context_length?: 163000;
                model_icon?: string;
                model_full_name?: string;
                model_description?: string;
              };
            };
          }[];
        },
        {
          litellm_model_id?: string;
        }
      >({
        path: '/model/info',
        query: {
          litellm_model_id: modelId,
        },
      });

      return models.map((model) => {
        return {
          modelId: model.model_info.id,
          model: model.model_name,
          providerModelName: model.litellm_params.model,
          providerName: model.litellm_params.custom_llm_provider,
          credentialName: model.litellm_params.litellm_credential_name,
          inputCostPerToken: model.litellm_params.input_cost_per_token,
          outputCostPerToken: model.litellm_params.output_cost_per_token,
          metadata: {
            verifiable: model.model_info.nearai_metadata?.verifiable ?? null,
            contextLength:
              model.model_info.nearai_metadata?.context_length ?? null,
            modelFullName:
              model.model_info.nearai_metadata?.model_full_name ?? null,
            modelDescription:
              model.model_info.nearai_metadata?.model_description ?? null,
            modelIcon: model.model_info.nearai_metadata?.model_icon ?? null,
          },
        };
      });
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === STATUS_CODES.BAD_REQUEST) {
        return []; // Model id not found
      }

      throw e;
    }
  }

  async getModel({ modelId }: GetModelParams): Promise<Model | null> {
    const models = await this.listModels({ modelId });
    return models[0] ?? null;
  }

  async createCredential({
    credentialName,
    providerName = 'OpenAI_Compatible',
    providerApiUrl,
    providerApiKey,
  }: CreateCredentialParams) {
    await this.post<
      void,
      {
        credential_name: string;
        credential_info: {
          custom_llm_provider: string;
        };
        credential_values: {
          api_base: string;
          api_key: string;
        };
      }
    >({
      path: '/credentials',
      body: {
        credential_name: credentialName,
        credential_info: {
          custom_llm_provider: providerName,
        },
        credential_values: {
          api_base: providerApiUrl,
          api_key: providerApiKey,
        },
      },
    });
  }

  async listCredential(): Promise<Credential[]> {
    const { credentials } = await this.get<
      {
        credentials: {
          credential_name: string;
          credential_info: {
            custom_llm_provider: string;
          };
          credential_values: {
            api_base: string;
            api_key: string;
          };
        }[];
      },
      void
    >({
      path: '/credentials',
    });

    return credentials.map((credential) => {
      return {
        credentialName: credential.credential_name,
        providerName: credential.credential_info.custom_llm_provider,
        providerApiUrl: credential.credential_values.api_base,
        providerApiKey: credential.credential_values.api_key,
      };
    });
  }

  async updateCredential({
    credentialName,
    providerName,
    providerApiUrl,
    providerApiKey,
  }: UpdateCredentialParams) {
    await this.patch<
      void,
      {
        credential_name: string;
        credential_info?: {
          custom_llm_provider?: string;
        };
        credential_values?: {
          api_base?: string;
          api_key?: string;
        };
      }
    >({
      path: `/credentials/${credentialName}`,
      body: {
        credential_name: credentialName,
        credential_info: {
          custom_llm_provider: providerName,
        },
        credential_values: {
          api_base: providerApiUrl,
          api_key: providerApiKey,
        },
      },
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
