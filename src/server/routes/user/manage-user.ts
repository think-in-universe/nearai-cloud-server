import * as v from 'valibot';
import { litellmServiceAccountAuthMiddleware } from '../../middlewares/auth';
import { createRouteResolver } from '../../middlewares/route-resolver';
import { adminLitellmApiClient } from '../../../services/litellm-api-client';

const inputSchema = v.object({
  userId: v.string(),
  maxBudget: v.nullable(v.number()),
});

export const manageUser = createRouteResolver({
  inputs: {
    body: inputSchema,
  },
  middlewares: [litellmServiceAccountAuthMiddleware],
  resolve: async ({ inputs: { body } }) => {
    await adminLitellmApiClient.manageUser({
      userId: body.userId,
      maxBudget: body.maxBudget,
    });
  },
});
