import ctx from 'express-http-context';
import * as v from 'valibot';
import { litellm } from '../../../services/litellm';
import { CTX_GLOBAL_KEYS, STATUS_CODES } from '../../../utils/consts';
import { Auth, authMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';
import { throwHttpError } from '../../../utils/error';
import { Key } from '../../../types/litellm';

const inputSchema = v.object({
  keyOrKeyHash: v.string(),
});

export const deleteKey = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  middlewares: [
    authMiddleware,
    async (req, res, next, { body }) => {
      const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

      const key = await litellm.getKey({
        keyOrKeyHash: body.keyOrKeyHash,
      });

      if (key && key.userId !== user.userId) {
        throwHttpError({
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
      await litellm.deleteKey({
        keyOrKeyHashes: [key.keyOrKeyHash],
      });
    }
  },
});
