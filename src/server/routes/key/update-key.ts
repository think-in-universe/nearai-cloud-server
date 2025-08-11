import ctx from 'express-http-context';
import * as v from 'valibot';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import {
  CTX_GLOBAL_KEYS,
  INPUT_LIMITS,
  STATUS_CODES,
} from '../../../utils/consts';
import { Auth, authMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';
import { createOpenAiHttpError } from '../../../utils/error';
import { toFullKeyAlias } from '../../../utils/common';

const inputSchema = v.object({
  keyOrKeyHash: v.string(),
  keyAlias: v.optional(
    v.pipe(v.string(), v.maxLength(INPUT_LIMITS.KEY_ALIAS_MAX_LENGTH)),
  ),
  maxBudget: v.optional(v.number()),
  blocked: v.optional(v.boolean()),
});

export const updateKey = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  middlewares: [
    authMiddleware,
    async (req, res, next, { body }) => {
      const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

      const key = await adminLitellmApiClient.getKey({
        keyOrKeyHash: body.keyOrKeyHash,
      });

      if (!key) {
        throw createOpenAiHttpError({
          status: STATUS_CODES.BAD_REQUEST,
          message: 'Cannot update a key that does not exist',
        });
      }

      if (key.userId !== user.userId) {
        throw createOpenAiHttpError({
          status: STATUS_CODES.FORBIDDEN,
          message:
            'No permission to access the key that is owned by other users',
        });
      }

      next();
    },
  ],
  resolve: async ({ inputs: { body } }) => {
    const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

    await adminLitellmApiClient.updateKey({
      keyOrKeyHash: body.keyOrKeyHash,
      keyAlias: body.keyAlias
        ? toFullKeyAlias(user.userId, body.keyAlias)
        : undefined,
      maxBudget: body.maxBudget,
      blocked: body.blocked,
    });
  },
});
