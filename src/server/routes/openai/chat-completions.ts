import { BEARER_TOKEN_PREFIX } from '../../../utils/consts';
import { createRouteResolver } from '../../middlewares/route-resolver';
import { createLitellmApiClient } from '../../../services/litellm-api-client';
import { createHash } from 'crypto';

export const chatCompletions = createRouteResolver({
  resolve: async ({ req }) => {
    const litellmApiClient = createLitellmApiClient(
      req.headers.authorization?.slice(BEARER_TOKEN_PREFIX.length) ?? '',
    );

    const xRequestHash = createHash('sha256')
      .update(req.body)
      .digest()
      .toString('hex');

    return litellmApiClient.chatCompletions({
      ...JSON.parse(req.body.toString()),
      extra_headers: {
        'X-Request-Hash': xRequestHash,
      },
    });
  },
});
