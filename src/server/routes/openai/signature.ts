import { createRouteResolver } from '../../middlewares/route-resolver';
import { keyAuthMiddleware } from '../../middlewares/auth';
import * as v from 'valibot';
import * as ctx from 'express-http-context';
import { litellmDatabaseClient } from '../../../services/litellm-database-client';
import { createOpenAiHttpError } from '../../../utils/error';
import { STATUS_CODES } from '../../../utils/consts';
import { createPrivateLlmApiClient } from '../../../services/private-llm-api-client';
import { InternalModelParams } from '../../../types/litellm-database-client';
import { nearAiCloudDatabaseClient } from '../../../services/nearai-cloud-database-client';
import { logger } from '../../../services/logger';

const paramsInputSchema = v.object({
  chat_id: v.string(),
});

const queryInputSchema = v.object({
  model: v.string(),
  signing_algo: v.union([v.literal('ecdsa'), v.literal('ed25519')]),
});

const outputSchema = v.object({
  text: v.string(),
  signature: v.string(),
  signing_address: v.string(),
  signing_algo: v.union([v.literal('ecdsa'), v.literal('ed25519')]),
});

export const signature = createRouteResolver({
  inputs: {
    params: paramsInputSchema,
    query: queryInputSchema,
  },
  output: outputSchema,
  middlewares: [
    keyAuthMiddleware,
    async (req, res, next, { query }) => {
      const modelParamsList =
        await litellmDatabaseClient.listInternalModelParams(query.model);

      if (modelParamsList.length === 0) {
        throw createOpenAiHttpError({
          status: STATUS_CODES.BAD_REQUEST,
          message: 'Invalid model',
        });
      }

      ctx.set('modelParamsList', modelParamsList);

      next();
    },
  ],
  resolve: async ({ inputs: { params, query } }) => {
    const modelParamsList: InternalModelParams[] = ctx.get('modelParamsList');

    const cache = await nearAiCloudDatabaseClient.getSignatures(
      params.chat_id,
      query.signing_algo,
    );

    if (cache.length > 0) {
      return cache[0];
    }

    const signatures = modelParamsList.map((modelParams) => {
      const client = createPrivateLlmApiClient(
        modelParams.apiKey,
        modelParams.apiUrl,
      );

      const f = async () => {
        const signature = await client.signature({
          chat_id: params.chat_id,
          model: modelParams.model,
          signing_algo: query.signing_algo,
        });
        return {
          signature,
          modelParams,
        };
      };

      return f();
    });

    try {
      // In order to solve the problem of not being able to
      // synchronously query the actual model corresponding
      // to the chat, we iterate through calling the API of each model
      const { signature, modelParams } = await Promise.any(signatures);

      nearAiCloudDatabaseClient
        .setSignature(
          modelParams.modelId,
          params.chat_id,
          modelParams.model,
          signature,
        )
        .catch((reason) => {
          logger.error(`Failed to set chat message signature: ${reason}`);
        });

      return signature;
    } catch (e: unknown) {
      if (e instanceof AggregateError) {
        logger.error(
          `Failed to get signature: ${JSON.stringify(
            e.errors.map((error) => `${error}`),
            undefined,
            2,
          )}`,
        );
      }
      throw createOpenAiHttpError({
        status: STATUS_CODES.NOT_FOUND,
        message: 'Chat id not found or expired',
      });
    }
  },
});
