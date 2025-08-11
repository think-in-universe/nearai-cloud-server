import ctx from 'express-http-context';
import * as v from 'valibot';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import { CTX_GLOBAL_KEYS, STATUS_CODES } from '../../../utils/consts';
import { Auth, authMiddleware } from '../../middlewares/auth';
import { createOpenAiHttpError } from '../../../utils/error';
import { createRouteResolver } from '../../middlewares/route-resolver';
import { Key } from '../../../types/litellm-api-client';
import { toShortKeyAlias } from '../../../utils/common';

const inputSchema = v.object({
  keyOrKeyHash: v.string(),
});

const outputSchema = v.nullable(
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
    metadata: v.record(v.string(), v.unknown()),
  }),
);

export const getKey = createRouteResolver({
  inputs: {
    query: inputSchema,
  },
  output: outputSchema,
  middlewares: [
    authMiddleware,
    async (req, res, next, { query }) => {
      const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

      const key = await adminLitellmApiClient.getKey({
        keyOrKeyHash: query.keyOrKeyHash,
      });

      if (key && key.userId !== user.userId) {
        throw createOpenAiHttpError({
          status: STATUS_CODES.FORBIDDEN,
          message:
            'No permission to access the key that is owned by other users',
        });
      }

      ctx.set('key', key);

      next();
    },
  ],
  resolve: async () => {
    const key: Key | null = ctx.get('key');

    if (!key) {
      return null;
    } else {
      return {
        keyOrKeyHash: key.keyOrKeyHash,
        keyName: key.keyName,
        keyAlias:
          key.userId && key.keyAlias
            ? toShortKeyAlias(key.userId, key.keyAlias)
            : key.keyAlias,
        spend: key.spend,
        expires: key.expires,
        userId: key.userId,
        rpmLimit: key.rpmLimit,
        tpmLimit: key.tpmLimit,
        budgetId: key.budgetId,
        maxBudget: key.maxBudget,
        budgetDuration: key.budgetDuration,
        budgetResetAt: key.budgetResetAt,
        blocked: key.blocked,
        createdAt: key.createdAt,
        metadata: key.metadata,
      };
    }
  },
});
