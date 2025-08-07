import ctx from 'express-http-context';
import * as v from 'valibot';
import { litellm } from '../../../services/litellm';
import { CTX_GLOBAL_KEYS } from '../../../utils/consts';
import { SupabaseAuth, supabaseAuthMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';

const outputSchema = v.nullable(
  v.object({
    userId: v.string(),
    userEmail: v.nullable(v.string()),
    maxBudget: v.nullable(v.number()),
    spend: v.number(),
  }),
);

export const getUser = createRouteResolver({
  output: outputSchema,
  middlewares: [supabaseAuthMiddleware],
  resolve: async () => {
    const { supabaseUser }: SupabaseAuth = ctx.get(
      CTX_GLOBAL_KEYS.SUPABASE_AUTH,
    );

    const user = await litellm.getUser({
      userId: supabaseUser.id,
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.userId,
      userEmail: user.userEmail,
      maxBudget: user.maxBudget,
      spend: user.spend,
    };
  },
});
