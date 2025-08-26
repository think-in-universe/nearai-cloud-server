import { createRouteResolver } from '../../middlewares/route-resolver';
import * as v from 'valibot';
import { authMiddleware } from '../../middlewares/auth';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import { INPUT_LIMITS } from '../../../utils/consts';

const inputSchema = v.object({
  page: v.optional(
    v.pipe(
      v.string(),
      v.transform((page) => Number(page)),
      v.integer(),
      v.minValue(INPUT_LIMITS.MIN_PAGE),
    ),
  ),
  pageSize: v.optional(
    v.pipe(
      v.string(),
      v.transform((pageSize) => Number(pageSize)),
      v.integer(),
      v.minValue(INPUT_LIMITS.MIN_PAGE_SIZE),
      v.maxValue(INPUT_LIMITS.MAX_PAGE_SIZE),
    ),
  ),
});

const outputSchema = v.object({
  models: v.array(
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
  ),
  totalModels: v.number(),
  page: v.number(),
  pageSize: v.number(),
  totalPages: v.number(),
});

export const listModels = createRouteResolver({
  inputs: {
    query: inputSchema,
  },
  output: outputSchema,
  middlewares: [authMiddleware],
  resolve: async ({ inputs: { query } }) => {
    return adminLitellmApiClient.listModelsPagination({
      page: query.page,
      pageSize: query.pageSize,
    });
  },
});
