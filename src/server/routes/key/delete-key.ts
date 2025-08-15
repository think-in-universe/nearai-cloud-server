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
import { Key } from '../../../types/litellm-api-client';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const inputSchema = v.object({
  keyHash: v.pipe(v.string(), v.hash([INPUT_LIMITS.KEY_HASH_TYPE])),
});

/**
 * @deprecated
 */
const inputSchemaLegacy = v.object({
  keyOrKeyHash: v.optional(v.string()),
  keyHash: v.optional(v.pipe(v.string(), v.hash([INPUT_LIMITS.KEY_HASH_TYPE]))),
});

export const deleteKey = createRouteResolver({
  inputs: {
    body: inputSchemaLegacy,
  },
  middlewares: [
    authMiddleware,
    async (req, res, next, { body }) => {
      const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

      if (!body.keyHash && !body.keyOrKeyHash) {
        throw createOpenAiHttpError({
          status: STATUS_CODES.BAD_REQUEST,
          message: 'Missing keyHash',
        });
      }

      const key = await adminLitellmApiClient.getKey({
        keyOrKeyHash: body.keyHash ?? body.keyOrKeyHash!,
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

    if (key) {
      await adminLitellmApiClient.deleteKey({
        keyOrKeyHashes: [key.keyHash],
      });
    }
  },
});
