import { createRouteResolver } from '../../middlewares/route-resolver';
import { litellmServiceAccountAuthMiddleware } from '../../middlewares/auth';
import * as v from 'valibot';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';

const inputSchema = v.object({
  credentialName: v.pipe(v.string(), v.nonEmpty()),
  providerName: v.optional(v.pipe(v.string(), v.nonEmpty())),
  providerApiUrl: v.pipe(v.string(), v.url()),
  providerApiKey: v.pipe(v.string(), v.nonEmpty()),
});

export const createCredential = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  middlewares: [litellmServiceAccountAuthMiddleware],
  resolve: async ({ inputs: { body } }) => {
    await adminLitellmApiClient.createCredential({
      credentialName: body.credentialName,
      providerName: body.providerName,
      providerApiUrl: body.providerApiUrl,
      providerApiKey: body.providerApiKey,
    });
  },
});
