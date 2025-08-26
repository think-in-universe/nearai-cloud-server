import * as v from 'valibot';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import { INPUT_LIMITS } from '../../../utils/consts';
import { litellmServiceAccountAuthMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';

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
  users: v.array(
    v.object({
      userId: v.string(),
      userEmail: v.nullable(v.string()),
      maxBudget: v.nullable(v.number()),
      spend: v.number(),
    }),
  ),
  totalUsers: v.number(),
  page: v.number(),
  pageSize: v.number(),
  totalPages: v.number(),
});

export const listUsers = createRouteResolver({
  inputs: {
    query: inputSchema,
  },
  output: outputSchema,
  middlewares: [litellmServiceAccountAuthMiddleware],
  resolve: async ({ inputs: { query } }) => {
    return adminLitellmApiClient.listUsers({
      page: query.page,
      pageSize: query.pageSize,
    });
  },
});
