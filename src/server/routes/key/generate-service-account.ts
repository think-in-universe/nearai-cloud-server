import { createRouteResolver } from '../../middlewares/route-resolver';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';
import * as v from 'valibot';
import { adminAuthMiddleware } from '../../middlewares/auth';
import { SERVICE_ACCOUNT_TEAM_ID } from '../../../utils/consts';

const inputSchema = v.object({
  serviceAccountId: v.pipe(v.string(), v.nonEmpty()),
});

const outputSchema = v.object({
  key: v.string(),
  expires: v.nullable(v.string()),
});

export const generateServiceAccount = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  output: outputSchema,
  middlewares: [adminAuthMiddleware],
  resolve: async ({ inputs: { body } }) => {
    const { key, expires } = await adminLitellmApiClient.generateServiceAccount(
      {
        serviceAccountId: body.serviceAccountId,
        keyAlias: body.serviceAccountId,
        keyType: 'management',
        models: ['all-team-models'],
        teamId: SERVICE_ACCOUNT_TEAM_ID,
      },
    );

    return {
      key,
      expires,
    };
  },
});
