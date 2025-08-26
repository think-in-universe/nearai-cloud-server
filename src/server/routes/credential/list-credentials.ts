import { createRouteResolver } from '../../middlewares/route-resolver';
import { litellmServiceAccountAuthMiddleware } from '../../middlewares/auth';
import * as v from 'valibot';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';

const outputSchema = v.array(
  v.object({
    credentialName: v.string(),
    providerName: v.string(),
    providerApiUrl: v.string(),
    providerApiKey: v.string(),
  }),
);

export const listCredentials = createRouteResolver({
  output: outputSchema,
  middlewares: [litellmServiceAccountAuthMiddleware],
  resolve: async () => {
    return adminLitellmApiClient.listCredential();
  },
});
