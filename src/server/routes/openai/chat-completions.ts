import { BEARER_TOKEN_PREFIX } from '../../../utils/consts';
import { createRouteResolver } from '../../middlewares/route-resolver';
import { createLitellmApiClient } from '../../../services/litellm-api-client';

export const chatCompletions = createRouteResolver({
  resolve: async ({ req }) => {
    const litellmApiClient = createLitellmApiClient(
      req.headers.authorization?.slice(BEARER_TOKEN_PREFIX.length) ?? '',
    );
    return litellmApiClient.chatCompletions(req.body);
  },
});
