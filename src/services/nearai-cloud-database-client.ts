import { PrismaClient } from '../../.prisma/generated/nearai-cloud';
import { Signature, SigningAlgo } from '../types/privatellm-api-client';

export class NearAiCloudDatabaseClient {
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  async getSignatures(
    chatId: string,
    signingAlgo: SigningAlgo,
  ): Promise<Signature[]> {
    const signatures = await this.client.nearAi_MessageSignatures.findMany({
      where: {
        chat_id: chatId,
        signing_algo: signingAlgo,
      },
    });

    return signatures.map((signature) => {
      return {
        text: signature.text,
        signature: signature.signature,
        signing_address: signature.signing_address,
        signing_algo: signature.signing_algo as SigningAlgo,
      };
    });
  }

  async setSignature(
    modelId: string,
    chatId: string,
    model: string,
    signature: Signature,
  ) {
    await this.client.nearAi_MessageSignatures.create({
      data: {
        ...signature,
        model_id: modelId,
        chat_id: chatId,
        model,
      },
    });
  }
}

export function createNearAiCloudDatabaseClient(): NearAiCloudDatabaseClient {
  return new NearAiCloudDatabaseClient();
}

export const nearAiCloudDatabaseClient = createNearAiCloudDatabaseClient();
