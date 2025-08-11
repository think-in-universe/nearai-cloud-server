import ctx from 'express-http-context';
import { KeyAuth, keyAuthMiddleware } from '../../middlewares/auth';
import { CTX_GLOBAL_KEYS } from '../../../utils/consts';
import { createRouteResolver } from '../../middlewares/route-resolver';

export const models = createRouteResolver({
  middlewares: [keyAuthMiddleware],
  resolve: async () => {
    const { litellmApiClient }: KeyAuth = ctx.get(CTX_GLOBAL_KEYS.KEY_AUTH);
    return litellmApiClient.models();
  },
});
