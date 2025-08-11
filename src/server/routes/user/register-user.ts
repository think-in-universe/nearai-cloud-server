import ctx from 'express-http-context';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import { CTX_GLOBAL_KEYS } from '../../../utils/consts';
import { SupabaseAuth, supabaseAuthMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';

export const registerUser = createRouteResolver({
  middlewares: [supabaseAuthMiddleware],
  resolve: async () => {
    const { supabaseUser }: SupabaseAuth = ctx.get(
      CTX_GLOBAL_KEYS.SUPABASE_AUTH,
    );

    await adminLitellmApiClient.registerUser({
      userId: supabaseUser.id,
      userEmail: supabaseUser.email,
    });
  },
});
