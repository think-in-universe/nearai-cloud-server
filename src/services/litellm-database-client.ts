import { PrismaClient } from '../../.prisma/generated/litellm';
import { litellmDecryptValue } from '../utils/crypto';
import * as v from 'valibot';
import {
  InternalModelParams,
  LitellmCredentialValues,
} from '../types/litellm-database-client';

export class LitellmDatabaseClient {
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  async getInternalModelParams(
    modelName: string,
  ): Promise<InternalModelParams | null> {
    const proxyModel = await this.client.liteLLM_ProxyModelTable.findFirst({
      where: {
        model_name: modelName,
      },
    });

    if (!proxyModel) {
      return null;
    }

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
}

export function createLitellmDatabaseClient(): LitellmDatabaseClient {
  return new LitellmDatabaseClient();
}

export const litellmDatabaseClient = createLitellmDatabaseClient();
