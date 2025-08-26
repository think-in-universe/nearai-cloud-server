import { createRouteResolver } from '../../middlewares/route-resolver';
import * as v from 'valibot';
import { authMiddleware } from '../../middlewares/auth';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import { litellmDatabaseClient } from '../../../services/litellm-database-client';
import { createOpenAiHttpError } from '../../../utils/error';
import { STATUS_CODES } from '../../../utils/consts';
import ctx from 'express-http-context';

const inputSchema = v.object({
  modelId: v.optional(v.string()),
  modelName: v.optional(v.string()),
});

const outputSchema = v.nullable(
  v.object({
    modelId: v.string(),
    model: v.string(),
    providerModelName: v.string(),
    providerName: v.string(),
    credentialName: v.string(),
    inputCostPerToken: v.number(),
    outputCostPerToken: v.number(),
    metadata: v.object({
      verifiable: v.nullable(v.boolean()),
      contextLength: v.nullable(v.number()),
      modelFullName: v.nullable(v.string()),
      modelDescription: v.nullable(v.string()),
      modelIcon: v.nullable(v.string()),
    }),
  }),
);

export const getModel = createRouteResolver({
  inputs: {
    query: inputSchema,
  },
  output: outputSchema,
  middlewares: [
    authMiddleware,
    async (req, res, next, { query }) => {
      if (!query.modelId && !query.modelName) {
        throw createOpenAiHttpError({
          status: STATUS_CODES.BAD_REQUEST,
          message: 'Missing modelId or modelName',
        });
      }

      let modelId = query.modelId;

      if (!modelId) {
        modelId =
          (await litellmDatabaseClient.getModelIdByName(query.modelName!)) ??
          undefined;
      }

      ctx.set('modelId', modelId);

      next();
    },
  ],
  resolve: async () => {
    const modelId = ctx.get('modelId');

    if (!modelId) {
      return null;
    }

    return adminLitellmApiClient.getModel({
      modelId,
    });
  },
});
