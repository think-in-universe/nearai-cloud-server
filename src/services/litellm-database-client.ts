import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { litellmDecryptValue } from '../utils/crypto';
import * as v from 'valibot';
import {
  InternalModelParams,
  LitellmCredentialValues,
} from '../types/litellm-database-client';
import { Signature, SigningAlgo } from '../types/privatellm-api-client';

export class LitellmDatabaseClient {
  private client: PrismaClient;

  constructor(datasourceUrl: string) {
    this.client = new PrismaClient({
      datasourceUrl,
    });
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

  async getSignature(
    modelId: string,
    chatId: string,
    signingAlgo: SigningAlgo,
  ): Promise<Signature | null> {
    const signature = await this.client.nearAI_MessageSignatures.findUnique({
      where: {
        model_id_chat_id_signing_algo: {
          model_id: modelId,
          chat_id: chatId,
          signing_algo: signingAlgo,
        },
      },
    });

    if (!signature) {
      return null;
    }

    return {
      text: signature.text,
      signature: signature.signature,
      signing_address: signature.signing_address,
      signing_algo: signature.signing_algo as SigningAlgo,
    };
  }

  async setSignature(
    modelId: string,
    chatId: string,
    model: string,
    signature: Signature,
  ) {
    await this.client.nearAI_MessageSignatures.create({
      data: {
        ...signature,
        model_id: modelId,
        chat_id: chatId,
        model,
      },
    });
  }
}

export function createLitellmDatabaseClient(
  datasourceUrl = config.litellm.dbUrl,
): LitellmDatabaseClient {
  return new LitellmDatabaseClient(datasourceUrl);
}

export const litellmDatabaseClient = createLitellmDatabaseClient();
