import { PrismaClient } from '../../.prisma/generated/litellm';
import { litellmDecryptValue } from '../utils/crypto';
import * as v from 'valibot';
import {
  InternalModelParams,
  LitellmCredentialValues,
  LitellmProxyModel,
  LiteLLMSpendLog,
} from '../types/litellm-database-client';
import { InMemoryCache } from '../utils/InMemoryCache';
import {
  ROUTER_SETTINGS_CACHE_KEY,
  ROUTER_SETTINGS_CACHE_TTL,
} from '../utils/consts';

const routerSettingsSchema = v.object({
  model_group_alias: v.optional(
    v.record(
      v.string(),
      v.nullish(
        v.union([
          v.string(),
          v.object({
            model: v.string(),
            hidden: v.optional(v.boolean()),
          }),
        ]),
      ),
    ),
  ),
});

type RouterSettings = v.InferOutput<typeof routerSettingsSchema>;

export class LitellmDatabaseClient {
  private client: PrismaClient;
  private routerSettingsCache: InMemoryCache<RouterSettings>;

  constructor() {
    this.client = new PrismaClient();
    this.routerSettingsCache = new InMemoryCache(ROUTER_SETTINGS_CACHE_TTL);
  }

  async getModelIdByChatId(chatId: string): Promise<string | null> {
    const log = await this.client.liteLLM_SpendLogs.findUnique({
      where: {
        request_id: chatId,
      },
    });

    if (!log) {
      return null;
    }

    return log.model_id;
  }

  async getInternalModelParams(
    modelId: string,
  ): Promise<InternalModelParams | null> {
    const proxyModel = await this.client.liteLLM_ProxyModelTable.findUnique({
      where: {
        model_id: modelId,
      },
    });

    if (!proxyModel) {
      return null;
    }

    return await this.extractInternalModelParams(proxyModel);
  }

