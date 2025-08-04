import ctx from 'express-http-context';
import * as v from 'valibot';
import { Auth, authMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';
import { litellm } from '../../../services/litellm';
import { CTX_GLOBAL_KEYS, INPUT_LIMITS } from '../../../utils/consts';

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
      v.transform((page) => Number(page)),
      v.integer(),
      v.minValue(INPUT_LIMITS.MIN_PAGE_SIZE),
      v.maxValue(INPUT_LIMITS.MAX_PAGE_SIZE),
    ),
  ),
});

const outputSchema = v.nullable(
  v.object({
    keyHashes: v.array(v.string()),
    totalKeys: v.number(),
    page: v.number(),
    pageSize: v.number(),
    totalPages: v.number(),
  }),
);

export const getKeys = createRouteResolver({
  inputs: {
    query: inputSchema,
  },
  output: outputSchema,
  middlewares: [authMiddleware],
  resolve: async ({ inputs: { query } }) => {
    const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

    const keys = await litellm.listKeys({
      userId: user.userId,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    return {
      keyHashes: keys.keyHashes,
      totalKeys: keys.totalKeys,
      page: keys.page,
      pageSize: keys.pageSize,
      totalPages: keys.totalPages,
    };
  },
});
