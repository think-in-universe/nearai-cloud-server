import ctx from 'express-http-context';
import * as v from 'valibot';
import { litellm } from '../../../services/litellm';
import { CTX_GLOBAL_KEYS, INPUT_LIMITS } from '../../../utils/consts';
import { Auth, authMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';

const inputSchema = v.object({
  keyAlias: v.optional(
    v.pipe(v.string(), v.maxLength(INPUT_LIMITS.KEY_ALIAS_MAX_LENGTH)),
  ),
});

const outputSchema = v.object({
  key: v.string(),
  expires: v.nullable(v.string()),
});

export const generateKey = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  output: outputSchema,
  middlewares: [authMiddleware],
  resolve: async ({ inputs: { body } }) => {
    const { user }: Auth = ctx.get(CTX_GLOBAL_KEYS.AUTH);

    const { key, expires } = await litellm.generateKey({
      userId: user.userId,
      keyAlias: body.keyAlias,
      models: ['all-team-models'],
      teamId: undefined, // TODO
      maxBudget: undefined, // TODO
      rpmLimit: undefined, // TODO
      tpmLimit: undefined, // TODO
    });

    return {
      key,
      expires,
    };
  },
});
