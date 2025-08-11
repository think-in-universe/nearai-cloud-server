import ctx from 'express-http-context';
import * as v from 'valibot';
import { Auth, authMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import { CTX_GLOBAL_KEYS, INPUT_LIMITS } from '../../../utils/consts';
import { toShortKeyAlias } from '../../../utils/common';

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
  keys: v.array(
    v.object({
      keyOrKeyHash: v.string(),
      keyName: v.string(),
      keyAlias: v.nullable(v.string()),
      spend: v.number(),
      expires: v.nullable(v.string()),
      userId: v.nullable(v.string()),
      rpmLimit: v.nullable(v.number()),
      tpmLimit: v.nullable(v.number()),
      budgetId: v.nullable(v.string()),
      maxBudget: v.nullable(v.number()),
      budgetDuration: v.nullable(v.string()),
      budgetResetAt: v.nullable(v.string()),
      blocked: v.nullable(v.boolean()),
      createdAt: v.string(),
      metadata: v.record(v.string(), v.string()),
    }),
  ),
  totalKeys: v.number(),
  page: v.number(),
  pageSize: v.number(),
  totalPages: v.number(),
});

export const listKeys = createRouteResolver({
  inputs: {
    query: inputSchema,
  },
  output: outputSchema,
  middlewares: [authMiddleware],
  resolve: async ({ inputs: { query } }) => {
    const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

    const keys = await adminLitellmApiClient.listKeys({
      userId: user.userId,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    return {
      keys: keys.keys.map((key) => {
        return {
          ...key,
          keyAlias:
            key.userId && key.keyAlias
              ? toShortKeyAlias(key.userId, key.keyAlias)
              : key.keyAlias,
        };
      }),
      totalKeys: keys.totalKeys,
      page: keys.page,
      pageSize: keys.pageSize,
      totalPages: keys.totalPages,
    };
  },
});
