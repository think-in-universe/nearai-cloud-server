import ctx from 'express-http-context';
import * as v from 'valibot';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import { CTX_GLOBAL_KEYS, INPUT_LIMITS } from '../../../utils/consts';
import { Auth, authMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';

const inputSchema = v.object({
  keyHash: v.pipe(v.string(), v.hash([INPUT_LIMITS.KEY_HASH_TYPE])),
  startDate: v.optional(v.pipe(v.string(), v.isoDate())),
  endDate: v.optional(v.pipe(v.string(), v.isoDate())),
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
  spendLogs: v.array(
    v.object({
      userId: v.string(),
      keyHash: v.string(),
      status: v.string(),
      callType: v.string(),
      spend: v.number(),
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
      modelId: v.string(),
      model: v.string(),
      startTime: v.string(),
      endTime: v.string(),
    }),
  ),
  totalSpendLogs: v.number(),
  page: v.number(),
  pageSize: v.number(),
  totalPages: v.number(),
});

export const getSpendLogs = createRouteResolver({
  inputs: {
    query: inputSchema,
  },
  output: outputSchema,
  middlewares: [authMiddleware],
  resolve: async ({ inputs: { query } }) => {
    const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

    return await adminLitellmApiClient.getSpendLogsPagination({
      userId: user.userId,
      keyOrKeyHash: query.keyHash,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      pageSize: query.pageSize,
    });
  },
});
