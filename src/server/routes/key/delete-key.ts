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

const inputSchema = v.object({
  keyHash: v.pipe(v.string(), v.hash([INPUT_LIMITS.KEY_HASH_TYPE])),
});

export const deleteKey = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  middlewares: [
    authMiddleware,
    async (req, res, next, { body }) => {
      const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

      const key = await adminLitellmApiClient.getKey({
        keyOrKeyHash: body.keyHash,
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