  async listInternalModelParams(
    modelName: string,
  ): Promise<InternalModelParams[]> {
    const proxyModels = await this.client.liteLLM_ProxyModelTable.findMany({
      where: {
        model_name: modelName,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    const internalModelParams: InternalModelParams[] = [];

    for (const proxyModel of proxyModels) {
      internalModelParams.push(
        await this.extractInternalModelParams(proxyModel),
      );
    }

    return internalModelParams;
  }

  private async extractInternalModelParams(proxyModel: {
    model_id: string;
    litellm_params: unknown;
  }): Promise<InternalModelParams> {
    const params = v.parse(
      v.object({
        model: v.string(),
        api_base: v.optional(v.string()),
        api_key: v.optional(v.string()),
        litellm_credential_name: v.optional(v.string()),
      }),
      proxyModel.litellm_params,
    );

    const model = litellmDecryptValue(params.model);

    if (params.api_base && params.api_key) {
      return {
        modelId: proxyModel.model_id,
        model,
        apiUrl: litellmDecryptValue(params.api_base),
        apiKey: litellmDecryptValue(params.api_key),
      };
    } else if (params.litellm_credential_name) {
      const credentialName = litellmDecryptValue(
        params.litellm_credential_name,
      );

      const credentialValues = await this.getCredentialValues(credentialName);

      if (!credentialValues) {
        throw Error(
          `Credential (${params.litellm_credential_name}) values not found`,
        );
      }

      return {
        modelId: proxyModel.model_id,
        model,
        apiUrl: credentialValues.apiUrl,
        apiKey: credentialValues.apiKey,
      };
    } else {
      throw Error(`Bad 'litellm_params'`);
    }
  }

  private async getCredentialValues(
    credentialName: string,
  ): Promise<LitellmCredentialValues | null> {
    const credential = await this.client.liteLLM_CredentialsTable.findFirst({
      where: {
        credential_name: credentialName,
      },
    });

    if (!credential) {
      return null;
    }

    const credentialValues = v.parse(
      v.object({
        api_base: v.string(),
        api_key: v.string(),
      }),
      credential.credential_values,
    );

    return {
      apiUrl: litellmDecryptValue(credentialValues.api_base),
      apiKey: litellmDecryptValue(credentialValues.api_key),
    };
  }

  async getModelIdByName(modelName: string): Promise<string | null> {
    const proxyModel = await this.client.liteLLM_ProxyModelTable.findFirst({
      where: {
        model_name: modelName,
      },
    });

    if (!proxyModel) {
      return null;
    }

    return proxyModel.model_id;
  }

  async listModels({
    offset,
    limit,
  }: {
    offset: number;
    limit: number;
  }): Promise<{
    models: LitellmProxyModel[];
    totalModels: number;
  }> {
    const proxyModels = await this.client.liteLLM_ProxyModelTable.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      distinct: 'model_name',
    });

    const [{ count: totalModels }] = await this.client.$queryRaw<
      { count: bigint }[]
    >`
      SELECT COUNT(DISTINCT model_name) from "LiteLLM_ProxyModelTable";
    `;

    const schema = v.array(
      v.object({
        model_id: v.string(),
        model_name: v.string(),
        litellm_params: v.object({
          model: v.pipe(
            v.string(),
            v.transform((model) => litellmDecryptValue(model)),
          ),
          custom_llm_provider: v.pipe(
            v.string(),
            v.transform((provider) => litellmDecryptValue(provider)),
          ),
          litellm_credential_name: v.optional(
            v.pipe(
              v.string(),
              v.transform((credentialName) =>
                litellmDecryptValue(credentialName),
              ),
            ),
          ),
          input_cost_per_token: v.optional(v.number(), 0),
          output_cost_per_token: v.optional(v.number(), 0),
        }),
        model_info: v.object({
          id: v.string(),
          nearai_metadata: v.optional(
            v.object({
              verifiable: v.optional(v.boolean()),
              context_length: v.optional(v.number()),
              model_icon: v.optional(v.string()),
              model_full_name: v.optional(v.string()),
              model_description: v.optional(v.string()),
            }),
          ),
        }),
      }),
    );

    return {
      models: v.parse(schema, proxyModels),
      totalModels: Number(totalModels),
    };
  }

  async getSpendLogs({
    userId,
    keyHash,
    startDate,
    endDate,
    offset,
    limit,
  }: {
    userId: string;
    keyHash?: string;
    startDate?: string;
    endDate?: string;
    offset?: number;
    limit?: number;
  }): Promise<{
    spendLogs: LiteLLMSpendLog[];
    totalSpendLogs: number;
  }> {
    const [spendLogs, totalSpendLogs] = await Promise.all([
      this.client.liteLLM_SpendLogs.findMany({
        skip: offset,
        take: limit,
        where: {
          user: userId,
          api_key: keyHash,
          startTime: {
            gte: startDate ? new Date(startDate) : undefined,
            lt: endDate ? new Date(endDate) : undefined,
          },
        },
        orderBy: {
          startTime: 'desc',
        },
      }),
      this.client.liteLLM_SpendLogs.count({
        where: {
          user: userId,
          api_key: keyHash,
          startTime: {
            gte: startDate ? new Date(startDate) : undefined,
            lt: endDate ? new Date(endDate) : undefined,
          },
        },
      }),
    ]);

    const schema = v.array(
      v.object({
        request_id: v.string(),
        user: v.string(),
        api_key: v.string(),
        status: v.string(),
        call_type: v.string(),
        spend: v.number(),
        prompt_tokens: v.number(),
        completion_tokens: v.number(),
        total_tokens: v.number(),
        model_id: v.string(),
        model_group: v.string(),
        startTime: v.pipe(
          v.date(),
          v.transform((d) => d.toISOString()),
        ),
        endTime: v.pipe(
          v.date(),
          v.transform((d) => d.toISOString()),
        ),
      }),
    );

    return {
      spendLogs: v.parse(schema, spendLogs),
      totalSpendLogs,
    };
  }

  async getRouterSettings(): Promise<RouterSettings> {
    let routerSettings = this.routerSettingsCache.get(
      ROUTER_SETTINGS_CACHE_KEY,
    );

    if (routerSettings) {
      return routerSettings;
    }

    const routerSettingsRaw = await this.client.liteLLM_Config.findUnique({
      where: {
        param_name: 'router_settings',
      },
    });

    if (routerSettingsRaw) {
      routerSettings = v.parse(
        routerSettingsSchema,
        routerSettingsRaw.param_value,
      );
    } else {
      routerSettings = {};
    }

    this.routerSettingsCache.set(ROUTER_SETTINGS_CACHE_KEY, routerSettings);

    return routerSettings;
  }

  async getModelAlias(): Promise<Record<string, string | undefined>> {
    const routerSettings = await this.getRouterSettings();
    if (!routerSettings.model_group_alias) {
      return {};
    } else {
      return Object.entries(routerSettings.model_group_alias).reduce<
        Record<string, string | undefined>
      >((aliases, [alias, model]) => {
        if (typeof model === 'object' && model !== null) {
          aliases[alias] = model.model;
        } else {
          aliases[alias] = model ?? undefined;
        }
        return aliases;
      }, {});
    }
  }
}

export function createLitellmDatabaseClient(): LitellmDatabaseClient {
  return new LitellmDatabaseClient();
}

export const litellmDatabaseClient = createLitellmDatabaseClient();
